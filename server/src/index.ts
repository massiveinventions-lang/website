import "express-async-errors";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { resolveDatabaseUrl } from "./db-bootstrap";
import { config, integrations } from "./config";
import { connectDB, isDbReady, prisma } from "./db";
import { errorHandler, notFound } from "./middleware/errors";
import productsRouter from "./routes/products";
import ordersRouter from "./routes/orders";
import uploadRouter from "./routes/upload";
import adminRouter from "./routes/admin";
import newsletterRouter from "./routes/newsletter";
import authRouter from "./routes/auth";
import replacementRequestsRouter from "./routes/replacementRequests";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
  app.use(
    cors({
      origin:
        config.clientOrigin === "*"
          ? true
          : config.clientOrigin.split(","),
      credentials: true,
    })
  );
  app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));

  // Razorpay webhook needs raw body for HMAC verification
  app.use(
    "/api/orders/webhook",
    express.raw({ type: "*/*" }),
    (req, _res, next) => {
      (req as Request & { rawBody?: string }).rawBody = Buffer.isBuffer(req.body)
        ? req.body.toString("utf8")
        : typeof req.body === "string"
          ? req.body
          : "";
      next();
    }
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Health / integration status
  app.get("/api/health", async (_req: Request, res: Response) => {
    let dbOk = false;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {
      dbOk = false;
    }
    res.json({
      ok: true,
      env: config.nodeEnv,
      mockMode: config.useMocks,
      database: dbOk,
      integrations: {
        ...integrations,
        database: dbOk,
      },
      time: new Date().toISOString(),
    });
  });

  app.use("/api/products", productsRouter);
  app.use("/api/orders", ordersRouter);
  app.use("/api/upload", uploadRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/newsletter", newsletterRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/replacement-requests", replacementRequestsRouter);

  app.use(notFound);
  app.use((err: unknown, req: Request, res: Response, next: NextFunction) =>
    errorHandler(err, req, res, next)
  );

  return app;
}

async function main() {
  // Set DATABASE_URL (start embedded postgres if needed) BEFORE any
  // Prisma client is constructed.
  await resolveDatabaseUrl();

  // Connect Prisma + push schema
  await connectDB();

  // Auto-seed products if the table is empty
  if (isDbReady()) {
    try {
      const count = await prisma.product.count();
      if (count === 0) {
        const { seedProducts } = await import("../prisma/products-data");
        for (const p of seedProducts) {
          const data = {
            id: crypto.randomUUID(),
            name: p.name,
            price: p.price,
            originalPrice: p.originalPrice ?? null,
            rating: p.rating ?? 0,
            reviews: p.reviews ?? 0,
            category: p.category,
            badge: p.badge ?? null,
            image: JSON.stringify(p.image),
            hoverImage: p.hoverImage ? JSON.stringify(p.hoverImage) : null,
            images: p.images ? JSON.stringify(p.images) : null,
            description: p.description,
            longDescription: p.longDescription ?? null,
            inStock: p.inStock ?? true,
            stock: p.stock ?? 100,
            specs: JSON.stringify(p.specs ?? []),
            features: JSON.stringify(p.features ?? []),
            colors: JSON.stringify(p.colors ?? []),
            sku: p.sku ?? null,
          };
          if (p.sku) {
            await prisma.product.upsert({
              where: { sku: p.sku },
              update: data,
              create: data,
            });
          } else {
            await prisma.product.create({ data });
          }
        }
        console.log(`[boot] seeded ${seedProducts.length} products`);
      }
    } catch (err) {
      console.error("[boot] seed failed:", err);
    }
  }

  const app = createApp();
  app.listen(config.port, () => {
    console.log(
      `[server] listening on http://localhost:${config.port}  (env: ${config.nodeEnv})`
    );
    if (config.useMocks) {
      console.log(
        "[server] MOCK MODE: mock Razorpay, mock Shiprocket, dev-only auth"
      );
    }
  });
}

if (require.main === module) {
  main().catch((err) => {
    console.error("[fatal]", err);
    process.exit(1);
  });
}
