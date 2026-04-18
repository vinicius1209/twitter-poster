import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { httpError } from "../middleware/errorHandler.js";
import { sanitizeHandle } from "../util/validate.js";
import { listAuthors, upsertAuthor, deleteAuthor } from "../db/repositories/authors.repo.js";

const router = Router();

const authorBody = z.object({
  handle: z.string().min(1),
  priority: z.number().int().min(0).default(1),
  displayName: z.string().optional(),
});

router.get("/authors", (_req, res) => {
  res.json(listAuthors());
});

router.post("/authors", (req, res) => {
  const body = authorBody.parse(req.body);
  const h = sanitizeHandle(body.handle);
  if (!h) throw httpError(400, "Handle inválido.");
  const row = upsertAuthor({
    id: randomUUID(),
    handle: h,
    displayName: body.displayName ?? null,
    priority: body.priority,
    now: new Date().toISOString(),
  });
  res.json(row);
});

router.delete("/authors/:handle", (req, res) => {
  const h = sanitizeHandle(req.params.handle);
  if (!h) throw httpError(400, "Handle inválido.");
  const changes = deleteAuthor(h);
  res.json({ deleted: changes });
});

export default router;
