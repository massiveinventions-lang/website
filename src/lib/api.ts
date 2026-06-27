/**
 * Frontend ↔ backend adapter.
 *
 * The frontend reads product data via this module, which fetches from
 * the backend (`/api/products`) when `VITE_API_URL` is set, and falls
 * back to the local hard-coded data when it isn't (so the UI never
 * breaks during dev).
 *
 * Auth: the session token (Supabase JWT or dev stub) is auto-injected
 * by `getAuthToken()`. Callers can override per-request with the
 * `token` option.
 */

import { getAuthToken } from "./supabase";

const RAW_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "";

export const API_BASE = RAW_BASE.replace(/\/+$/, "");

// On the same origin, prefer relative paths so the Vite proxy or any
// future reverse-proxy works without changes.
const url = (path: string): string => {
  if (!path.startsWith("/")) path = "/" + path;
  return API_BASE ? API_BASE + path : path;
};

export type ImageRef = string | { src: string; position?: string };

export const imgSrc = (img: ImageRef | undefined | null): string => {
  if (!img) return "";
  return typeof img === "string" ? img : img.src;
};

export const imgPosition = (img: ImageRef | undefined | null): string => {
  if (!img || typeof img === "string") return "center";
  return img.position ?? "center";
};

export interface ApiProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  category: string;
  badge?: string;
  image: ImageRef;
  hoverImage?: ImageRef;
  images?: ImageRef[];
  description: string;
  longDescription?: string;
  inStock: boolean;
  stock?: number;
  specs: { label: string; value: string }[];
  features: string[];
  colors: { name: string; hex: string }[];
  sku?: string;
}

export interface ApiOrder {
  _id: string;
  userId?: string;
  customerEmail?: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  shippingAddress?: ShippingAddress;
  payment?: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
  };
  shipping_?: {
    awb?: string;
    courier?: string;
    trackingUrl?: string;
  };
  createdAt: string;
}

export interface ShippingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  phone: string;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  token?: string
): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  // Auto-inject auth header from the session if caller didn't pass one.
  if (!headers.has("Authorization")) {
    const authToken = token ?? (await getAuthToken());
    if (authToken) headers.set("Authorization", `Bearer ${authToken}`);
  }
  // 10s timeout — fail fast if the backend is unreachable instead of
  // leaving the UI in a perpetual loading state.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url(path), {
      ...init,
      headers,
      signal: controller.signal,
    });
    if (!res.ok) {
      let detail: unknown = undefined;
      try {
        detail = await res.json();
      } catch {}
      throw new ApiError(res.status, detail);
    }
    return (await res.json()) as T;
  } catch (err) {
    if ((err as Error)?.name === "AbortError") {
      throw new ApiError(0, { error: "Request timed out" });
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export class ApiError extends Error {
  status: number;
  detail?: unknown;
  constructor(status: number, detail?: unknown) {
    super(`API ${status}`);
    this.status = status;
    this.detail = detail;
  }
}

// ---- Products -----------------------------------------------------------

export const products = {
  list: (params: { category?: string; q?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.category) qs.set("category", params.category);
    if (params.q) qs.set("q", params.q);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<{ products: ApiProduct[] }>(`/api/products${suffix}`);
  },
  get: (id: string) =>
    request<{ product: ApiProduct }>(`/api/products/${id}`),
  create: (body: Partial<ApiProduct>, token: string) =>
    request<{ product: ApiProduct }>(`/api/products`, {
      method: "POST",
      body: JSON.stringify(body),
    }, token),
  update: (id: string, body: Partial<ApiProduct>, token: string) =>
    request<{ product: ApiProduct }>(`/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }, token),
  remove: (id: string, token: string) =>
    request<{ ok: true }>(`/api/products/${id}`, { method: "DELETE" }, token),
};

// ---- Orders -------------------------------------------------------------

export interface CreateOrderInput {
  items: { productId: string; quantity: number }[];
  shippingAddress: ShippingAddress;
}

export const orders = {
  create: (body: CreateOrderInput, token: string) =>
    request<{
      order: { id: string; total: number };
      razorpay: {
        orderId: string;
        amountPaise: number;
        currency: string;
        keyId: string;
        stub?: boolean;
      };
    }>(`/api/orders/create`, {
      method: "POST",
      body: JSON.stringify(body),
    }, token),

  verify: (
    body: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    },
    token: string
  ) =>
    request<{ ok: true; orderId: string }>(`/api/orders/verify`, {
      method: "POST",
      body: JSON.stringify(body),
    }, token),

  mine: (token: string) =>
    request<{ orders: ApiOrder[] }>(`/api/orders/mine`, {}, token),

  get: (id: string, token: string) =>
    request<{ order: ApiOrder }>(`/api/orders/${id}`, {}, token),
};

// ---- Admin --------------------------------------------------------------

export const admin = {
  stats: (token: string) =>
    request<{
      orders: number;
      paidOrders: number;
      products: number;
      users: number;
      revenue: number;
    }>(`/api/admin/stats`, {}, token),
  setStatus: (id: string, status: string, token: string) =>
    request<{ order: ApiOrder }>(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }, token),
  track: (id: string, token: string) =>
    request<{ awb: string; tracking: unknown }>(
      `/api/admin/orders/${id}/track`,
      {},
      token
    ),
};

// ---- Helpers ------------------------------------------------------------

/** True if the backend is reachable (i.e. VITE_API_URL is set). */
export const backendEnabled = (): boolean => Boolean(API_BASE);
