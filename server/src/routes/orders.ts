import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { HttpError, requireDb } from "../middleware/errors";
import { createRazorpayOrder, verifyRazorpaySignature, verifyWebhookSignature } from "../services/razorpay";
import { createAdhocOrder, assignAwb, buildTrackingUrl } from "../services/shiprocket";
import { sendOrderConfirmationEmail } from "../services/email";

export async function postPaymentFulfillment(order: any, userName: string | undefined, userEmail: string | undefined) {
  order.status = "paid"; // Ensure we are working with the updated status
  let awbCode: string | undefined;
  let trackUrl: string | undefined;

  if (integrations.shiprocket || config.useMocks) {
    try {
      const addr = JSON.parse(order.shippingAddress);
      const items = JSON.parse(order.items);
      const ship = await createAdhocOrder({
        orderId: order.id,
        orderDate: new Date().toISOString(),
        billing: {
          name: userName ?? "Customer",
          email: order.customerEmail ?? userEmail ?? "customer@example.com",
          phone: addr.phone,
          address: addr.line1 + (addr.line2 ? ", " + addr.line2 : ""),
          city: addr.city,
          state: addr.state,
          country: addr.country ?? "India",
          pincode: addr.pincode,
        },
        items: items.map((i: any) => ({
          name: i.name,
          sku: i.sku || i.name.slice(0, 40),
          units: i.quantity,
          sellingPrice: i.price,
        })),
        paymentMethod: "Prepaid",
      });
      const awb = await assignAwb(ship.shipment_id);
      awbCode = awb.awb_code;
      trackUrl = buildTrackingUrl(awb.awb_code);

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "shipped",
          shippingInfo: JSON.stringify({
            shiprocketOrderId: String(ship.order_id),
            awb: awbCode,
            courier: awb.courier_name,
            trackingUrl: trackUrl,
          }),
        },
      });
    } catch (err) {
      console.error("[shiprocket] create/assign failed:", err);
    }
  }

  // Always send confirmation email, even if Shiprocket fails
  try {
    const emailTo = order.customerEmail ?? userEmail;
    if (emailTo) {
      await sendOrderConfirmationEmail({
        email: emailTo,
        orderId: order.id,
        total: order.total,
        awb: awbCode,
        trackingUrl: trackUrl,
      });
    }
  } catch (e) {
    console.error("[email] order confirmation failed:", e);
  }
}

import { integrations, config } from "../config";

const router = Router();

