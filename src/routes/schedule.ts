import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { updateDraftStatus } from "../db/repositories/drafts.repo.js";
import {
  insertScheduled,
  listScheduled,
  getScheduled,
  cancelScheduled,
} from "../db/repositories/scheduled.repo.js";
import { httpError } from "../middleware/errorHandler.js";
import { parsePagination } from "../util/pagination.js";

const router = Router();

const scheduleBody = z.object({
  draftId: z.string().uuid().optional(),
  body: z.string().min(1),
  runAt: z.string(),
});

router.post("/schedule", (req, res) => {
  const body = scheduleBody.parse(req.body);
  const id = randomUUID();
  const now = new Date().toISOString();

  insertScheduled({
    id,
    draftId: body.draftId ?? null,
    body: body.body,
    runAt: body.runAt,
    now,
  });

  if (body.draftId) {
    updateDraftStatus(body.draftId, "scheduled", now);
  }

  res.json(getScheduled(id));
});

router.get("/scheduled", (req, res) => {
  const { page, limit, offset } = parsePagination(req);
  const { data, total } = listScheduled(limit, offset);
  res.json({ data, total, page, limit });
});

router.delete("/scheduled/:id", (req, res) => {
  const changes = cancelScheduled(req.params.id);
  if (changes === 0) throw httpError(404, "Post não encontrado ou já processado.");
  res.json({ cancelled: true });
});

export default router;
