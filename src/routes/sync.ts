import { Router } from "express";
import { z } from "zod";
import { asyncHandler, httpError } from "../middleware/errorHandler.js";
import { sanitizeHandle } from "../util/validate.js";
import { createTask } from "../db/repositories/agentTasks.repo.js";
import { getWatchlistHandles } from "../db/repositories/authors.repo.js";

const router = Router();

const syncBody = z.object({
  maxScrolls: z.coerce.number().min(1).max(50).default(8),
  maxTweets: z.coerce.number().min(1).max(500).default(80),
});

router.post("/sync/likes", asyncHandler(async (req, res) => {
  const opts = syncBody.parse(req.body ?? {});
  const task = await createTask("collect_likes", { maxScrolls: opts.maxScrolls, maxTweets: opts.maxTweets });
  res.json({ taskId: task.id, status: task.status, message: "Task de coleta criada. Aguardando agent..." });
}));

router.post("/sync/profile/:handle", asyncHandler(async (req, res) => {
  const rawHandle = Array.isArray(req.params.handle) ? req.params.handle[0] : req.params.handle;
  const handle = sanitizeHandle(rawHandle ?? "");
  if (!handle) throw httpError(400, "Handle inválido.");
  const opts = syncBody.parse(req.body ?? {});
  const task = await createTask("collect_profile", { handle, maxScrolls: opts.maxScrolls, maxTweets: opts.maxTweets });
  res.json({ taskId: task.id, status: task.status, message: `Coleta de @${handle} enfileirada. Aguardando agent...` });
}));

router.post("/sync/watchlist", asyncHandler(async (_req, res) => {
  const handles = await getWatchlistHandles();
  const tasks = [];
  for (const h of handles) {
    const task = await createTask("collect_profile", { handle: h.handle, maxScrolls: 6, maxTweets: 40 });
    tasks.push({ handle: h.handle, taskId: task.id });
  }
  res.json({ tasks, message: `${tasks.length} coletas enfileiradas. Aguardando agent...` });
}));

export default router;
