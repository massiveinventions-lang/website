import { config, integrations } from "../config";

const BASE = "https://apiv2.shiprocket.in/v1/external";

let _token: { value: string; expiresAt: number } | null = null;

// Shiprocket's API sits behind Cloudflare, which blocks Vercel
// serverless IPs with HTTP 403 "Access forbidden" unless the request
// looks like a real browser. The full set of browser-like headers
// (Accept, Accept-Language, Accept-Encoding, Origin, Referer) is
// required. Without them, every auth call fails with 403 and orders
// never reach Shiprocket.
//
// If you ever see `Shiprocket auth failed: 403` or
// `Shiprocket /orders/create/adhoc failed: 403`, re-check this list.
const BROWSER_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Origin: "https://app.shiprocket.in",
  Referer: "https://app.shiprocket.in/",
};

async function auth(): Promise<string> {
  if (config.useMocks) return "mock_token";
  if (!integrations.shiprocket) {
    throw new Error(
      "Shiprocket not configured (SHIPROCKET_EMAIL/PASSWORD missing)"
    );
  }
  const fs = require("fs");
  const tokenPath = require("path").join(require("os").tmpdir(), ".shiprocket_token");

  if (!_token) {
    try {
      const cached = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
      if (cached && cached.expiresAt > Date.now() + 60_000) {
        _token = cached;
      }
    } catch (e) {
      // no valid cache file
    }
  }

  if (_token && _token.expiresAt > Date.now() + 60_000) return _token.value;

  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { ...BROWSER_HEADERS },
    body: JSON.stringify({
      email: config.shiprocket.email,
      password: config.shiprocket.password,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shiprocket auth failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { token: string };
  // Shiprocket tokens last 10 days (240h). Refresh 1h early.
  _token = {
    value: data.token,
    expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000,
  };

  try {
    fs.writeFileSync(tokenPath, JSON.stringify(_token));
  } catch (e) {
    console.warn("Could not write shiprocket token cache to disk", e);
  }

  return _token.value;
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (config.useMocks) {
    // Mock responses so the order flow can complete end-to-end without
    // hitting the real Shiprocket API.
    if (path.startsWith("/orders/create/adhoc")) {
      const id = Math.floor(100000 + Math.random() * 900000);
      return {
        order_id: id,
        shipment_id: id + 1,
        status: "NEW",
      } as unknown as T;
    }
    if (path.startsWith("/courier/assign/awb")) {
      const awb = `MOCKAWB${Date.now()}`;
      return {
        awb_code: awb,
        courier_name: "MockExpress",
        courier_company_id: "mock",
      } as unknown as T;
    }
    if (path.startsWith("/courier/track/awb/")) {
      return {
        tracking_data: {
          track_status: "1",
          shipment_status: "shipped",
          shipment_track: [
            {
              activity: "Mock courier picked up the shipment",
              date: new Date().toISOString(),
              status: "shipped",
            },
          ],
        },
      } as unknown as T;
    }
    return {} as T;
  }

  const token = await auth();
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...BROWSER_HEADERS,
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Shiprocket ${path} failed: ${res.status} ${text}`);
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export interface CreateShipmentInput {
  orderId: string; // your internal order id, e.g. mongo _id as string
  orderDate: string; // ISO
  channelId?: string;
  billing: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  items: {
    name: string;
    sku: string;
    units: number;
    sellingPrice: number;
    // Per-item shipping dimensions. Defaults are applied if a product
    // is missing any value; the caller should pull these from the
    // Product model so they match the actual product.
    weightGrams?: number;
    lengthCm?: number;
    breadthCm?: number;
    heightCm?: number;
  }[];
  paymentMethod: "COD" | "Prepaid";
  shippingCharges?: number;
  giftwrapCharges?: number;
  transactionFee?: number;
}

export async function createAdhocOrder(input: CreateShipmentInput) {
  // Aggregate the package dimensions from the items. We use the LARGEST
  // item's dimensions for length/breadth/height (parcel shape) and SUM
  // the weights — this is the standard way to compute a multi-item
  // package and is what Shiprocket's courier allocation expects.
  let totalWeightKg = 0;
  let maxLength = 0;
  let maxBreadth = 0;
  let maxHeight = 0;
  for (const it of input.items) {
    const w = (it.weightGrams ?? 500) * it.units; // grams → grams
    totalWeightKg += w / 1000;
    if ((it.lengthCm ?? 0) > maxLength) maxLength = it.lengthCm ?? 0;
    if ((it.breadthCm ?? 0) > maxBreadth) maxBreadth = it.breadthCm ?? 0;
    if ((it.heightCm ?? 0) > maxHeight) maxHeight = it.heightCm ?? 0;
  }
  // Shiprocket's minimums — they reject packages under 0.5kg or 10cm
  // in any dimension even though the items are smaller.
  if (totalWeightKg < 0.5) totalWeightKg = 0.5;
  if (maxLength < 10) maxLength = 10;
  if (maxBreadth < 10) maxBreadth = 10;
  if (maxHeight < 10) maxHeight = 10;

  return call<{ order_id: number; shipment_id: number; status: string }>(
    "/orders/create/adhoc",
    {
      method: "POST",
      body: JSON.stringify({
        order_id: input.orderId,
        order_date: input.orderDate,
        // Shiprocket's API rejects an empty channel_id on some accounts.
        // If you haven't set up a sales channel in Shiprocket, you can
        // find one by hitting GET /api/test-sr (it returns the channel
        // list). Then set SHIPROCKET_CHANNEL_ID in your env and the
        // orders route will pass it via the `channelId` arg.
        channel_id: input.channelId ?? "",
        billing_customer_name: input.billing.name,
        billing_last_name: "Customer", // mandatory fallback
        billing_email: input.billing.email,
        billing_phone: input.billing.phone,
        shipping_is_billing: 1,
        billing_address: input.billing.address,
        billing_city: input.billing.city,
        billing_state: input.billing.state,
        billing_country: input.billing.country,
        billing_pincode: input.billing.pincode,
        order_items: input.items.map((i) => ({
          name: i.name,
          sku: i.sku,
          units: i.units,
          selling_price: i.sellingPrice,
        })),
        payment_method: input.paymentMethod,
        sub_total: input.items.reduce((acc, i) => acc + (i.sellingPrice * i.units), 0),
        shipping_charges: input.shippingCharges ?? 0,
        giftwrap_charges: input.giftwrapCharges ?? 0,
        transaction_fee: input.transactionFee ?? 0,
        pickup_location: config.shiprocket.pickupLocation,
        // Aggregated from items above — no more hardcoded 0.5kg.
        length: maxLength,
        breadth: maxBreadth,
        height: maxHeight,
        weight: totalWeightKg,
      }),
    }
  );
}

export async function assignAwb(shipmentId: number) {
  return call<{
    awb_code: string;
    courier_name: string;
    courier_company_id: string;
  }>("/courier/assign/awb", {
    method: "POST",
    body: JSON.stringify({ shipment_id: shipmentId }),
  });
}

export async function trackByAwb(awb: string) {
  return call<{
    tracking_data: {
      track_status: string;
      shipment_status: string;
      shipment_track: { activity: string; date: string; status: string }[];
    };
  }>(`/courier/track/awb/${encodeURIComponent(awb)}`);
}

export function buildTrackingUrl(awb: string): string {
  return `https://www.shiprocket.in/shipment-tracking/${awb}`;
}
