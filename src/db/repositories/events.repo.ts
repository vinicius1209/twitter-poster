import { getDb, type RawEventRow } from "../index.js";

export function listEvents(limit: number, offset = 0): { data: RawEventRow[]; total: number } {
  const db = getDb();
  const total = (db.prepare(`SELECT COUNT(*) as c FROM raw_events`).get() as { c: number }).c;
  const data = db
    .prepare(
      `SELECT id, source, author_handle, text_content, tweet_url, collected_at
       FROM raw_events ORDER BY collected_at DESC LIMIT ? OFFSET ?`,
    )
    .all(limit, offset) as RawEventRow[];
  return { data, total };
}

export function getEventTextsSince(since: string, limit = 500): { id: string; text_content: string }[] {
  return getDb()
    .prepare(
      `SELECT id, text_content FROM raw_events WHERE collected_at >= ? ORDER BY collected_at DESC LIMIT ?`,
    )
    .all(since, limit) as { id: string; text_content: string }[];
}

export function getRandomEventsSince(since: string, limit = 12): { id: string; text_content: string }[] {
  return getDb()
    .prepare(
      `SELECT id, text_content FROM raw_events WHERE collected_at >= ? ORDER BY RANDOM() LIMIT ?`,
    )
    .all(since, limit) as { id: string; text_content: string }[];
}

/**
 * Ranking de autores por volume de engajamento (likes pesam mais).
 * Retorna os top N autores que o usuário mais curtiu/acompanhou.
 */
export function getTopAuthors(since: string, limit = 10): { author_handle: string; score: number; count: number }[] {
  return getDb()
    .prepare(`
      SELECT
        e.author_handle,
        SUM(COALESCE(s.weight, 1.0)) as score,
        COUNT(*) as count
      FROM raw_events e
      LEFT JOIN engagement_signals s ON s.event_id = e.id
      WHERE e.author_handle IS NOT NULL
        AND e.collected_at >= ?
      GROUP BY e.author_handle
      ORDER BY score DESC
      LIMIT ?
    `)
    .all(since, limit) as { author_handle: string; score: number; count: number }[];
}

/**
 * Busca tweets de um autor específico (para exemplos de estilo dos mentores).
 */
export function getEventsByAuthor(authorHandle: string, since: string, limit = 10): { text_content: string }[] {
  return getDb()
    .prepare(
      `SELECT text_content FROM raw_events WHERE author_handle = ? AND collected_at >= ? ORDER BY collected_at DESC LIMIT ?`,
    )
    .all(authorHandle, since, limit) as { text_content: string }[];
}

/**
 * Estatísticas agrupadas por fonte (likes, profile:handle, etc).
 */
export function getCollectionStats(): {
  source: string;
  count: number;
  latest: string;
  hasMedia: number;
}[] {
  return getDb()
    .prepare(`
      SELECT
        source,
        COUNT(*) as count,
        MAX(collected_at) as latest,
        SUM(CASE WHEN raw_metadata LIKE '%mediaUrls":["%' THEN 1 ELSE 0 END) as hasMedia
      FROM raw_events
      GROUP BY source
      ORDER BY count DESC
    `)
    .all() as { source: string; count: number; latest: string; hasMedia: number }[];
}

/**
 * Lista eventos filtrados por fonte, com metadata.
 */
export function listEventsBySource(
  source: string,
  limit: number,
  offset = 0,
): { data: RawEventRow[]; total: number } {
  const db = getDb();
  const total = (db.prepare(`SELECT COUNT(*) as c FROM raw_events WHERE source = ?`).get(source) as { c: number }).c;
  const data = db
    .prepare(
      `SELECT id, source, author_handle, text_content, tweet_url, collected_at, raw_metadata
       FROM raw_events WHERE source = ? ORDER BY collected_at DESC LIMIT ? OFFSET ?`,
    )
    .all(source, limit, offset) as RawEventRow[];
  return { data, total };
}
