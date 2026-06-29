import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireDb } from "../middleware/errors";

const router = Router();

router.use(requireDb);

const SubscribeBody = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  source: z.string().trim().min(1).max(64).optional(),
});

const rateLimit = new Map<string, { count: number; expires: number }>();
const MAX_REQUESTS = 5;
const WINDOW_MS = 60 * 1000;

// POST /api/newsletter/subscribe
// Idempotent: re-subscribing the same email returns 200 with { alreadySubscribed: true }.
router.post("/subscribe", async (req: Request, res: Response) => {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const now = Date.now();
  const record = rateLimit.get(ip);
  if (record && record.expires > now) {
    if (record.count >= MAX_REQUESTS) {
      res.status(429).json({ error: "Too many requests. Please try again later." });
      return;
    }
    record.count++;
  } else {
    rateLimit.set(ip, { count: 1, expires: now + WINDOW_MS });
  }
  const body = SubscribeBody.parse(req.body);

  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email: body.email },
  });
  if (existing) {
    res.json({ ok: true, alreadySubscribed: true });
    return;
  }

  await prisma.newsletterSubscriber.create({
    data: {
      email: body.email,
      source: body.source ?? "homepage",
    },
  });

  res.status(201).json({ ok: true, alreadySubscribed: false });
});

export default router;
