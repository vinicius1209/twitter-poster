import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { asyncHandler, httpError } from "../middleware/errorHandler.js";
import { listPersonas, getPersona, insertPersona, updatePersona, deletePersona } from "../db/repositories/personas.repo.js";

const router = Router();

router.get("/personas", asyncHandler(async (_req, res) => {
  res.json(await listPersonas());
}));

router.get("/personas/:id", asyncHandler(async (req, res) => {
  const row = await getPersona(req.params.id as string);
  if (!row) throw httpError(404, "Persona não encontrada.");
  res.json(row);
}));

const personaBody = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  systemPrompt: z.string().min(1),
  tone: z.string().default(""),
  icon: z.string().default("🤖"),
});

router.post("/personas", asyncHandler(async (req, res) => {
  const body = personaBody.parse(req.body);
  res.json(await insertPersona({ id: randomUUID(), ...body }));
}));

const personaPatch = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  systemPrompt: z.string().min(1).optional(),
  tone: z.string().optional(),
  icon: z.string().optional(),
});

router.patch("/personas/:id", asyncHandler(async (req, res) => {
  const body = personaPatch.parse(req.body);
  const row = await updatePersona(req.params.id as string, body);
  if (!row) throw httpError(404, "Persona não encontrada.");
  res.json(row);
}));

router.delete("/personas/:id", asyncHandler(async (req, res) => {
  const changes = await deletePersona(req.params.id as string);
  if (changes === 0) throw httpError(400, "Persona padrão não pode ser deletada.");
  res.json({ deleted: true });
}));

export default router;
