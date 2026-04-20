import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { port } from "./config.js";
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
app.use(cors());
app.use(express.json());

// Rotas públicas (sem auth)
app.use("/api", healthRoutes);
app.use("/api", authRoutes);
app.use("/api", plansRoutes);

// Rotas protegidas
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

// Error handler centralizado
app.use(errorHandler);

// Frontend estático (produção)
const webDist = path.join(__dirname, "..", "web", "dist");
if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get(/^(?!\/api\/).*/, (req: any, res: any, next: any) => {
    if (req.method !== "GET" || req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(webDist, "index.html"));
  });
}

// Bootstrap — ZERO browser, ZERO Playwright
startPublishWorker();

const server = app.listen(port, () => {
  console.log(`API em http://127.0.0.1:${port}`);
  console.log("Core pronto. Inicie o agent no desktop para operações de browser.");
});

// Graceful shutdown
async function shutdown(): Promise<void> {
  console.log("\nEncerrando...");
  stopPublishWorker();
  server.close();
  console.log("Encerrado.");
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());
