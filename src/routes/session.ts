import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { createTask, listTasks } from "../db/repositories/agentTasks.repo.js";

const router = Router();

router.get("/config", (_req: any, res: any) => {
  res.json({ mode: "cloud", browserManaged: "agent" });
});

/** Verificação rápida — checa se agent reportou sessão recentemente */
router.get("/session/quick", asyncHandler(async (_req, res) => {
  const tasks = await listTasks("completed", 1);
  const lastSession = tasks.find(t => t.type === "check_session");
  if (lastSession?.result) {
    res.json({ ok: true, profileExists: true, hint: "Última verificação pelo agent.", ...lastSession.result });
  } else {
    res.json({ ok: true, profileExists: false, hint: "Agent não verificou a sessão ainda. Inicie o agent no seu computador." });
  }
}));

/** Verificação completa — cria task para o agent verificar */
router.get("/session", asyncHandler(async (_req, res) => {
  const task = await createTask("check_session", {});
  res.json({ taskId: task.id, status: "pending", hint: "Verificação enfileirada. Aguardando agent..." });
}));

export default router;
