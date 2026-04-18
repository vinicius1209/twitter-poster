import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler.js";
import { runTopicAnalysis, listTopicRuns } from "../jobs/analyze.js";

const router = Router();

const analyzeBody = z.object({
  windowHours: z.coerce.number().min(1).max(168).default(24),
});

router.post(
  "/analyze",
  asyncHandler(async (req, res) => {
    const body = analyzeBody.parse(req.body ?? {});
    const result = await runTopicAnalysis(body.windowHours);
    res.json(result);
  }),
);

router.get("/topics", (_req, res) => {
  res.json(listTopicRuns(30));
});

export default router;
