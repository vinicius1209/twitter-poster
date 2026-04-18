import { getDb, type DraftRow } from "../index.js";

export function listDrafts(limit = 100, offset = 0): { data: DraftRow[]; total: number } {
  const db = getDb();
  const total = (db.prepare(`SELECT COUNT(*) as c FROM drafts WHERE status != 'discarded'`).get() as { c: number }).c;
  const data = db
    .prepare(`SELECT * FROM drafts WHERE status != 'discarded' ORDER BY updated_at DESC LIMIT ? OFFSET ?`)
    .all(limit, offset) as DraftRow[];
  return { data, total };
}

export function deleteDraft(id: string): void {
  getDb()
    .prepare(`UPDATE drafts SET status = 'discarded', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(id);
}

export function getDraft(id: string): DraftRow | undefined {
  return getDb()
    .prepare(`SELECT * FROM drafts WHERE id = ?`)
    .get(id) as DraftRow | undefined;
}

export function updateDraftBody(id: string, body: string, now: string): void {
  getDb()
    .prepare(`UPDATE drafts SET body = ?, updated_at = ? WHERE id = ?`)
    .run(body, now, id);
}

export function updateDraftStatus(id: string, status: string, now: string): void {
  getDb()
    .prepare(`UPDATE drafts SET status = ?, updated_at = ? WHERE id = ?`)
    .run(status, now, id);
}

export function getRecentDraftBodies(limit = 10): string[] {
  return (getDb()
    .prepare(`SELECT body FROM drafts ORDER BY created_at DESC LIMIT ?`)
    .all(limit) as { body: string }[])
    .map(r => r.body);
}

export function insertDraft(params: {
  id: string;
  body: string;
  status: string;
  inspiredByEventIds: string;
  similarityNote: string | null;
  personaId?: string | null;
  now: string;
}): void {
  getDb()
    .prepare(
      `INSERT INTO drafts (id, body, status, inspired_by_event_ids, similarity_note, persona_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      params.id,
      params.body,
      params.status,
      params.inspiredByEventIds,
      params.similarityNote,
      params.personaId ?? null,
      params.now,
      params.now,
    );
}