// POST /api/orders/create
router.post(
  "/create",
  requireAuth,
  requireDb,
  async (req: Request, res: Response) => {
    const Body = z.object({
      items: z
        .array(
          z.object({
            productId: z.string().min(1),
            quantity: z.number().int().positive(),
          })
        )
        .min(1),
      shippingAddress: z.object({
        line1: z.string().min(1),
        line2: z.string().optional(),
        city: z.string().min(1),
        state: z.string().min(1),
        pincode: z.string().min(6),
        country: z.string().default("India"),
        phone: z.string().min(10),
      }),
    });
    const body = Body.parse(req.body);

    const products = await prisma.product.findMany({
      where: { id: { in: body.items.map((i) => i.productId) } },
    });
    if (products.length !== body.items.length) {
      throw new HttpError(400, "One or more products not found");
    }
    const orderItems = body.items.map((i) => {
      const p = products.find((x) => x.id === i.productId)!;
      return {
        productId: p.id,
        name: p.name,
        sku: p.sku || p.name.slice(0, 40),
        price: p.price,
        quantity: i.quantity,
      };
    });
    const subtotal = orderItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );
    const shipping = 0;
    const total = subtotal + shipping;

    // Ensure the user actually exists in the DB before linking the foreign key.
    // If the auth upsert failed (e.g. transient DB issue), we still want the
    // order to go through, so we'll link it as a "guest" order (userId = null)
    // but keep the customerEmail.
    let validUserId: string | null = null;
    if (req.user?.id) {
      try {
        const dbUser = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (dbUser) validUserId = dbUser.id;
      } catch (e) {
        console.warn("[orders] Failed to verify user existence for FK:", e);
      }
    }

    const order = await prisma.order.create({
      data: {
        userId: validUserId,
        customerEmail: req.userEmail,
        items: JSON.stringify(orderItems),
        subtotal,
        shipping,
        total,
        shippingAddress: JSON.stringify(body.shippingAddress),
        status: "pending",
        payment: "{}",
        shippingInfo: "{}",
      },
    });

    if (config.useMocks || !integrations.razorpay) {
      const fakeRzpId = `stub_order_${order.id}`;
      await prisma.order.update({
        where: { id: order.id },
        data: { payment: JSON.stringify({ ...JSON.parse(order.payment), razorpayOrderId: fakeRzpId }) },
      });
      return res.status(201).json({
        order: { id: order.id, total: order.total },
        razorpay: {
          orderId: fakeRzpId,
          amountPaise: order.total * 100,
          currency: "INR",
          keyId: "rzp_test_stub",
          stub: true,
        },
      });
    }

    const rzp = await createRazorpayOrder({
      amountPaise: order.total * 100,
      receipt: `rcpt_${order.id.replace(/-/g, "").slice(0, 30)}`,
      notes: { orderId: order.id },
    });
    await prisma.order.update({
      where: { id: order.id },
      data: {
        payment: JSON.stringify({
          ...JSON.parse(order.payment),
          razorpayOrderId: rzp.id,
        }),
      },
    });

    res.status(201).json({
      order: { id: order.id, total: order.total },
      razorpay: {
        orderId: rzp.id,
        amountPaise: rzp.amount,
        currency: rzp.currency,
        keyId: config.razorpay.keyId,
      },
    });
  }
);

// POST /api/orders/verify
router.post(
  "/verify",
  requireAuth,
  requireDb,
  async (req: Request, res: Response) => {
    const Body = z.object({
      razorpayOrderId: z.string(),
      razorpayPaymentId: z.string(),
      razorpaySignature: z.string(),
    });
    const body = Body.parse(req.body);

    const ok = config.useMocks ? true : (integrations.razorpay && verifyRazorpaySignature(body));
    if (!ok) throw new HttpError(400, "Invalid payment signature");

    // Find by razorpayOrderId (linear scan — fine for the small data we have)
    const allOrders = await prisma.order.findMany();
    const order = allOrders.find((o) => {
      try {
        return JSON.parse(o.payment).razorpayOrderId === body.razorpayOrderId;
      } catch {
        return false;
      }
    });
    if (!order) throw new HttpError(404, "Order not found");

    const updatedPayment = JSON.stringify({
      ...JSON.parse(order.payment),
      razorpayOrderId: body.razorpayOrderId,
      razorpayPaymentId: body.razorpayPaymentId,
      razorpaySignature: body.razorpaySignature,
    });
    const updateResult = await prisma.order.updateMany({
      where: { id: order.id, status: "pending" },
      data: { status: "paid", payment: updatedPayment },
    });

    if (updateResult.count > 0) {
      void postPaymentFulfillment(order, req.user?.name, req.user?.email).catch(e => console.error("[CRITICAL] postPaymentFulfillment unhandled:", e));
    }

    res.json({ ok: true, orderId: order.id });
  }
);

