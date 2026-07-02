/**
 * Database migration endpoint.
 *
 * Hit this once after a schema change to apply pending migrations
 * to the Supabase database. POST /api/admin/migrate-db with an
 * admin JWT.
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
 * ⚠️  SECURITY: This is gated by `requireAdmin` (admin JWT must be
 * presented in the Authorization header). Without a valid admin JWT
 * the request is rejected with 401.
 *
 * Usage:
 *   curl -X POST https://your-api.vercel.app/api/admin/migrate-db \
 *     -H "Authorization: Bearer <admin-jwt>"
 */
import { Router } from "express";
import { spawn } from "child_process";
import path from "path";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { HttpError } from "../middleware/errors";

const router = Router();

router.post(
  "/",
  requireAuth,
  requireAdmin,
  async (_req, res, next) => {
    try {
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
  }
);

export default router;
