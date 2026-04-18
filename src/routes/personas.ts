import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { httpError } from "../middleware/errorHandler.js";
import {
  listPersonas,
  getPersona,
  insertPersona,
  updatePersona,
  deletePersona,
} from "../db/repositories/personas.repo.js";

const router = Router();

router.get("/personas", (_req, res) => {
  res.json(listPersonas());
});

router.get("/personas/:id", (req, res) => {
  const row = getPersona(req.params.id as string);
  if (!row) throw httpError(404, "Persona não encontrada.");
  res.json(row);
});

const personaBody = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  systemPrompt: z.string().min(1),
  tone: z.string().default(""),
  icon: z.string().default("🤖"),
});

router.post("/personas", (req, res) => {
  const body = personaBody.parse(req.body);
  const row = insertPersona({ id: randomUUID(), ...body });
  res.json(row);
});

const personaPatch = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  systemPrompt: z.string().min(1).optional(),
  tone: z.string().optional(),
  icon: z.string().optional(),
});

router.patch("/personas/:id", (req, res) => {
  const body = personaPatch.parse(req.body);
  const row = updatePersona(req.params.id as string, body);
  if (!row) throw httpError(404, "Persona não encontrada.");
  res.json(row);
});

router.delete("/personas/:id", (req, res) => {
  const changes = deletePersona(req.params.id as string);
  if (changes === 0) throw httpError(400, "Persona padrão não pode ser deletada.");
  res.json({ deleted: true });
});

export default router;
