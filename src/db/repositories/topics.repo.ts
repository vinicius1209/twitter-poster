import { getDb, type TopicRunRow } from "../index.js";

export function listTopicRuns(limit = 20): TopicRunRow[] {
  return getDb()
    .prepare(
      `SELECT id, window_hours, summary, topics_json, created_at FROM topic_runs ORDER BY created_at DESC LIMIT ?`,
    )
    .all(limit) as TopicRunRow[];
}

/**
 * Retorna a análise mais recente, ou null se não existir.
 */
export function getLatestTopicRun(): TopicRunRow | null {
  return (getDb()
    .prepare("SELECT * FROM topic_runs ORDER BY created_at DESC LIMIT 1")
    .get() as TopicRunRow | undefined) ?? null;
}

export function insertTopicRun(params: {
  id: string;
  windowHours: number;
  summary: string;
  topicsJson: string;
  now: string;
}): void {
  getDb()
    .prepare(
      `INSERT INTO topic_runs (id, window_hours, summary, topics_json, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(params.id, params.windowHours, params.summary, params.topicsJson, params.now);
}
