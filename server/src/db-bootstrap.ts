/**
 * Boot-time DB URL resolution.
 *
 * This file MUST be imported before any module that imports `@prisma/client`,
 * because Prisma reads its connection URL at module-evaluation time.
 *
 * Local dev: DATABASE_URL points to a SQLite file (e.g. file:./dev.db).
 * Production: DATABASE_URL points to the Supabase pooler URL.
 */
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

let resolved = false;

export async function resolveDatabaseUrl(): Promise<string> {
  if (resolved) return process.env.DATABASE_URL ?? "";
  resolved = true;
  if (!process.env.DATABASE_URL) {
    console.error("[db] DATABASE_URL not set in .env");
  }
  return process.env.DATABASE_URL ?? "";
}

export async function stopEmbeddedPg(): Promise<void> {
  // No-op for now (kept for API compatibility)
}
