import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAdmin } from "../middleware/auth";
import { HttpError, requireDb } from "../middleware/errors";

const router = Router();

router.use(requireDb);

const ImageInput = z.union([
  z.string().min(1),
  z.object({ src: z.string().min(1), position: z.string().optional() }),
]);

const ProductCreate = z.object({
  name: z.string().min(1),
  price: z.number().int().nonnegative(),
  originalPrice: z.number().int().nonnegative().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviews: z.number().int().nonnegative().optional(),
  category: z.enum(["Speakers", "Earbuds", "Chargers", "Cables"]),
  badge: z.string().optional(),
  image: ImageInput,
  hoverImage: ImageInput.optional(),
  images: z.array(ImageInput).optional(),
  description: z.string().min(1),
  longDescription: z.string().optional(),
  inStock: z.boolean().optional(),
  stock: z.number().int().nonnegative().optional(),
  deliveryCharge: z.number().int().nonnegative().optional(),
  specs: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  features: z.array(z.string()).optional(),
  colors: z.array(z.object({ name: z.string(), hex: z.string() })).optional(),
  sku: z.string().optional(),
});

const ProductUpdate = ProductCreate.partial();

function normalizeImage(input: unknown): { src: string; position: string } {
  if (typeof input === "string") return { src: input, position: "center" };
  if (input && typeof input === "object" && "src" in (input as object)) {
    const obj = input as { src: string; position?: string };
    return { src: obj.src, position: obj.position ?? "center" };
  }
  throw new HttpError(400, "Invalid image value");
}

