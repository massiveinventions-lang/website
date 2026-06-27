/**
 * Seed the 5 products. Idempotent: skips products whose `sku` already exists.
 * Run with:  npm run seed
 */
import { PrismaClient } from "@prisma/client";
import { seedProducts } from "./products-data";

const prisma = new PrismaClient();

function json<T>(v: T): string {
  return JSON.stringify(v ?? null);
}

async function main() {
  console.log(`[seed] upserting ${seedProducts.length} products…`);
  for (const p of seedProducts) {
    const data = {
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice ?? null,
      rating: p.rating ?? 0,
      reviews: p.reviews ?? 0,
      category: p.category,
      badge: p.badge ?? null,
      image: json(p.image),
      hoverImage: p.hoverImage ? json(p.hoverImage) : null,
      images: p.images ? json(p.images) : null,
      description: p.description,
      longDescription: p.longDescription ?? null,
      inStock: p.inStock ?? true,
      stock: p.stock ?? 100,
      specs: json(p.specs),
      features: json(p.features),
      colors: json(p.colors),
      sku: p.sku ?? null,
    };
    if (p.sku) {
      await prisma.product.upsert({
        where: { sku: p.sku },
        update: data,
        create: { id: crypto.randomUUID(), ...data },
      });
    } else {
      await prisma.product.create({ data: { id: crypto.randomUUID(), ...data } });
    }
  }
  const all = await prisma.product.findMany({
    select: { name: true, category: true, price: true },
  });
  console.log(`[seed] done — ${all.length} products in DB:`);
  for (const p of all) {
    console.log(`  - [${p.category}] ${p.name} — ₹${p.price}`);
  }
}

main()
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