// POST /api/orders/verify_redirect
// Used by Razorpay when callback_url is set (e.g. mobile UPI redirect flow)
router.post("/verify_redirect", async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.redirect(config.clientOrigin + "/checkout?error=InvalidPayment");
  }

  const ok = config.useMocks ? true : (integrations.razorpay && verifyRazorpaySignature({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  }));
  if (!ok) return res.redirect(config.clientOrigin + "/checkout?error=SignatureFailed");

  const allOrders = await prisma.order.findMany();
  const order = allOrders.find((o) => {
    try {
      return JSON.parse(o.payment).razorpayOrderId === razorpay_order_id;
    } catch {
      return false;
    }
  });

  if (!order) return res.redirect(config.clientOrigin + "/checkout?error=OrderNotFound");

  if (order.status === "pending") {
    const updatedPayment = JSON.stringify({
      ...JSON.parse(order.payment),
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });
    const updateResult = await prisma.order.updateMany({
      where: { id: order.id, status: "pending" },
      data: { status: "paid", payment: updatedPayment },
    });
    if (updateResult.count > 0) {
      void postPaymentFulfillment(order, undefined, order.customerEmail || undefined).catch(e => console.error("[CRITICAL] postPaymentFulfillment unhandled:", e));
    }
  }

  // Redirect to success page and instruct frontend to clear the cart
  return res.redirect(config.clientOrigin + "/track-order?id=" + order.id + "&clear_cart=1");
});

// POST /api/orders/webhook/razorpay
router.post("/webhook/razorpay", async (req: Request, res: Response) => {
  const sig = (req.header("x-razorpay-signature") ?? "").toString();
  const raw = (req as Request & { rawBody?: string }).rawBody ?? "";
  if (!integrations.razorpay || !raw)
    return res.status(200).json({ ok: true, ignored: true });
  if (!verifyWebhookSignature(raw, sig))
    return res.status(400).json({ error: "Invalid webhook signature" });

  const event = req.body as {
    event: string;
    payload?: { payment?: { entity?: { order_id?: string } } };
  };
  if (event.event === "payment.captured" || event.event === "order.paid") {
    const rzpOrderId = event.payload?.payment?.entity?.order_id;
    if (rzpOrderId) {
      const allOrders = await prisma.order.findMany();
      const order = allOrders.find((o) => {
        try {
          return JSON.parse(o.payment).razorpayOrderId === rzpOrderId;
        } catch {
          return false;
        }
      });
      if (order && order.status === "pending") {
        const updateResult = await prisma.order.updateMany({
          where: { id: order.id, status: "pending" },
          data: { status: "paid" },
        });
        if (updateResult.count > 0) {
          void postPaymentFulfillment(order, undefined, order.customerEmail || undefined).catch(e => console.error("[CRITICAL] postPaymentFulfillment unhandled:", e));
        }
      }
    }
  }
  res.json({ ok: true });
});

// GET /api/orders/mine
router.get(
  "/mine",
  requireAuth,
  requireDb,
  async (req: Request, res: Response) => {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ orders: orders.map(deserializeOrder) });
  }
);

// GET /api/orders/:id
router.get(
  "/:id",
  requireAuth,
  requireDb,
  async (req: Request, res: Response) => {
    const order = await prisma.order.findUnique({ where: { id: String(req.params.id) } });
    if (!order) throw new HttpError(404, "Order not found");
    const isOwner = (order.userId === req.user!.id) || (order.customerEmail === req.userEmail);
    const isAdmin = req.user!.role === "admin";
    if (!isOwner && !isAdmin) throw new HttpError(403, "Forbidden");
    res.json({ order: deserializeOrder(order) });
  }
);

// GET /api/orders (admin)
router.get(
  "/",
  requireAdmin,
  requireDb,
  async (_req: Request, res: Response) => {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json({ orders: orders.map(deserializeOrder) });
  }
);

function deserializeOrder(o: {
  id: string;
  userId: string | null;
  customerEmail: string | null;
  items: string;
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: string;
  status: string;
  payment: string;
  shippingInfo: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: o.id,
    userId: o.userId,
    customerEmail: o.customerEmail,
    items: JSON.parse(o.items),
    subtotal: o.subtotal,
    shipping: o.shipping,
    total: o.total,
    shippingAddress: JSON.parse(o.shippingAddress),
    status: o.status,
    payment: JSON.parse(o.payment),
    shippingInfo: JSON.parse(o.shippingInfo),
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

export default router;
