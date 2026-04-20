FROM node:22-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Copy only Core source (NO browser code)
COPY src/ai/ src/ai/
COPY src/db/ src/db/
COPY src/jobs/ src/jobs/
COPY src/middleware/ src/middleware/
COPY src/routes/ src/routes/
COPY src/shared/ src/shared/
COPY src/util/ src/util/
COPY src/config.ts src/
COPY src/server.ts src/
COPY web/ web/
COPY tsconfig.json ./

RUN npx tsc && npx vite build --config web/vite.config.ts

# ── Production ──
FROM node:22-slim AS runtime
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist dist/
COPY --from=builder /app/web/dist web/dist/

ENV NODE_ENV=production
ENV PORT=3847
EXPOSE 3847

CMD ["node", "dist/server.js"]
