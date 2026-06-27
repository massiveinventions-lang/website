import type { Request, Response, NextFunction, RequestHandler } from "express";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { config, integrations } from "../config";
import { prisma } from "../db";
import { User } from "@prisma/client";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
      userId?: string;
      userEmail?: string;
      supabaseUserId?: string;
    }
  }
}

/**
 * Verify a JWT signed with `JWT_SECRET`. Returns the decoded payload
 * (sub, email, sid, iat, exp) if the signature matches and the token
 * is not expired. Returns null on any failure.
 */
export function verifyJwt(
  token: string
): { sub: string; email?: string; sid?: string; iat?: number; exp?: number } | null {
  if (!config.jwtSecret) return null;
  const [headerB64, payloadB64, sigB64] = token.split(".");
  if (!headerB64 || !payloadB64 || !sigB64) return null;
  const sigInput = `${headerB64}.${payloadB64}`;
  const expected = crypto
    .createHmac("sha256", config.jwtSecret)
    .update(sigInput)
    .digest("base64url");
  if (
    expected.length !== sigB64.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sigB64))
  ) {
    return null;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8")
    ) as {
      sub?: string;
      email?: string;
      sid?: string;
      iat?: number;
      exp?: number;
    };
    if (!payload.sub) return null;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Sign an admin JWT (HS256, base64url). */
export function signAdminJwt(email: string, ttlSeconds = 60 * 60 * 24 * 7): string {
  return signJwt({ sub: "admin", email }, ttlSeconds);
}

/** Sign a session JWT for a verified OTP login. */
export function signSessionJwt(
  email: string,
  sid: string,
  ttlSeconds = 60 * 60 * 24 * 30
): string {
  return signJwt({ sub: "session", email, sid }, ttlSeconds);
}

function signJwt(
  payload: Record<string, unknown>,
  ttlSeconds: number
): string {
  if (!config.jwtSecret) throw new Error("JWT_SECRET not configured");
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + ttlSeconds };
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const headerB64 = b64(header);
  const payloadB64 = b64(fullPayload);
  const sig = crypto
    .createHmac("sha256", config.jwtSecret)
    .update(`${headerB64}.${payloadB64}`)
    .digest("base64url");
  return `${headerB64}.${payloadB64}.${sig}`;
}

/** @deprecated — use verifyJwt and check payload.sub === "admin" */
export function verifyAdminJwt(token: string): { email: string } | null {
  const p = verifyJwt(token);
  if (!p || p.sub !== "admin" || !p.email) return null;
  return { email: p.email };
}

let _supabaseAdmin: SupabaseClient | null = null;

function adminClient(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _supabaseAdmin;
}

async function loadOrCreateUser(
  supabaseUserId: string,
  email: string,
  name?: string | null
): Promise<User> {
  const isAdmin = config.adminEmails.includes(email.toLowerCase());
  const existing = await prisma.user.findUnique({ where: { id: supabaseUserId } });
  if (existing) {
    if (isAdmin && existing.role !== "admin") {
      return prisma.user.update({
        where: { id: supabaseUserId },
        data: { role: "admin" },
      });
    }
    return existing;
  }
  return prisma.user.create({
    data: {
      id: supabaseUserId,
      email: email.toLowerCase(),
      name: name ?? email.split("@")[0],
      role: isAdmin ? "admin" : "customer",
      addresses: "[]",
    },
  });
}

function makeStubUser(email: string): User {
  const isAdmin = config.adminEmails.includes(email.toLowerCase());
  return {
    id: "00000000-0000-0000-0000-000000000001",
    email,
    name: email.split("@")[0],
    role: isAdmin ? "admin" : "customer",
    addresses: "[]",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export const requireAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const auth = req.header("authorization") ?? "";
  const bearer = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";

  if (!bearer) {
    return res
      .status(401)
      .json({ error: "Missing Authorization: Bearer <token>" });
  }

  // Session JWT path: signed by us after OTP verification.
  // sub="session", email=<user>, sid=<loginOtp id>.
  const sessionToken = verifyJwt(bearer);
  if (sessionToken?.sub === "session" && sessionToken.email) {
    if (config.adminEmails.includes(sessionToken.email.toLowerCase())) {
      // Admin is logging in via the user flow — give them admin role.
      const stub = makeStubUser(sessionToken.email);
      req.user = stub;
      req.userId = stub.id;
      req.userEmail = stub.email;
      req.supabaseUserId = stub.id;
      return next();
    }
    // In mock mode: ensure the User row exists so Order.userId works.
    if (config.useMocks) {
      const stubId = "00000000-0000-0000-0000-000000000001";
      try {
        await prisma.user.upsert({
          where: { id: stubId },
          update: { email: sessionToken.email, role: "customer" },
          create: {
            id: stubId,
            email: sessionToken.email,
            name: sessionToken.email.split("@")[0],
            role: "customer",
            addresses: "[]",
          },
        });
      } catch (e) {
        console.error("[auth] mock session upsert failed:", e);
      }
    }
    const stub = makeStubUser(sessionToken.email);
    req.user = stub;
    req.userId = stub.id;
    req.userEmail = stub.email;
    req.supabaseUserId = stub.id;
    return next();
  }

  // Admin JWT path: signed by us, contains sub="admin" + email. Trust
  // it if signature matches and email is on the ADMIN_EMAILS allowlist.
  const adminToken = verifyAdminJwt(bearer);
  if (adminToken) {
    if (!config.adminEmails.includes(adminToken.email.toLowerCase())) {
      return res.status(403).json({ error: "Admin email not allowlisted" });
    }
    const stub = makeStubUser(adminToken.email);
    req.user = stub;
    req.userId = stub.id;
    req.userEmail = stub.email;
    req.supabaseUserId = stub.id;
    return next();
  }

  // In mock mode, accept any token (treat it as the user's email) and
  // skip real Supabase verification. Also upsert the User row so the
  // Order.userId foreign key is satisfied.
  if (config.useMocks) {
    const email = bearer.includes("@") ? bearer : `${bearer}@example.com`;
    const isAdmin = config.adminEmails.includes(email.toLowerCase());
    const stubId = "00000000-0000-0000-0000-000000000001";
    try {
      await prisma.user.upsert({
        where: { id: stubId },
        update: { email, role: isAdmin ? "admin" : "customer" },
        create: {
          id: stubId,
          email,
          name: email.split("@")[0],
          role: isAdmin ? "admin" : "customer",
          addresses: "[]",
        },
      });
    } catch (e) {
      console.error("[auth] mock upsert failed:", e);
    }
    const stub = makeStubUser(email);
    req.user = stub;
    req.userId = stub.id;
    req.userEmail = stub.email;
    req.supabaseUserId = stub.id;
    return next();
  }

  // Real path: verify with Supabase Auth
  if (!integrations.supabase) {
    return res
      .status(503)
      .json({ error: "Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." });
  }

  try {
    const supabase = adminClient();
    const { data, error } = await supabase.auth.getUser(bearer);
    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    const user = await loadOrCreateUser(
      data.user.id,
      data.user.email ?? "",
      (data.user.user_metadata as { name?: string } | null)?.name ?? null
    );
    req.user = user;
    req.userId = user.id;
    req.userEmail = user.email;
    req.supabaseUserId = data.user.id;
    return next();
  } catch (err) {
    console.error("[auth] verify failed:", err);
    return res
      .status(401)
      .json({ error: "Token verification failed", detail: String(err) });
  }
};

export const requireAdmin: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return res.status(401).json({ error: "Unauthenticated" });
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Admin only" });
  next();
};
