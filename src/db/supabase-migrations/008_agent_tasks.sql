CREATE TABLE IF NOT EXISTS agent_tasks (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payload JSONB NOT NULL DEFAULT '{}',
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  user_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status, created_at);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_type ON agent_tasks(type)
