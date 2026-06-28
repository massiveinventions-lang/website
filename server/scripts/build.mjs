import fs from "fs";
import { execSync } from "child_process";

// If we're on Render (or any production environment), swap to the
// PostgreSQL schema and regenerate the Prisma client.
// NOTE: We do NOT run `prisma db push` here — that requires a live DB
// connection which can time out during the build phase. Instead, db push
// happens at server startup inside connectDB().
if (process.env.NODE_ENV === "production" || process.env.RENDER) {
  console.log("==> Production build: swapping to PostgreSQL schema...");
  fs.copyFileSync("prisma/schema.production.prisma", "prisma/schema.prisma");
  console.log("==> Generating Prisma client for PostgreSQL...");
  execSync("npx prisma generate", { stdio: "inherit" });
  console.log("==> Build complete. DB schema will be pushed at server startup.");
} else {
  console.log("==> Dev build: generating Prisma client (SQLite)...");
  execSync("npx prisma generate", { stdio: "inherit" });
}
