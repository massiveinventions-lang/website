import { PrismaClient } from "@prisma/client";
import { resolveDatabaseUrl } from "./db-bootstrap";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const client =
  globalThis.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = client;
}

let _initialised = false;

export async function connectDB(): Promise<void> {
  if (_initialised) return;
  await resolveDatabaseUrl();
  try {
    await client.$connect();
    console.log("[db] Prisma connected");
    _initialised = true;
  } catch (err) {
    console.error("[db] Prisma connect failed:", err);
  }
}

export function isDbReady(): boolean {
  return _initialised;
}

export function getPrisma(): PrismaClient {
  return client;
}

export const prisma = client;

export async function disconnectDB(): Promise<void> {
  await client.$disconnect();
}
