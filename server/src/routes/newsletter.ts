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

// POST /api/newsletter/subscribe
// Idempotent: re-subscribing the same email returns 200 with { alreadySubscribed: true }.
router.post("/subscribe", async (req: Request, res: Response) => {
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
