FROM node:22-slim AS builder
WORKDIR /app

# Install ALL deps (including devDeps for build)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source
COPY src/ src/
COPY web/ web/
COPY tsconfig.json ./

# Build backend + frontend
RUN npx tsc && npx vite build --config web/vite.config.ts

# ── Production stage ──
FROM node:22-slim AS runtime
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built artifacts
COPY --from=builder /app/dist dist/
COPY --from=builder /app/web/dist web/dist/

ENV NODE_ENV=production
ENV PORT=3847
EXPOSE 3847

CMD ["node", "dist/server.js"]
