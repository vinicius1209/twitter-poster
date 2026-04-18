import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { getMetricsDashboard } from "../db/repositories/metrics.repo.js";
import { collectMetricsJob } from "../jobs/collectMetrics.js";

const router = Router();

router.get("/metrics", (_req, res) => {
  res.json(getMetricsDashboard());
});

router.post(
  "/metrics/collect",
  asyncHandler(async (_req, res) => {
    const result = await collectMetricsJob();
    res.json(result);
  }),
);

export default router;
