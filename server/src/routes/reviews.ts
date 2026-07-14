import { Router, Request, Response } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { requireDb, HttpError } from "../middleware/errors";

const router = Router();
router.use(requireDb);

// Rate limit writes to one review / 30s / IP. Public read is uncapped.
const writeLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Slow down — try again in a moment." },
});

const CreateBody = z.object({
  productId: z.string().trim().min(1).max(64),
  rating: z.number().int().min(1).max(5),
  text: z.string().trim().min(1).max(2000),
});

function toJSON(r: {
  id: string;
  productId: string;
  userId: string;
  authorName: string | null;
  rating: number;
  text: string;
  createdAt: Date;
}) {
  return {
    id: r.id,
    productId: r.productId,
    // userId is included so the client can decide which rows belong to
    // the current user (i.e. render the delete button) without an extra
    // round-trip. Server-side authorisation is still the source of truth.
    userId: r.userId,
    authorName: r.authorName,
    rating: r.rating,
    text: r.text,
    createdAt: r.createdAt.toISOString(),
  };
}

// GET /api/reviews?productId=<id>
// Public — anyone can read reviews. Newest first.
router.get("/", async (req: Request, res: Response) => {
  const productId = String(req.query.productId ?? "").trim();
  if (!productId) throw new HttpError(400, "productId is required");

  const reviews = await prisma.productReview.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json({ reviews: reviews.map(toJSON) });
});

// POST /api/reviews
// Auth required. Body: { productId, rating (1..5), text (1..2000) }.
router.post("/", requireAuth, writeLimiter, async (req: Request, res: Response) => {
  const body = CreateBody.parse(req.body);

  if (!req.userId) {
    throw new HttpError(401, "Authentication required");
  }

  // Make sure the product actually exists. Returning 404 (not 400) lets
  // the frontend distinguish "the product is gone" from "your input
  // was malformed" and react accordingly.
  const product = await prisma.product.findUnique({
    where: { id: body.productId },
    select: { id: true },
  });
  if (!product) throw new HttpError(404, "Product not found");

  const authorName =
    (req.user?.name && req.user.name.trim()) ||
    (req.userEmail ? req.userEmail.split("@")[0] : null);

  const created = await prisma.productReview.create({
    data: {
      productId: body.productId,
      userId: req.userId,
      authorName,
      rating: body.rating,
      text: body.text,
    },
  });

  res.status(201).json({ review: toJSON(created) });
});

// DELETE /api/reviews/:id
// Auth required. Only the original author can delete.
router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  if (!req.userId) {
    throw new HttpError(401, "Authentication required");
  }

  const id = String(req.params.id);
  const review = await prisma.productReview.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!review) throw new HttpError(404, "Review not found");

  if (review.userId !== req.userId) {
    throw new HttpError(403, "You can only delete your own reviews");
  }

  await prisma.productReview.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;
