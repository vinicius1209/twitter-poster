import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { requireAgentAuth } from "../middleware/agentAuth.js";
import {
  claimNextTask,
  completeTask,
  failTask,
  getTask,
  listTasks,
  resetStaleTasks,
} from "../db/repositories/agentTasks.repo.js";
import { processTaskResult } from "../jobs/taskResultProcessor.js";

const router = Router();

// ── Rotas específicas ANTES das rotas com :id ──

/** Agent polls para a próxima task pendente (protegido) */
router.get("/agent/tasks/next", requireAgentAuth, asyncHandler(async (_req, res) => {
  await resetStaleTasks(5);
  const task = await claimNextTask();
  if (!task) { res.status(204).send(); return; }
  res.json(task);
}));

/** Dashboard: lista tasks (público) */
router.get("/agent/tasks", asyncHandler(async (req, res) => {
  const status = req.query.status as string | undefined;
  const tasks = await listTasks(status as any, 50);
  res.json(tasks);
}));

// ── Rotas com :id DEPOIS ──

/** Status de uma task específica (público — frontend polling) */
router.get("/agent/tasks/:id", asyncHandler(async (req, res) => {
  const task = await getTask(req.params.id as string);
  if (!task) { res.status(404).json({ error: "Task não encontrada" }); return; }
  res.json(task);
}));

/** Agent reporta resultado (protegido) */
router.post("/agent/tasks/:id/result", requireAgentAuth, asyncHandler(async (req, res) => {
  const taskId = req.params.id as string;
  const { ok, result, error } = req.body as { ok: boolean; result?: Record<string, unknown>; error?: string };

  if (ok && result) {
    await completeTask(taskId, result);
    const task = await getTask(taskId);
    if (task) await processTaskResult(task);
    res.json({ processed: true });
  } else {
    await failTask(taskId, error ?? "Unknown error");
    res.json({ processed: true });
  }
}));

export default router;
