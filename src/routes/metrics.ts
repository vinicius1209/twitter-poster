import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { getMetricsDashboard } from "../db/repositories/metrics.repo.js";
import { collectMetricsJob } from "../jobs/collectMetrics.js";

const router = Router();

router.get("/metrics", asyncHandler(async (_req, res) => {
  res.json(await getMetricsDashboard());
}));

router.post("/metrics/collect", asyncHandler(async (_req, res) => {
  res.json(await collectMetricsJob());
}));

export default router;
