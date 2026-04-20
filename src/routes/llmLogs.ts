import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { listLlmLogs, getLlmUsageSummary } from "../db/repositories/llmLogs.repo.js";

const router = Router();

router.get("/llm-logs", asyncHandler(async (_req, res) => {
  res.json(await listLlmLogs(50));
}));

router.get("/llm-usage", asyncHandler(async (_req, res) => {
  res.json(await getLlmUsageSummary());
}));

export default router;
