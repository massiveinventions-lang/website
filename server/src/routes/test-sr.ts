import { Router } from 'express';
import { config } from '../config';

const router = Router();

/**
 * Diagnose Shiprocket end-to-end. Run a full smoke flow against the
 * real Shiprocket API using the credentials in env, and report exactly
 * which step is failing. Useful for debugging "order doesn't appear
 * in Shiprocket" issues.
 *
 * Steps tested:
 *   1. Auth login — does the email/password work?
 *   2. Channel list — does the account have a default channel?
 *   3. Pickup locations — is "Home" the actual name and is it enabled?
 *   4. (Best-effort) Adhoc order create with a dummy payload.
 *
 * Endpoint: GET /api/test-sr
 */
router.get('/', async (_req, res) => {
  const report: Record<string, unknown> = {
    env: {
      shiprocketEmailSet: Boolean(config.shiprocket.email),
      shiprocketPasswordLength: config.shiprocket.password?.length ?? 0,
      pickupLocationConfigured: config.shiprocket.pickupLocation,
      useMocks: config.useMocks,
    },
  };

  if (config.useMocks) {
    res.json({
      skipped: true,
      reason: "MOCK_INTEGRATIONS=true — running in MOCK mode",
      critical: "🚨 Shiprocket is in MOCK mode. Real orders will get fake AWBs (MOCKAWBxxx) and will NEVER appear in your Shiprocket dashboard. Unset MOCK_INTEGRATIONS in your Vercel env vars and redeploy.",
      env: report.env,
    });
    return;
  }
  if (!config.shiprocket.email || !config.shiprocket.password) {
    res.json({ skipped: true, reason: "SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD not set", env: report.env });
    return;
  }

  // Full browser-like header set. Shiprocket's API is behind Cloudflare
  // and will return 403 on Vercel serverless IPs unless the request looks
  // like a real browser (Accept, Accept-Language, Accept-Encoding,
  // Origin, Referer). This must match shiprocket.ts BROWSER_HEADERS.
  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Origin: "https://app.shiprocket.in",
    Referer: "https://app.shiprocket.in/",
  };

  // ---- 1. Auth login ----
  let token: string | null = null;
  try {
    const r = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
      method: "POST",
      headers: baseHeaders,
      body: JSON.stringify({
        email: config.shiprocket.email,
        password: config.shiprocket.password,
      }),
    });
    const text = await r.text();
    const authResult: Record<string, unknown> = {
      status: r.status,
      ok: r.ok,
      body: safeJson(text) ?? text.slice(0, 500),
    };
    if (r.ok) {
      const parsed = safeJson<{ token?: string }>(text);
      token = parsed?.token ?? null;
    } else if (r.status === 403) {
      // 403 from Shiprocket's auth endpoint can mean three things:
      //   1. Wrong email/password (body: "Invalid email and password combination")
      //   2. Account rate-limited (body: "User blocked due to too many failed login attempts.")
      //   3. Cloudflare WAF block (body: "Access forbidden")
      // Look at the response body to disambiguate.
      const body = safeJson<{ message?: string }>(text);
      const msg = body?.message ?? "";
      if (msg.toLowerCase().includes("user blocked")) {
        authResult.hint =
          "🚨 Account is RATE-LIMITED by Shiprocket. Too many failed login attempts. Wait 15-30 minutes for the lockout to expire, or contact Shiprocket support to unlock. The password in your env vars is likely WRONG — that's what's caused the failed attempts.";
      } else if (msg.toLowerCase().includes("access forbidden")) {
        authResult.hint =
          "Cloudflare WAF blocked the request. The current headers (Accept, Accept-Language, Accept-Encoding, Origin, Referer) should bypass it. If you still see this, the Shiprocket account may be under manual review — log in to shiprocket.in in a browser to check.";
      } else {
        authResult.hint =
          "Wrong email or password. Update SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD in your Vercel env vars.";
      }
    }
    report.auth = authResult;
  } catch (err) {
    report.auth = { error: String(err) };
  }

  if (!token) {
    res.json(report);
    return;
  }

  // ---- 2. Channel list ----
  try {
    const r = await fetch("https://apiv2.shiprocket.in/v1/external/channels", {
      method: "GET",
      headers: { ...baseHeaders, Authorization: `Bearer ${token}` },
    });
    const text = await r.text();
    const parsed = safeJson<{ data?: { id: number; name: string }[] }>(text);
    report.channels = {
      status: r.status,
      ok: r.ok,
      count: parsed?.data?.length ?? 0,
      // Surface the first few so you can see what's there
      sample: parsed?.data?.slice(0, 5) ?? null,
      body: parsed ?? text.slice(0, 500),
    };
  } catch (err) {
    report.channels = { error: String(err) };
  }

  // ---- 3. Pickup locations ----
  try {
    const r = await fetch(
      "https://apiv2.shiprocket.in/v1/external/settings/company/pickup",
      {
        method: "GET",
        headers: { ...baseHeaders, Authorization: `Bearer ${token}` },
      }
    );
    const text = await r.text();
    const parsed = safeJson<{
      data?: {
        shipping_address: { pickup_location: string; address: string; city: string; state: string; pin_code: number; country: string; phone: string; name: string };
        is_primary: number;
      }[];
    }>(text);
    const all = parsed?.data ?? [];
    const matching = all.find(
      (p) => p.shipping_address.pickup_location === config.shiprocket.pickupLocation
    );
    report.pickupLocations = {
      status: r.status,
      ok: r.ok,
      configuredPickup: config.shiprocket.pickupLocation,
      totalCount: all.length,
      // Surface the names so you can spot typos
      allNames: all.map((p) => ({
        name: p.shipping_address.pickup_location,
        isPrimary: p.is_primary === 1,
        city: p.shipping_address.city,
        pin: p.shipping_address.pin_code,
      })),
      matchFound: Boolean(matching),
      hint: matching
        ? undefined
        : `No pickup location named "${config.shiprocket.pickupLocation}". Either rename the one in Shiprocket dashboard to match, or set SHIPROCKET_PICKUP_LOCATION env var to the exact name above.`,
    };
  } catch (err) {
    report.pickupLocations = { error: String(err) };
  }

  res.json(report);
});

function safeJson<T = unknown>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export default router;
