CREATE TABLE IF NOT EXISTS post_metrics (
  id TEXT PRIMARY KEY,
  scheduled_post_id TEXT NOT NULL,
  tweet_url TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  retweets INTEGER NOT NULL DEFAULT 0,
  replies INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  followers_at_time INTEGER,
  collected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scheduled_post_id) REFERENCES scheduled_posts(id)
);

CREATE INDEX IF NOT EXISTS idx_post_metrics_scheduled ON post_metrics(scheduled_post_id);
CREATE INDEX IF NOT EXISTS idx_post_metrics_collected ON post_metrics(collected_at);

ALTER TABLE scheduled_posts ADD COLUMN tweet_url TEXT
