import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { dbPath } from "../config.js";
import { INIT_SQL } from "./schema.js";
import { runMigrations } from "./migrate.js";

let dbSingleton: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbSingleton) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    dbSingleton = new Database(dbPath);
    dbSingleton.pragma("journal_mode = WAL");
    dbSingleton.exec(INIT_SQL);
    runMigrations(dbSingleton);
  }
  return dbSingleton;
}

export function closeDb(): void {
  if (dbSingleton) {
    dbSingleton.close();
    dbSingleton = null;
  }
}

export type RawEventRow = {
  id: string;
  source: string;
  author_handle: string | null;
  content_hash: string;
  text_content: string;
  tweet_url: string | null;
  collected_at: string;
  raw_metadata: string | null;
};

export type DraftRow = {
  id: string;
  body: string;
  status: string;
  inspired_by_event_ids: string | null;
  similarity_note: string | null;
  persona_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ScheduledPostRow = {
  id: string;
  draft_id: string | null;
  body: string;
  run_at: string;
  status: string;
  attempts: number;
  last_error: string | null;
  tweet_url: string | null;
  created_at: string;
};

export type PersonaRow = {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  tone: string;
  icon: string;
  is_default: number;
  created_at: string;
};

export type MetricRow = {
  id: string;
  scheduled_post_id: string;
  tweet_url: string;
  likes: number;
  retweets: number;
  replies: number;
  views: number;
  followers_at_time: number | null;
  collected_at: string;
};

export type LlmLogRow = {
  id: string;
  operation: string;
  model: string;
  prompt_preview: string;
  response_preview: string | null;
  tokens_in: number;
  tokens_out: number;
  duration_ms: number;
  error: string | null;
  created_at: string;
};

export type TopicRunRow = {
  id: string;
  window_hours: number;
  summary: string;
  topics_json: string | null;
  created_at: string;
};
