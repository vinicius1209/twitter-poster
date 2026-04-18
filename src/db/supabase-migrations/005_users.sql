-- Sprint 15: Users + user_id em todas as tabelas
-- Executar no SQL Editor do Supabase

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free',
  agent_token TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar user_id nas tabelas existentes
ALTER TABLE authors ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id);
ALTER TABLE raw_events ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id);
ALTER TABLE drafts ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id);
ALTER TABLE scheduled_posts ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id);
ALTER TABLE topic_runs ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id);
ALTER TABLE post_metrics ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id);
ALTER TABLE llm_logs ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id);

-- RLS (Row Level Security) — cada user só vê seus dados
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_logs ENABLE ROW LEVEL SECURITY;

-- Policies: leitura/escrita só para o próprio user
CREATE POLICY "Users see own data" ON authors FOR ALL USING (user_id = current_setting('app.user_id', true));
CREATE POLICY "Users see own data" ON raw_events FOR ALL USING (user_id = current_setting('app.user_id', true));
CREATE POLICY "Users see own data" ON drafts FOR ALL USING (user_id = current_setting('app.user_id', true));
CREATE POLICY "Users see own data" ON scheduled_posts FOR ALL USING (user_id = current_setting('app.user_id', true));
CREATE POLICY "Users see own data" ON topic_runs FOR ALL USING (user_id = current_setting('app.user_id', true));
CREATE POLICY "Users see own data" ON post_metrics FOR ALL USING (user_id = current_setting('app.user_id', true));
CREATE POLICY "Users see own data" ON llm_logs FOR ALL USING (user_id = current_setting('app.user_id', true));

-- Personas são globais (shared entre todos os users)
-- Não aplica RLS em personas
