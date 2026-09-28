# ── Stage 1: Install Dependencies ──
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/db/package.json ./packages/db/
COPY apps/web/package.json ./apps/web/
RUN npm ci

# ── Stage 2: Compile Next.js Standalone ──
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma types
RUN npm run db:generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=@orbit/web

# ── Stage 3: Ultra-Slim Runner (<100MB) ──
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

EXPOSE 3000
CMD ["node", "apps/web/server.js"]