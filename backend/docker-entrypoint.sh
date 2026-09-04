#!/bin/sh
set -e

echo "==> [Docker Entrypoint] Pushing Prisma schema to database..."
npx prisma db push --skip-generate

echo "==> [Docker Entrypoint] Starting process: $@"
exec "$@"
