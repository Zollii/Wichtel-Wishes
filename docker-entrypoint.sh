#!/bin/sh
set -e

mkdir -p /app/data

# Create or upgrade the SQLite database (safe to run on every start)
echo "Applying database migrations..."
(cd /app/migrate && ./node_modules/.bin/prisma migrate deploy)

exec node server.js
