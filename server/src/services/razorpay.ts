import Razorpay from "razorpay";
import crypto from "crypto";
import { config, integrations } from "../config";

let _client: Razorpay | null = null;

function client(): Razorpay {
  if (!integrations.razorpay) {
    throw new Error("Razorpay not configured (RAZORPAY_KEY_ID/SECRET missing)");
  }
  if (!_client) {
    _client = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
  }
  return _client;
}

export interface CreateOrderInput {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}

export async function createRazorpayOrder(input: CreateOrderInput) {
  if (config.useMocks) {
    // Mock mode: return a fake but well-formed order. The signature is
    // computed using the dev JWT secret as if it were the key secret,
    // so verify() in mock mode will accept any matching signature.
    const id = `mock_order_${input.receipt}`;
    return {
      id,
      entity: "order",
      amount: input.amountPaise,
      amount_paid: 0,
      amount_due: input.amountPaise,
      currency: "INR",
      receipt: input.receipt,
      status: "created",
      attempts: 0,
      notes: input.notes ?? {},
      created_at: Math.floor(Date.now() / 1000),
    };
  }
  return client().orders.create({
    amount: input.amountPaise,
    currency: "INR",
    receipt: input.receipt,
    notes: input.notes,
  });
}

export interface VerifyInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export function verifyRazorpaySignature(input: VerifyInput): boolean {
  if (config.useMocks) {
    // In mock mode we accept signatures that match the dev pattern
    // "mock_sig_<orderId>". Anything else returns false.
    return input.razorpaySignature === `mock_sig_${input.razorpayOrderId}`;
  }
  if (!config.razorpay.keySecret) return false;
  const expected = crypto
    .createHmac("sha256", config.razorpay.keySecret)
    .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
    .digest("hex");
  return expected === input.razorpaySignature;
}

export function mockPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string
): string {
  return `mock_sig_${razorpayOrderId}`;
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  if (config.useMocks) {
    return signature.startsWith("mock_sig_");
  }
  if (!config.razorpay.webhookSecret) return false;
  const expected = crypto
    .createHmac("sha256", config.razorpay.webhookSecret)
    .update(rawBody)
    .digest("hex");
  return expected === signature;
}
