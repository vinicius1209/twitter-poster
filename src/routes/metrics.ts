import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { getMetricsDashboard, getPostsNeedingMetrics } from "../db/repositories/metrics.repo.js";
import { createTask } from "../db/repositories/agentTasks.repo.js";

const router = Router();

router.get("/metrics", asyncHandler(async (_req, res) => {
  res.json(await getMetricsDashboard());
}));

router.post("/metrics/collect", asyncHandler(async (_req, res) => {
  const posts = await getPostsNeedingMetrics();
  if (posts.length === 0) {
    res.json({ collected: 0, message: "Nenhum post precisa de métricas." });
    return;
  }
  const task = await createTask("collect_metrics", { posts });
  res.json({ taskId: task.id, postsQueued: posts.length, message: "Coleta de métricas enfileirada. Aguardando agent..." });
}));

export default router;
