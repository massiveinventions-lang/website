import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { HttpError, requireDb } from "../middleware/errors";
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  verifyWebhookSignature,
} from "../services/razorpay";
import {
  createAdhocOrder,
  assignAwb,
  buildTrackingUrl,
} from "../services/shiprocket";
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
        price: p.price,
        quantity: i.quantity,
      };
    });
    const subtotal = orderItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );
    const shipping = subtotal >= 999 ? 0 : 49;
    const total = subtotal + shipping;

    const order = await prisma.order.create({
      data: {
        userId: req.user!.id,
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
      receipt: `rcpt_${order.id}`,
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

    const ok =
      config.useMocks || !integrations.razorpay || verifyRazorpaySignature(body);
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
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "paid", payment: updatedPayment },
    });

    if (integrations.shiprocket || config.useMocks) {
      void (async () => {
        try {
          const addr = JSON.parse(order.shippingAddress) as {
            line1: string;
            line2?: string;
            city: string;
            state: string;
            country?: string;
            pincode: string;
            phone: string;
          };
          const items = JSON.parse(order.items) as Array<{
            name: string;
            productId: string;
            price: number;
            quantity: number;
          }>;
          const ship = await createAdhocOrder({
            orderId: order.id,
            orderDate: new Date().toISOString(),
            billing: {
              name: req.user?.name ?? "Customer",
              phone: addr.phone,
              address: addr.line1 + (addr.line2 ? ", " + addr.line2 : ""),
              city: addr.city,
              state: addr.state,
              country: addr.country ?? "India",
              pincode: addr.pincode,
            },
            items: items.map((i) => ({
              name: i.name,
              sku: i.productId,
              units: i.quantity,
              sellingPrice: i.price,
            })),
            paymentMethod: "Prepaid",
          });
          const awb = await assignAwb(ship.shipment_id);
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: "shipped",
              shippingInfo: JSON.stringify({
                shiprocketOrderId: String(ship.order_id),
                awb: awb.awb_code,
                courier: awb.courier_name,
                trackingUrl: buildTrackingUrl(awb.awb_code),
              }),
            },
          });
        } catch (err) {
          console.error("[shiprocket] create/assign failed:", err);
        }
      })();
    }

    res.json({ ok: true, orderId: order.id });
  }
);

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
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "paid" },
        });
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
    const isOwner = order.userId === req.user!.id;
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
