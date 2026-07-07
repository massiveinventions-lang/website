/**
 * One-off endpoint to update product prices in the live DB.
 *
 * Gates by `MIGRATION_SECRET` (same as /api/admin/migrate-db) so it can be
 * invoked from a curl with no login. Intended to be removed after the
 * seed migration lands; the actual product prices should be set via
 * the admin UI going forward.
 *
 * Usage:
 *   curl -X POST https://your-api/api/admin/fix-prices \
 *     -H "Authorization: Bearer <MIGRATION_SECRET>" \
 *     -H "Content-Type: application/json" \
 *     -d '{"updates":[
 *            {"sku":"SPK-SHEESHAM-001","price":1299},
 *            {"sku":"EARBUDS-X-001","price":449}
 *         ]}'
 */
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { HttpError } from "../middleware/errors";

const router = Router();

const Body = z.object({
  updates: z
    .array(
      z.object({
        sku: z.string().min(1),
        price: z.number().int().nonnegative().optional(),
        originalPrice: z.number().int().nonnegative().optional(),
        deliveryCharge: z.number().int().nonnegative().optional(),
      })
    )
    .min(1),
});

router.post("/", async (req, res, next) => {
  try {
    const expected = process.env.MIGRATION_SECRET;
    if (!expected) {
      throw new HttpError(
        503,
        "MIGRATION_SECRET is not set on the server."
      );
    }
    const auth = req.header("authorization") ?? "";
    const provided = auth.toLowerCase().startsWith("bearer ")
      ? auth.slice(7).trim()
      : "";
    if (provided !== expected) {
      throw new HttpError(401, "Invalid or missing MIGRATION_SECRET");
    }

    const body = Body.parse(req.body);
    const results: Array<{ sku: string; updated: boolean; error?: string }> = [];

    for (const u of body.updates) {
      try {
        const data: Record<string, number> = {};
        if (u.price !== undefined) data.price = u.price;
        if (u.originalPrice !== undefined) data.originalPrice = u.originalPrice;
        if (u.deliveryCharge !== undefined) data.deliveryCharge = u.deliveryCharge;

        if (Object.keys(data).length === 0) {
          results.push({ sku: u.sku, updated: false, error: "no fields to update" });
          continue;
        }

        const updated = await prisma.product.update({
          where: { sku: u.sku },
          data,
          select: { id: true, sku: true, name: true, price: true, originalPrice: true, deliveryCharge: true },
        });
        results.push({ sku: u.sku, updated: true });
        console.log(`[fix-prices] ${u.sku}:`, updated);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push({ sku: u.sku, updated: false, error: msg });
        console.error(`[fix-prices] failed for ${u.sku}:`, msg);
      }
    }

    const allOk = results.every((r) => r.updated);
    res.status(allOk ? 200 : 207).json({ ok: allOk, results });
  } catch (err) {
    next(err);
  }
});

export default router;
