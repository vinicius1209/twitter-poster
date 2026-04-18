import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler.js";
import { parsePagination } from "../util/pagination.js";
import { generateDraftJob } from "../jobs/draft.js";
import { listDrafts, getDraft, updateDraftBody, updateDraftStatus, deleteDraft } from "../db/repositories/drafts.repo.js";

const router = Router();

const draftGenBody = z.object({
  windowHours: z.coerce.number().min(1).max(168).default(24),
  tone: z.string().default("direto, técnico, amigável"),
  count: z.coerce.number().min(1).max(10).default(3),
  personaId: z.string().optional(),
  format: z.enum(["short", "long", "thread"]).default("short"),
});

router.post(
  "/drafts/generate",
  asyncHandler(async (req, res) => {
    const body = draftGenBody.parse(req.body ?? {});
    const result = await generateDraftJob({
      windowHours: body.windowHours,
      tone: body.tone,
      count: body.count,
      personaId: body.personaId,
      format: body.format,
    });
    res.json(result);
  }),
);

router.get("/drafts", (req, res) => {
  const { page, limit, offset } = parsePagination(req);
  const { data, total } = listDrafts(limit, offset);
  res.json({ data, total, page, limit });
});

const patchDraft = z.object({
  status: z.enum(["draft", "pending_approval", "scheduled", "posted", "failed"]).optional(),
  body: z.string().optional(),
});

router.patch("/drafts/:id", (req, res) => {
  const parsed = patchDraft.parse(req.body ?? {});
  const now = new Date().toISOString();
  if (parsed.body !== undefined) {
    updateDraftBody(req.params.id, parsed.body, now);
  }
  if (parsed.status !== undefined) {
    updateDraftStatus(req.params.id, parsed.status, now);
  }
  const row = getDraft(req.params.id);
  res.json(row);
});

router.delete("/drafts/:id", (req, res) => {
  deleteDraft(req.params.id as string);
  res.json({ discarded: true });
});

export default router;
