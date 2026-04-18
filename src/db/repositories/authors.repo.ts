import { getDb } from "../index.js";

export type AuthorRow = {
  id: string;
  handle: string;
  display_name: string | null;
  priority: number;
  created_at: string;
};

export function listAuthors(): AuthorRow[] {
  return getDb()
    .prepare(`SELECT * FROM authors ORDER BY priority DESC`)
    .all() as AuthorRow[];
}

export function getWatchlistHandles(): { handle: string }[] {
  return getDb()
    .prepare(`SELECT handle FROM authors WHERE priority > 0 ORDER BY priority DESC`)
    .all() as { handle: string }[];
}

export function upsertAuthor(params: {
  id: string;
  handle: string;
  displayName: string | null;
  priority: number;
  now: string;
}): AuthorRow | undefined {
  getDb()
    .prepare(
      `INSERT INTO authors (id, handle, display_name, priority, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(handle) DO UPDATE SET
         priority = excluded.priority,
         display_name = excluded.display_name`,
    )
    .run(params.id, params.handle, params.displayName, params.priority, params.now);
  return getDb()
    .prepare(`SELECT * FROM authors WHERE handle = ?`)
    .get(params.handle) as AuthorRow | undefined;
}

export function deleteAuthor(handle: string): number {
  return getDb()
    .prepare(`DELETE FROM authors WHERE handle = ?`)
    .run(handle).changes;
}
