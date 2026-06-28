import { PrismaClient } from "@prisma/client";
import { resolveDatabaseUrl } from "./db-bootstrap";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

let _client: PrismaClient | null = null;
let _initialised = false;

export async function connectDB(): Promise<void> {
  if (_initialised) return;
  await resolveDatabaseUrl();
  if (!process.env.DATABASE_URL) {
    console.error("[db] DATABASE_URL not set. Endpoints needing DB will return 503.");
    return;
  }
  _client =
    globalThis.__prisma ??
    new PrismaClient({
      log:
        process.env.NODE_ENV === "production"
          ? ["error"]
          : ["error", "warn"],
    });
  globalThis.__prisma = _client;
  try {
    await _client.$connect();
    console.log("[db] Prisma connected");
  } catch (err) {
    console.error("[db] Prisma connect failed:", err);
    throw err;
  }
  // In production: push schema to ensure tables exist (idempotent).
  // In dev with SQLite: also push schema.
  const isPostgres = process.env.DATABASE_URL?.startsWith("postgresql") || process.env.DATABASE_URL?.startsWith("postgres");
  if (isPostgres || process.env.DATABASE_URL?.startsWith("file:")) {
    try {
      const { execSync } = await import("child_process");
      execSync("npx prisma db push --skip-generate --accept-data-loss", {
        stdio: "pipe",
        timeout: 60_000,
      });
      console.log("[db] schema pushed");
    } catch (err) {
      // Non-fatal: log and continue. Tables may already exist.
      console.warn(
        "[db] schema push skipped:",
        err instanceof Error ? err.message : err
      );
    }
  }
  _initialised = true;
}

export function isDbReady(): boolean {
  return Boolean(_client);
}

export function getPrisma(): PrismaClient {
  if (!_client) throw new Error("Prisma not initialised");
  return _client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!_client) {
      throw new Error("Prisma client accessed before connectDB()");
    }
    return Reflect.get(_client, prop);
  },
});

export async function disconnectDB(): Promise<void> {
  if (_client) await _client.$disconnect();
}
