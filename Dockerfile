FROM node:22-slim AS base
WORKDIR /app

# Install deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy source
COPY src/ src/
COPY web/ web/
COPY tsconfig.json ./

# Build backend + frontend
RUN npx tsc && npx vite build --config web/vite.config.ts

# Runtime
ENV NODE_ENV=production
ENV PORT=3847
EXPOSE 3847

CMD ["node", "dist/server.js"]
