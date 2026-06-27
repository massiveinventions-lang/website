#!/usr/bin/env bash
# Swap the Prisma schema to the production (Postgres) variant, push the
# schema to the database, generate the client, then restore the SQLite
# schema for local dev. Use this in your production deploy script.
#
# Required env: DATABASE_URL (a Postgres connection string)
#
# Usage:
#   ./scripts/deploy-prod.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SCHEMA_DIR="$SERVER_DIR/prisma"

echo "==> Saving current (SQLite) schema"
cp "$SCHEMA_DIR/schema.prisma" "$SCHEMA_DIR/schema.sqlite.prisma.tmp"

echo "==> Switching to production (Postgres) schema"
cp "$SCHEMA_DIR/schema.production.prisma" "$SCHEMA_DIR/schema.prisma"

cleanup() {
  echo "==> Restoring SQLite schema for local dev"
  mv "$SCHEMA_DIR/schema.sqlite.prisma.tmp" "$SCHEMA_DIR/schema.prisma"
}
trap cleanup EXIT

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set. Export a Postgres connection string first." >&2
  exit 1
fi

cd "$SERVER_DIR"

echo "==> Generating Prisma client"
npx prisma generate

echo "==> Pushing schema to Postgres"
npx prisma db push --skip-generate --accept-data-loss

echo "==> Done. The server will now use Postgres on next start."
echo "    (The SQLite schema has been restored automatically.)"