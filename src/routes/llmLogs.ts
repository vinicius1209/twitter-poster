import { Router } from "express";
import { listLlmLogs, getLlmUsageSummary } from "../db/repositories/llmLogs.repo.js";

const router = Router();

router.get("/llm-logs", (_req, res) => {
  res.json(listLlmLogs(50));
});

router.get("/llm-usage", (_req, res) => {
  res.json(getLlmUsageSummary());
});

export default router;
