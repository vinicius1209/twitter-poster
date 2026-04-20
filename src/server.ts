import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { port, frontendUrl } from "./config.js";
import { logger } from "./lib/logger.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { startPublishWorker, stopPublishWorker } from "./jobs/publishWorker.js";

// Routes
import healthRoutes from "./routes/health.js";
import sessionRoutes from "./routes/session.js";
import syncRoutes from "./routes/sync.js";
import eventsRoutes from "./routes/events.js";
import topicsRoutes from "./routes/topics.js";
import draftsRoutes from "./routes/drafts.js";
import scheduleRoutes from "./routes/schedule.js";
import authorsRoutes from "./routes/authors.js";
import personasRoutes from "./routes/personas.js";
import metricsRoutes from "./routes/metrics.js";
import profileStudyRoutes from "./routes/profileStudy.js";
import ghostwriterRoutes from "./routes/ghostwriter.js";
import llmLogsRoutes from "./routes/llmLogs.js";
import authRoutes from "./routes/auth.js";
import plansRoutes from "./routes/plans.js";
import agentRoutes from "./routes/agent.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// ── Security ─────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

const allowedOrigins = ["http://localhost:5173", "http://localhost:3847", frontendUrl].filter(Boolean);
app.use(cors({ origin: allowedOrigins.length > 0 ? allowedOrigins : true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

// ── Logging ──────────────────────────────────────────────────
app.use((pinoHttp as any)({ logger, autoLogging: { ignore: (req: any) => req.url === "/api/health" } }));

// ── Rate Limiting ────────────────────────────────────────────
app.use("/api", rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false, message: { error: "Rate limit exceeded." } }));
app.use("/api/auth", rateLimit({ windowMs: 60_000, max: 5, message: { error: "Too many auth attempts." } }));
app.use("/api/drafts/generate", rateLimit({ windowMs: 60_000, max: 10, message: { error: "Generation rate limit." } }));
app.use("/api/ghostwrite", rateLimit({ windowMs: 60_000, max: 10, message: { error: "Generation rate limit." } }));

// ── Public routes ────────────────────────────────────────────
app.use("/api", healthRoutes);
app.use("/api", authRoutes);
app.use("/api", plansRoutes);

// ── Protected routes ─────────────────────────────────────────
app.use("/api", requireAuth);
app.use("/api", sessionRoutes);
app.use("/api", syncRoutes);
app.use("/api", eventsRoutes);
app.use("/api", topicsRoutes);
app.use("/api", draftsRoutes);
app.use("/api", scheduleRoutes);
app.use("/api", authorsRoutes);
app.use("/api", personasRoutes);
app.use("/api", metricsRoutes);
app.use("/api", profileStudyRoutes);
app.use("/api", ghostwriterRoutes);
app.use("/api", llmLogsRoutes);
app.use("/api", agentRoutes);

// ── Error handler ────────────────────────────────────────────
app.use(errorHandler);

// ── Static frontend (production) ─────────────────────────────
const webDist = path.join(__dirname, "..", "web", "dist");
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get(/^(?!\/api\/).*/, (req: any, res: any, next: any) => {
    if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(webDist, "index.html"));
  });
}

// ── Bootstrap ────────────────────────────────────────────────
startPublishWorker();

const server = app.listen(port, () => {
  logger.info({ port }, `Core API ready on port ${port}`);
});

async function shutdown(): Promise<void> {
  logger.info("Shutting down...");
  stopPublishWorker();
  server.close();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
