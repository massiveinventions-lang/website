import { Router, Request, Response } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../db";
import { requireDb } from "../middleware/errors";

const router = Router();
router.use(requireDb);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Try again in 15 minutes." },
});

const RequestBody = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().max(20).optional(),
  orderId: z.string().trim().max(120).optional(),
  productName: z.string().trim().max(200).optional(),
  reason: z.string().trim().min(1).max(80),
  message: z.string().trim().min(1).max(4000),
});

// POST /api/replacement-requests
// Public endpoint — anyone can submit a replacement request. The contact
// form's "Replacement request" reason calls this. Admin reviews from the
// admin panel at /replacement-requests.
router.post("/", limiter, async (req: Request, res: Response) => {
  const body = RequestBody.parse(req.body);

  const created = await prisma.replacementRequest.create({
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone,
      orderId: body.orderId,
      productName: body.productName,
      reason: body.reason,
      message: body.message,
      status: "pending",
    },
  });

  res.status(201).json({
    ok: true,
    id: created.id,
    message:
      "Your replacement request has been received. Our team will review it and contact you within 4 business hours.",
  });
});

export default router;