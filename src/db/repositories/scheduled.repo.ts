import { getDb, type ScheduledPostRow } from "../index.js";

export function listScheduled(limit = 100, offset = 0): { data: ScheduledPostRow[]; total: number } {
  const db = getDb();
  const total = (db.prepare(`SELECT COUNT(*) as c FROM scheduled_posts`).get() as { c: number }).c;
  const data = db
    .prepare(`SELECT * FROM scheduled_posts ORDER BY run_at DESC LIMIT ? OFFSET ?`)
    .all(limit, offset) as ScheduledPostRow[];
  return { data, total };
}

export function getScheduled(id: string): ScheduledPostRow | undefined {
  return getDb()
    .prepare(`SELECT * FROM scheduled_posts WHERE id = ?`)
    .get(id) as ScheduledPostRow | undefined;
}

export function insertScheduled(params: {
  id: string;
  draftId: string | null;
  body: string;
  runAt: string;
  now: string;
}): void {
  getDb()
    .prepare(
      `INSERT INTO scheduled_posts (id, draft_id, body, run_at, status, attempts, last_error, created_at)
       VALUES (?, ?, ?, ?, 'scheduled', 0, NULL, ?)`,
    )
    .run(params.id, params.draftId, params.body, params.runAt, params.now);
}

export function getNextScheduledPost(now: string) {
  return getDb()
    .prepare(
      `SELECT * FROM scheduled_posts WHERE status = 'scheduled' AND run_at <= ? ORDER BY run_at ASC LIMIT 1`,
    )
    .get(now) as
    | { id: string; body: string; attempts: number; draft_id: string | null }
    | undefined;
}

export function setScheduledAttempts(id: string, attempts: number): void {
  getDb()
    .prepare(`UPDATE scheduled_posts SET attempts = ? WHERE id = ?`)
    .run(attempts, id);
}

export function markScheduledPosted(id: string): void {
  getDb()
    .prepare(`UPDATE scheduled_posts SET status = 'posted', last_error = NULL WHERE id = ?`)
    .run(id);
}

export function markScheduledFailed(id: string, error: string): void {
  getDb()
    .prepare(`UPDATE scheduled_posts SET status = 'failed', last_error = ? WHERE id = ?`)
    .run(error, id);
}

export function reschedulePost(id: string, nextRunAt: string, error: string): void {
  getDb()
    .prepare(`UPDATE scheduled_posts SET run_at = ?, last_error = ? WHERE id = ?`)
    .run(nextRunAt, error, id);
}

export function updateScheduledTweetUrl(id: string, tweetUrl: string): void {
  getDb()
    .prepare("UPDATE scheduled_posts SET tweet_url = ? WHERE id = ?")
    .run(tweetUrl, id);
}

export function getPostedWithUrls(): ScheduledPostRow[] {
  return getDb()
    .prepare("SELECT * FROM scheduled_posts WHERE status = 'posted' AND tweet_url IS NOT NULL ORDER BY run_at DESC")
    .all() as ScheduledPostRow[];
}

export function cancelScheduled(id: string): number {
  return getDb()
    .prepare(`UPDATE scheduled_posts SET status = 'cancelled' WHERE id = ? AND status = 'scheduled'`)
    .run(id).changes;
}
