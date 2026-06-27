import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { prisma } from "../db";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const notFound = (_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
};

export const requireDb = (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!prisma) {
    return res
      .status(503)
      .json({ error: "Database not connected. Set DATABASE_URL in .env." });
  }
  next();
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err instanceof ZodError) {
    return res
      .status(400)
      .json({ error: "Validation failed", issues: err.flatten() });
  }
  // Prisma-specific: record not found
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code: string }).code;
    if (code === "P2025") {
      return res.status(404).json({ error: "Not found" });
    }
  }
  console.error("[err]", err);
  return res
    .status(500)
    .json({ error: "Internal server error", detail: String(err) });
};
