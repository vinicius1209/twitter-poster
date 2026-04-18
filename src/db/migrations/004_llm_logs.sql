CREATE TABLE IF NOT EXISTS llm_logs (
  id TEXT PRIMARY KEY,
  operation TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_preview TEXT NOT NULL,
  response_preview TEXT,
  tokens_in INTEGER NOT NULL DEFAULT 0,
  tokens_out INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_llm_logs_created ON llm_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_llm_logs_operation ON llm_logs(operation)
