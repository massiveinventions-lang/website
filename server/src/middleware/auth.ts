import type { Request, Response, NextFunction, RequestHandler } from "express";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { config, integrations } from "../config";
import { prisma, isDbReady } from "../db";
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
 * Verify a JWT signed with `JWT_SECRET` using the jsonwebtoken library.
 * Returns the decoded payload or null on any failure.
 */
export function verifyJwt(
  token: string
): { sub: string; email?: string; sid?: string; iat?: number; exp?: number } | null {
  if (!config.jwtSecret) return null;
  try {
    const payload = jwt.verify(token, config.jwtSecret) as {
      sub: string;
      email?: string;
      sid?: string;
      iat?: number;
      exp?: number;
    };
    if (!payload.sub) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Sign an admin JWT. */
export function signAdminJwt(email: string, ttlSeconds = 60 * 60 * 24 * 7): string {
  return jwt.sign({ sub: "admin", email }, config.jwtSecret, { expiresIn: ttlSeconds });
}

/** Sign a session JWT for a verified OTP login. */
export function signSessionJwt(
  email: string,
  sid: string,
  ttlSeconds = 60 * 60 * 24 * 30
): string {
  return jwt.sign({ sub: "session", email, sid }, config.jwtSecret, { expiresIn: ttlSeconds });
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
  const userId = crypto
    .createHash("sha256")
    .update(`user:${email}`)
    .digest("hex")
    .slice(0, 36);
  return {
    id: userId,
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
    const email = sessionToken.email.toLowerCase();
    const isAdmin = config.adminEmails.includes(email);
    const role = isAdmin ? "admin" : "customer";
    // Compute a deterministic id from email (same as verify-otp route does).
    const hashedId = crypto.createHash("sha256").update(`user:${email}`).digest("hex").slice(0, 36);

    let dbUser: User | null = null;
    if (isDbReady()) {
      try {
        // Upsert by EMAIL (unique), not by id — avoids unique constraint
        // violations caused by old stub records with different ids.
        dbUser = await prisma.user.upsert({
          where: { email },
          update: { role },
          create: { id: hashedId, email, name: email.split("@")[0], role, addresses: "[]" },
        });
      } catch (e) {
        console.error("[auth] session user upsert failed:", e);
      }
    }

    // Use the real DB id if we got one, otherwise fall back to the hashed id.
    const userId = dbUser?.id ?? hashedId;
    req.user = {
      id: userId, email, name: email.split("@")[0], role,
      addresses: "[]", createdAt: dbUser?.createdAt ?? new Date(), updatedAt: dbUser?.updatedAt ?? new Date(),
    } as User;
    req.userId = userId;
    req.userEmail = email;
    req.supabaseUserId = userId;
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
    const stub = makeStubUser(email);
    try {
      const dbUser = await prisma.user.upsert({
        where: { email },
        update: { role: stub.role },
        create: {
          id: stub.id,
          email,
          name: email.split("@")[0],
          role: stub.role,
          addresses: "[]",
        },
      });
      stub.id = dbUser.id;
    } catch (e) {
      console.error("[auth] mock upsert failed:", e);
    }
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
