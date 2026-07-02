/**
 * Database migration endpoint.
 *
 * Hit this once after a schema change to apply pending migrations
 * to the Supabase database. POST /api/admin/migrate-db with a
 * bearer token that matches MIGRATION_SECRET in your Vercel env.
 *
 * Why this exists:
 *   - Vercel serverless ignores the `buildCommand` in vercel.json when
 *     using `builds` + `routes` (this project's setup). So
 *     `deploy-prod.sh` (which runs `prisma db push`) never executes
 *     on deploy.
 *   - We need a way to push schema changes without SSHing into the
 *     Supabase dashboard or running prisma locally with a
 *     production DATABASE_URL.
 *   - This endpoint spawns `prisma db push` as a child process.
 *
 * ⚠️  SECURITY: This is gated by a static secret. To use it:
 *   1. Set `MIGRATION_SECRET=<long-random-string>` in your Vercel env vars
 *   2. POST to /api/admin/migrate-db with `Authorization: Bearer <MIGRATION_SECRET>`
 *   3. Optional: remove the secret from Vercel after the migration runs
 *
 * Why a static secret and not the admin JWT:
 *   - Admin JWT requires the user to log in to the admin UI first
 *   - The admin login itself is part of the same backend that has the
 *     broken schema — chicken-and-egg
 *   - A static secret is a one-time use, easy to rotate, and doesn't
 *     need a session
 *
 * Usage:
 *   curl -X POST https://your-api.vercel.app/api/admin/migrate-db \
 *     -H "Authorization: Bearer <MIGRATION_SECRET>"
 */
import { Router } from "express";
import { spawn } from "child_process";
import path from "path";
import { HttpError } from "../middleware/errors";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const expected = process.env.MIGRATION_SECRET;
    if (!expected) {
      throw new HttpError(
        503,
        "MIGRATION_SECRET is not set on the server. Set it in Vercel env vars and redeploy, or use a different migration method."
      );
    }
    const auth = req.header("authorization") ?? "";
    const provided = auth.toLowerCase().startsWith("bearer ")
      ? auth.slice(7).trim()
      : "";
    if (provided !== expected) {
      throw new HttpError(401, "Invalid or missing MIGRATION_SECRET");
    }

    // Spawn `prisma db push` from the server/ directory. The Prisma
    // CLI is installed as a devDependency there, so node_modules
    // must be present (it is in both Vercel serverless deploys and
    // local dev). DATABASE_URL must be set in the running process's
    // env (it always is — see config.ts).
    const cwd = path.resolve(process.cwd());
    console.log(`[migrate-db] running 'prisma db push' in ${cwd}`);

    const child = spawn(
      "npx",
      ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"],
      {
        cwd,
        env: { ...process.env },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk.toString()));
    child.stderr.on("data", (chunk) => (stderr += chunk.toString()));

    child.on("error", (err) => {
      next(new HttpError(500, `Failed to spawn prisma: ${err.message}`));
    });

    child.on("close", (code) => {
      if (code === 0) {
        console.log("[migrate-db] success");
        res.json({ ok: true, code, stdout, stderr });
      } else {
        console.error(`[migrate-db] prisma exited with code ${code}`);
        res.status(500).json({
          ok: false,
          code,
          error: "prisma db push failed",
          stdout,
          stderr,
        });
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;

