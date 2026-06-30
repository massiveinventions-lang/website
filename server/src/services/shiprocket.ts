import { config, integrations } from "../config";

const BASE = "https://apiv2.shiprocket.in/v1/external";

let _token: { value: string; expiresAt: number } | null = null;

async function auth(): Promise<string> {
  if (config.useMocks) return "mock_token";
  if (!integrations.shiprocket) {
    throw new Error(
      "Shiprocket not configured (SHIPROCKET_EMAIL/PASSWORD missing)"
    );
  }
  const fs = require("fs");
  const tokenPath = require("path").join(process.cwd(), ".shiprocket_token");
  
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
    headers: { 
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    },
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
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
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
  }[];
  paymentMethod: "COD" | "Prepaid";
  shippingCharges?: number;
  giftwrapCharges?: number;
  transactionFee?: number;
}

export async function createAdhocOrder(input: CreateShipmentInput) {
  return call<{ order_id: number; shipment_id: number; status: string }>(
    "/orders/create/adhoc",
    {
      method: "POST",
      body: JSON.stringify({
        order_id: input.orderId,
        order_date: input.orderDate,
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
        length: 10,
        breadth: 10,
        height: 10,
        weight: 0.5,
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
