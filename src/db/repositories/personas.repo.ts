import { getDb, type PersonaRow } from "../index.js";

export function listPersonas(): PersonaRow[] {
  return getDb()
    .prepare("SELECT * FROM personas ORDER BY is_default DESC, name ASC")
    .all() as PersonaRow[];
}

export function getPersona(id: string): PersonaRow | undefined {
  return getDb()
    .prepare("SELECT * FROM personas WHERE id = ?")
    .get(id) as PersonaRow | undefined;
}

export function getDefaultPersona(): PersonaRow | undefined {
  return getDb()
    .prepare("SELECT * FROM personas WHERE is_default = 1 LIMIT 1")
    .get() as PersonaRow | undefined;
}

export function insertPersona(params: {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  tone: string;
  icon: string;
}): PersonaRow | undefined {
  getDb()
    .prepare(
      `INSERT INTO personas (id, name, description, system_prompt, tone, icon, is_default, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
    )
    .run(params.id, params.name, params.description, params.systemPrompt, params.tone, params.icon);
  return getPersona(params.id);
}

export function updatePersona(
  id: string,
  params: Partial<{ name: string; description: string; systemPrompt: string; tone: string; icon: string }>,
): PersonaRow | undefined {
  const db = getDb();
  if (params.name !== undefined) db.prepare("UPDATE personas SET name = ? WHERE id = ?").run(params.name, id);
  if (params.description !== undefined) db.prepare("UPDATE personas SET description = ? WHERE id = ?").run(params.description, id);
  if (params.systemPrompt !== undefined) db.prepare("UPDATE personas SET system_prompt = ? WHERE id = ?").run(params.systemPrompt, id);
  if (params.tone !== undefined) db.prepare("UPDATE personas SET tone = ? WHERE id = ?").run(params.tone, id);
  if (params.icon !== undefined) db.prepare("UPDATE personas SET icon = ? WHERE id = ?").run(params.icon, id);
  return getPersona(id);
}

export function deletePersona(id: string): number {
  const persona = getPersona(id);
  if (persona?.is_default) return 0; // Não permite deletar persona padrão
  return getDb().prepare("DELETE FROM personas WHERE id = ?").run(id).changes;
}
