# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
# openssl is needed by the Prisma schema engine (migrations)
RUN apk add --no-cache libc6-compat openssl
ENV NEXT_TELEMETRY_DISABLED=1

# --- 1. Install dependencies -------------------------------------------------
FROM base AS deps
# Build tools are only a fallback in case no prebuilt better-sqlite3 binary exists
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
# postinstall runs `prisma generate`
RUN npm ci

# --- 2. Build the app ---------------------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- 3. Prisma CLI for running migrations on container start -----------------
FROM base AS migrator
WORKDIR /migrate
COPY package.json /tmp/app-package.json
RUN PRISMA_VERSION=$(node -p "require('/tmp/app-package.json').devDependencies.prisma") \
 && DOTENV_VERSION=$(node -p "require('/tmp/app-package.json').devDependencies.dotenv") \
 && npm init -y > /dev/null \
 && npm install --no-audit --no-fund "prisma@$PRISMA_VERSION" "dotenv@$DOTENV_VERSION"

# --- 4. Runtime image -----------------------------------------------------------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_URL=file:/app/data/wichtel.db \
    PRISMA_HIDE_UPDATE_MESSAGE=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 -G nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=migrator --chown=nextjs:nodejs /migrate/node_modules ./migrate/node_modules
COPY --chown=nextjs:nodejs prisma ./migrate/prisma
COPY --chown=nextjs:nodejs prisma.config.ts ./migrate/
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./

RUN mkdir -p /app/data && chown nextjs:nodejs /app/data
VOLUME /app/data

USER nextjs
EXPOSE 3000

CMD ["sh", "./docker-entrypoint.sh"]
