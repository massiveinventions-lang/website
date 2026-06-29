import { Router, Request, Response } from "express";
import { z } from "zod";
import { requireAuth, requireAdmin, signAdminJwt } from "../middleware/auth";
import { prisma } from "../db";
import { trackByAwb } from "../services/shiprocket";
import { integrations, config } from "../config";
import { HttpError, requireDb } from "../middleware/errors";

const router = Router();

// ---- Public admin auth ----

const LoginBody = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

// POST /api/admin/login
// Issues a signed admin JWT. Password is compared against ADMIN_PASSWORD
// (or, if unset, defaults to "admin" for first-time local setup).
// Email must be in ADMIN_EMAILS allowlist.
router.post("/login", (req: Request, res: Response) => {
  const body = LoginBody.parse(req.body);
  if (!config.adminEmails.includes(body.email)) {
    throw new HttpError(401, "Invalid credentials");
  }
  const expected = process.env.ADMIN_PASSWORD;
  if (process.env.NODE_ENV === "production" && !expected) {
    throw new HttpError(500, "Admin login disabled: ADMIN_PASSWORD not configured on server.");
  }
  const validPassword = expected ?? "admin";
  if (body.password !== validPassword) {
    throw new HttpError(401, "Invalid credentials");
  }
  const token = signAdminJwt(body.email);
  res.json({ token, email: body.email });
});

// All routes below require a valid admin JWT.
router.use(requireAuth, requireAdmin, requireDb);

// ---- Stats ----

// GET /api/admin/stats
router.get("/stats", async (_req: Request, res: Response) => {
  const [orders, paidOrders, products, users, revenueAgg, subscribers] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "paid" } }),
      prisma.product.count(),
      prisma.user.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: {
            in: ["paid", "shipped", "delivered", "replacement"],
          },
        },
      }),
      prisma.newsletterSubscriber.count(),
    ]);
  res.json({
    orders,
    paidOrders,
    products,
    users,
    revenue: revenueAgg._sum.total ?? 0,
    subscribers,
  });
});

// ---- Orders ----

// GET /api/admin/orders?limit=50&skip=0&status=paid
router.get("/orders", async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const skip = Number(req.query.skip ?? 0);
  const status = req.query.status as string | undefined;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    orders: orders.map(deserializeOrder),
    total,
    limit,
    skip,
  });
});

// GET /api/admin/orders/:id
router.get("/orders/:id", async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: String(req.params.id) },
  });
  if (!order) throw new HttpError(404, "Order not found");
  res.json({ order: deserializeOrder(order) });
});

// PATCH /api/admin/orders/:id/status
router.patch("/orders/:id/status", async (req: Request, res: Response) => {
  const { status } = req.body as { status?: string };
  const allowed = [
    "pending",
    "paid",
    "shipped",
    "out_for_delivery",
    "delivered",
    "replacement",
    "cancelled",
    "refunded",
  ];
  if (!status || !allowed.includes(status))
    throw new HttpError(400, `status must be one of ${allowed.join(", ")}`);
  const order = await prisma.order.update({
    where: { id: String(req.params.id) },
    data: { status },
  });
  res.json({ order });
});

// GET /api/admin/orders/:id/track
router.get("/orders/:id/track", async (req: Request, res: Response) => {
  const order = await prisma.order.findUnique({ where: { id: String(req.params.id) } });
  if (!order) throw new HttpError(404, "Order not found");
  const info = JSON.parse(order.shippingInfo || "{}") as { awb?: string };
  const awb = info.awb;
  if (!awb) throw new HttpError(400, "Order has no AWB yet");
  if (!integrations.shiprocket || config.useMocks) {
    return res.json({ awb, tracking: null, stub: true });
  }
  const tracking = await trackByAwb(awb);
  res.json({ awb, tracking });
});

// ---- Newsletter subscribers ----

// GET /api/admin/newsletter/subscribers?limit=100&skip=0&q=foo
router.get("/newsletter/subscribers", async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 100), 500);
  const skip = Number(req.query.skip ?? 0);
  const q = req.query.q as string | undefined;

  const where: Record<string, unknown> = {};
  if (q) where.email = { contains: q.toLowerCase() };

  const [subscribers, total] = await Promise.all([
    prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.newsletterSubscriber.count({ where }),
  ]);

  res.json({ subscribers, total, limit, skip });
});

// ---- Helpers ----

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

// ---- Replacement requests ----

// GET /api/admin/replacement-requests?status=pending&limit=50
router.get("/replacement-requests", async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const skip = Number(req.query.skip ?? 0);
  const status = req.query.status as string | undefined;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;

  const [requests, total] = await Promise.all([
    prisma.replacementRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.replacementRequest.count({ where }),
  ]);

  res.json({ requests, total, limit, skip });
});

// GET /api/admin/replacement-requests/:id
router.get("/replacement-requests/:id", async (req: Request, res: Response) => {
  const request = await prisma.replacementRequest.findUnique({
    where: { id: String(req.params.id) },
  });
  if (!request) throw new HttpError(404, "Replacement request not found");
  res.json({ request });
});

// PATCH /api/admin/replacement-requests/:id
router.patch("/replacement-requests/:id", async (req: Request, res: Response) => {
  const { status, adminNotes } = req.body as {
    status?: string;
    adminNotes?: string;
  };
  const allowed = ["pending", "approved", "declined", "resolved"];
  if (!status || !allowed.includes(status)) {
    throw new HttpError(400, `status must be one of ${allowed.join(", ")}`);
  }
  const updated = await prisma.replacementRequest.update({
    where: { id: String(req.params.id) },
    data: {
      status,
      ...(adminNotes !== undefined ? { adminNotes } : {}),
    },
  });
  res.json({ request: updated });
});

export default router;