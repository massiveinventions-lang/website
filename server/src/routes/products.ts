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

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: Number(skip ?? 0),
    take: Math.min(Number(limit ?? 100), 200),
  });
  res.json({ products: products.map(toJSON) });
});

// GET /api/products/:id
router.get("/:id", async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { id: String(req.params.id) },
  });
  if (!product) throw new HttpError(404, "Product not found");
  res.json({ product: toJSON(product) });
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