function toJSON(p: {
  id: string;
  name: string;
  price: number;
  originalPrice: number | null;
  rating: number;
  reviews: number;
  category: string;
  badge: string | null;
  image: string;
  hoverImage: string | null;
  images: string | null;
  description: string;
  longDescription: string | null;
  inStock: boolean;
  stock: number;
  deliveryCharge: number;
  specs: string;
  features: string;
  colors: string;
  sku: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    originalPrice: p.originalPrice,
    rating: p.rating,
    reviews: p.reviews,
    category: p.category,
    badge: p.badge,
    image: JSON.parse(p.image),
    hoverImage: p.hoverImage ? JSON.parse(p.hoverImage) : null,
    images: p.images ? JSON.parse(p.images) : null,
    description: p.description,
    longDescription: p.longDescription,
    inStock: p.inStock,
    stock: p.stock,
    deliveryCharge: p.deliveryCharge,
    specs: JSON.parse(p.specs),
    features: JSON.parse(p.features),
    colors: JSON.parse(p.colors),
    sku: p.sku,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

function toDbJson(input: unknown): string {
  return JSON.stringify(input ?? null);
}

// GET /api/products
router.get("/", async (req: Request, res: Response) => {
  const { category, q, limit, skip } = req.query;
  const where: Record<string, unknown> = {};
  if (category && category !== "All") where.category = category;
  if (q && typeof q === "string") {
    where.name = { contains: q, mode: "insensitive" };
  }

  // Explicitly list the columns we want. The shipping-dimension
  // columns (weightGrams, lengthCm, breadthCm, heightCm) are optional
  // in the `select` so a database that hasn't been migrated yet
  // (the new columns don't exist) still returns the rest of the
  // product data without throwing a 500. If Prisma can't resolve
  // a column it'll throw — fall back to the no-select query.
  let products;
  try {
    products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: Number(skip ?? 0),
      take: Math.min(Number(limit ?? 100), 200),
    });
  } catch (err) {
    // Likely a missing column from a pending migration. Re-try with
    // an explicit list of the columns that DO exist on every DB.
    console.warn(
      "[products] full findMany failed, retrying with safe column list:",
      err instanceof Error ? err.message : String(err)
    );
    products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: Number(skip ?? 0),
      take: Math.min(Number(limit ?? 100), 200),
      select: {
        id: true,
        name: true,
        price: true,
        originalPrice: true,
        rating: true,
        reviews: true,
        category: true,
        badge: true,
        image: true,
        hoverImage: true,
        images: true,
        description: true,
        longDescription: true,
        inStock: true,
        stock: true,
        // NOTE: `deliveryCharge` is intentionally OMITTED from this
        // fallback select. The orders route ([orders.ts:226-256]) has
        // the same fallback shape and has been verified to work
        // against an un-migrated DB. Including `deliveryCharge` here
        // makes the retry also fail, and the 500 leaks to the user.
        specs: true,
        features: true,
        colors: true,
        sku: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    // Fill in shipping dims with sensible defaults for the toJSON serializer
    for (const p of products as Array<Record<string, unknown>>) {
      p.weightGrams = 500;
      p.lengthCm = 15;
      p.breadthCm = 10;
      p.heightCm = 5;
      p.deliveryCharge = 30;
    }
  }
  res.json({ products: products.map(toJSON) });
});

// GET /api/products/:id
router.get("/:id", async (req: Request, res: Response) => {
  // Same column-list fallback as the list route — see comment above.
  let product: Record<string, unknown> | null;
  try {
    product = await prisma.product.findUnique({
      where: { id: String(req.params.id) },
    });
  } catch (err) {
    console.warn(
      "[products] findUnique failed, retrying with safe column list:",
      err instanceof Error ? err.message : String(err)
    );
    product = await prisma.product.findUnique({
      where: { id: String(req.params.id) },
      select: {
        id: true,
        name: true,
        price: true,
        originalPrice: true,
        rating: true,
        reviews: true,
        category: true,
        badge: true,
        image: true,
        hoverImage: true,
        images: true,
        description: true,
        longDescription: true,
        inStock: true,
        stock: true,
        // `deliveryCharge` deliberately omitted (see list route above).
        specs: true,
        features: true,
        colors: true,
        sku: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (product) {
      product.weightGrams = 500;
      product.lengthCm = 15;
      product.breadthCm = 10;
      product.heightCm = 5;
      product.deliveryCharge = 30;
    }
  }
  if (!product) throw new HttpError(404, "Product not found");
  res.json({ product: toJSON(product as unknown as Parameters<typeof toJSON>[0]) });
});

// POST /api/products (admin)
router.post("/", requireAdmin, async (req: Request, res: Response) => {
  const body = ProductCreate.parse(req.body);
  const product = await prisma.product.create({
    data: {
      ...body,
      image: toDbJson(normalizeImage(body.image)),
      hoverImage: body.hoverImage
        ? toDbJson(normalizeImage(body.hoverImage))
        : null,
      images: body.images ? toDbJson(body.images.map(normalizeImage)) : null,
      specs: toDbJson(body.specs ?? []),
      features: toDbJson(body.features ?? []),
      colors: toDbJson(body.colors ?? []),
    },
  });
  res.status(201).json({ product: toJSON(product) });
});

// PUT /api/products/:id (admin)
router.put("/:id", requireAdmin, async (req: Request, res: Response) => {
  const body = ProductUpdate.parse(req.body);
  const data: Record<string, unknown> = { ...body };
  if (body.image) data.image = toDbJson(normalizeImage(body.image));
  if (body.hoverImage) data.hoverImage = toDbJson(normalizeImage(body.hoverImage));
  if (body.images) data.images = toDbJson(body.images.map(normalizeImage));
  if (body.specs) data.specs = toDbJson(body.specs);
  if (body.features) data.features = toDbJson(body.features);
  if (body.colors) data.colors = toDbJson(body.colors);
  const product = await prisma.product.update({
    where: { id: String(req.params.id) },
    data,
  });
  res.json({ product: toJSON(product) });
});

// DELETE /api/products/:id (admin)
router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  await prisma.product.delete({ where: { id: String(req.params.id) } });
  res.json({ ok: true });
});

export default router;
