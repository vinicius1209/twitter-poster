export const INIT_SQL = `
CREATE TABLE IF NOT EXISTS authors (
  id TEXT PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE,
  display_name TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS raw_events (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  author_handle TEXT,
  content_hash TEXT NOT NULL,
  text_content TEXT NOT NULL,
  tweet_url TEXT,
  collected_at TEXT NOT NULL,
  raw_metadata TEXT,
  UNIQUE(content_hash, source)
);

CREATE INDEX IF NOT EXISTS idx_raw_events_collected ON raw_events(collected_at);
CREATE INDEX IF NOT EXISTS idx_raw_events_hash ON raw_events(content_hash);
CREATE INDEX IF NOT EXISTS idx_raw_events_source ON raw_events(source);

CREATE TABLE IF NOT EXISTS engagement_signals (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 1.0,
  FOREIGN KEY (event_id) REFERENCES raw_events(id)
);

CREATE TABLE IF NOT EXISTS topic_runs (
  id TEXT PRIMARY KEY,
  window_hours INTEGER NOT NULL,
  summary TEXT NOT NULL,
  topics_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY,
  body TEXT NOT NULL,
  status TEXT NOT NULL,
  inspired_by_event_ids TEXT,
  similarity_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS scheduled_posts (
  id TEXT PRIMARY KEY,
  draft_id TEXT,
  body TEXT NOT NULL,
  run_at TEXT NOT NULL,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (draft_id) REFERENCES drafts(id)
);

CREATE INDEX IF NOT EXISTS idx_scheduled_run_at ON scheduled_posts(run_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_status ON scheduled_posts(status);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;
