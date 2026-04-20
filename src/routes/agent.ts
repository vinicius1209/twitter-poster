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

// Todas as rotas do agent requerem AGENT_TOKEN
router.use(requireAgentAuth);

/** Agent polls para a próxima task pendente */
router.get("/agent/tasks/next", asyncHandler(async (_req, res) => {
  // Reset tasks que ficaram stuck em running
  await resetStaleTasks(5);

  const task = await claimNextTask();
  if (!task) {
    res.status(204).send();
    return;
  }
  res.json(task);
}));

/** Agent reporta resultado de uma task */
router.post("/agent/tasks/:id/result", asyncHandler(async (req, res) => {
  const taskId = req.params.id as string;
  const { ok, result, error } = req.body as { ok: boolean; result?: Record<string, unknown>; error?: string };

  if (ok && result) {
    await completeTask(taskId, result);
    // Processar resultado (inserir dados no Supabase)
    const task = await getTask(taskId);
    if (task) await processTaskResult(task);
    res.json({ processed: true });
  } else {
    await failTask(taskId, error ?? "Unknown error");
    res.json({ processed: true });
  }
}));

/** Dashboard: lista tasks */
router.get("/agent/tasks", asyncHandler(async (req, res) => {
  const status = req.query.status as string | undefined;
  const tasks = await listTasks(status as any, 50);
  res.json(tasks);
}));

/** Status de uma task específica */
router.get("/agent/tasks/:id", asyncHandler(async (req, res) => {
  const task = await getTask(req.params.id as string);
  if (!task) { res.status(404).json({ error: "Task não encontrada" }); return; }
  res.json(task);
}));

export default router;
