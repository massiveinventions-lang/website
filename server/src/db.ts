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
