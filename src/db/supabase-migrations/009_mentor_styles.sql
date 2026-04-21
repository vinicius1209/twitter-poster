CREATE TABLE IF NOT EXISTS mentor_styles (
  id TEXT PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE,
  tweet_count INTEGER NOT NULL DEFAULT 0,
  avg_length INTEGER,
  uses_emojis INTEGER NOT NULL DEFAULT 0,
  uses_hashtags INTEGER NOT NULL DEFAULT 0,
  uses_threads INTEGER NOT NULL DEFAULT 0,
  tone_description TEXT,
  common_topics TEXT,
  writing_patterns TEXT,
  sample_phrases TEXT,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_mentor_styles_handle ON mentor_styles(handle)
