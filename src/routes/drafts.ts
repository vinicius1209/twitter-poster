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

router.post("/drafts/generate", asyncHandler(async (req, res) => {
  const body = draftGenBody.parse(req.body ?? {});
  const result = await generateDraftJob(body);
  res.json(result);
}));

router.get("/drafts", asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req);
  const { data, total } = await listDrafts(limit, offset);
  res.json({ data, total, page, limit });
}));

const patchDraft = z.object({
  status: z.enum(["draft", "pending_approval", "scheduled", "posted", "failed"]).optional(),
  body: z.string().optional(),
});

router.patch("/drafts/:id", asyncHandler(async (req, res) => {
  const parsed = patchDraft.parse(req.body ?? {});
  const now = new Date().toISOString();
  if (parsed.body !== undefined) await updateDraftBody(req.params.id as string, parsed.body, now);
  if (parsed.status !== undefined) await updateDraftStatus(req.params.id as string, parsed.status, now);
  const row = await getDraft(req.params.id as string);
  res.json(row);
}));

router.delete("/drafts/:id", asyncHandler(async (req, res) => {
  await deleteDraft(req.params.id as string);
  res.json({ discarded: true });
}));

export default router;
