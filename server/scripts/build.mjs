import fs from "fs";
import { execSync } from "child_process";

// If we're on Render (or any production environment), we need to swap to Postgres
if (process.env.NODE_ENV === "production" || process.env.RENDER) {
  console.log("==> Production environment detected. Swapping to Postgres schema...");
  fs.copyFileSync("prisma/schema.production.prisma", "prisma/schema.prisma");
  
  console.log("==> Generating Prisma client...");
  execSync("npx prisma generate", { stdio: "inherit" });
  
  if (process.env.DATABASE_URL) {
    console.log("==> Pushing schema to database...");
    execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
  }
} else {
  console.log("==> Development environment detected. Generating Prisma client...");
  execSync("npx prisma generate", { stdio: "inherit" });
}
