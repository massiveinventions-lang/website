import { Router, Request, Response } from "express";
import { z } from "zod";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { prisma } from "../db";
import { requireDb, HttpError } from "../middleware/errors";
import { signSessionJwt } from "../middleware/auth";
import { config } from "../config";
import { sendLoginOtp } from "../services/email";

const router = Router();
router.use(requireDb);

// OTP TTL — 10 minutes is plenty for a human to type it in.
const OTP_TTL_MIN = 10;
// How long the user must wait between resend attempts.
const RESEND_COOLDOWN_S = 45;

// Rate limit: max 5 OTP requests per email per 15 minutes, and 20 per IP
// per 15 minutes. Prevents brute-force enumeration and spamming.
const perEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => (req.body?.email ?? "anon").toString().toLowerCase(),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many OTP requests. Try again in 15 minutes." },
});

const perIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many OTP requests from your IP. Slow down." },
});

function generateOtp(): string {
  // 6-digit zero-padded code, e.g. "042731".
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, "0");
}

function hashCode(code: string): string {
  return crypto
    .createHmac("sha256", config.jwtSecret)
    .update(`otp:${code}`)
    .digest("hex");
}

const RequestBody = z.object({
  email: z.string().trim().toLowerCase().email(),
});

// POST /api/auth/request-otp
router.post(
  "/request-otp",
  perIpLimiter,
  perEmailLimiter,
  async (req: Request, res: Response) => {
    const body = RequestBody.parse(req.body);

    // Cooldown: refuse if a non-expired OTP was issued within the last 45s.
    const recent = await prisma.loginOtp.findFirst({
      where: {
        email: body.email,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
    if (recent) {
      const ageMs = Date.now() - recent.createdAt.getTime();
      const waitS = Math.max(0, Math.ceil(RESEND_COOLDOWN_S - ageMs / 1000));
      if (waitS > 0) {
        res.json({
          ok: true,
          cooldownSeconds: waitS,
        });
        return;
      }
    }

    const code = generateOtp();
    const codeHash = hashCode(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);

    await prisma.loginOtp.create({
      data: {
        email: body.email,
        codeHash,
        expiresAt,
      },
    });

    await sendLoginOtp({
      email: body.email,
      code,
      expiresInMinutes: OTP_TTL_MIN,
    });

    res.json({
      ok: true,
      expiresInMinutes: OTP_TTL_MIN,
      // Only included in dev so the UI can show the code. Never present in prod.
      devCode: config.useMocks ? code : undefined,
    });
  }
);

const VerifyBody = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
});

// POST /api/auth/verify-otp
router.post("/verify-otp", async (req: Request, res: Response) => {
  const body = VerifyBody.parse(req.body);

  // Find the most recent unused, unexpired OTP for this email.
  const otp = await prisma.loginOtp.findFirst({
    where: {
      email: body.email,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) {
    throw new HttpError(400, "Code expired or never issued. Request a new one.");
  }

  if (otp.codeHash !== hashCode(body.code)) {
    throw new HttpError(400, "Invalid code");
  }

  // Mark used + ensure user row exists.
  await prisma.loginOtp.update({
    where: { id: otp.id },
    data: { usedAt: new Date() },
  });

  const isAdmin = config.adminEmails.includes(body.email);
  const name = body.email.split("@")[0];
  // Deterministic user id from email. Stable across sessions, so Order.userId
  // foreign keys remain valid as the user logs in again. (Supabase Auth would
  // supply its own uuid in the real Supabase path; the OTP path doesn't have
  // a separate identity provider, so we derive one.)
  const userId = crypto
    .createHash("sha256")
    .update(`user:${body.email}`)
    .digest("hex")
    .slice(0, 36);
  const dbUser = await prisma.user.upsert({
    where: { email: body.email },
    update: isAdmin ? { role: "admin" } : {},
    create: {
      id: userId,
      email: body.email,
      name,
      role: isAdmin ? "admin" : "customer",
      addresses: "[]",
    },
  });

  // Issue a session JWT. The user is now authenticated.
  const token = signSessionJwt(body.email, dbUser.id);

  res.json({
    ok: true,
    token,
    email: body.email,
    isNewSession: !isAdmin, // hint for UI: first time vs returning
  });
});

// POST /api/auth/logout — stateless; client just discards the token.
// Kept here so the frontend has a single endpoint to call for symmetry.
router.post("/logout", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

export default router;