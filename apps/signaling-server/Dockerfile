# ── Stage 1: Build TypeScript & Generate Prisma ──
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root workspace configs
COPY package.json package-lock.json ./
COPY packages/db/package.json ./packages/db/
COPY apps/signaling-server/package.json ./apps/signaling-server/

# Install dependencies cleanly
RUN npm ci

# Copy DB schema and generate Prisma client
COPY packages/db ./packages/db
RUN npm run db:generate

# Copy server source code and compile TS to JS
COPY apps/signaling-server ./apps/signaling-server
RUN npm run build --workspace=@orbit/signaling-server

# ── Stage 2: Minimal Production Image ──
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY packages/db/package.json ./packages/db/
COPY apps/signaling-server/package.json ./apps/signaling-server/
RUN npm ci --omit=dev

COPY --from=builder /app/packages/db ./packages/db
COPY --from=builder /app/apps/signaling-server ./apps/signaling-server

EXPOSE 4000
CMD ["npx", "tsx", "apps/signaling-server/src/index.ts"]