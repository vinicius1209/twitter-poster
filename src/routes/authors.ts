import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { asyncHandler, httpError } from "../middleware/errorHandler.js";
import { sanitizeHandle } from "../util/validate.js";
import { listAuthors, upsertAuthor, deleteAuthor } from "../db/repositories/authors.repo.js";

const router = Router();

const authorBody = z.object({
  handle: z.string().min(1),
  priority: z.number().int().min(0).default(1),
  displayName: z.string().optional(),
});

router.get("/authors", asyncHandler(async (_req, res) => {
  res.json(await listAuthors());
}));

router.post("/authors", asyncHandler(async (req, res) => {
  const body = authorBody.parse(req.body);
  const h = sanitizeHandle(body.handle);
  if (!h) throw httpError(400, "Handle inválido.");
  const row = await upsertAuthor({
    id: randomUUID(), handle: h, displayName: body.displayName ?? null,
    priority: body.priority, now: new Date().toISOString(),
  });
  res.json(row);
}));

router.delete("/authors/:handle", asyncHandler(async (req, res) => {
  const h = sanitizeHandle(req.params.handle as string);
  if (!h) throw httpError(400, "Handle inválido.");
  const changes = await deleteAuthor(h);
  res.json({ deleted: changes });
}));

export default router;
