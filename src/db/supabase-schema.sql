-- Schema para Supabase (PostgreSQL)
-- Executar no SQL Editor do Supabase Dashboard

-- Tabela de versão do schema
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Authors
CREATE TABLE IF NOT EXISTS authors (
  id TEXT PRIMARY KEY,
  handle TEXT NOT NULL UNIQUE,
  display_name TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Raw Events (tweets coletados)
CREATE TABLE IF NOT EXISTS raw_events (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  author_handle TEXT,
  content_hash TEXT NOT NULL,
  text_content TEXT NOT NULL,
  tweet_url TEXT,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  raw_metadata JSONB,
  UNIQUE(content_hash, source)
);

CREATE INDEX IF NOT EXISTS idx_raw_events_collected ON raw_events(collected_at);
CREATE INDEX IF NOT EXISTS idx_raw_events_hash ON raw_events(content_hash);
CREATE INDEX IF NOT EXISTS idx_raw_events_source ON raw_events(source);

-- Engagement Signals
CREATE TABLE IF NOT EXISTS engagement_signals (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES raw_events(id),
  signal_type TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 1.0
);

-- Topic Runs
CREATE TABLE IF NOT EXISTS topic_runs (
  id TEXT PRIMARY KEY,
  window_hours INTEGER NOT NULL,
  summary TEXT NOT NULL,
  topics_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Personas
CREATE TABLE IF NOT EXISTS personas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  system_prompt TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '',
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed personas padrão
INSERT INTO personas (id, name, description, system_prompt, tone, icon, is_default, created_at) VALUES
  ('p-estrategista', 'Estrategista', 'Análises profundas com visão de longo prazo',
   'Você é um estrategista de conteúdo que escreve como gente, não como AI. Demonstre visão de longo prazo, conecte tendências e ofereça perspectiva que ninguém mais está dando. Use dados concretos quando possível. NUNCA termine com call to action genérica. Termine com uma afirmação forte ou um insight que gruda na cabeça.',
   'analítico, estratégico, visionário', '🎯', 1, CURRENT_TIMESTAMP),
  ('p-provocador', 'Provocador', 'Opiniões fortes que geram debate',
   'Você é provocador e direto. Desafie o senso comum com substância. Diga o que todo mundo pensa mas ninguém fala. Seja controverso COM argumento, nunca genérico. NUNCA termine com call to action genérica. Termine com uma frase que incomoda ou faz a pessoa parar pra pensar.',
   'provocativo, direto, polêmico', '🔥', 0, CURRENT_TIMESTAMP),
  ('p-educador', 'Educador', 'Explica conceitos de forma acessível',
   'Você é um educador que simplifica o complexo. Ensine algo prático em poucas linhas — o leitor deve sair sabendo algo que não sabia. Use analogias inesperadas e exemplos do dia a dia. NUNCA termine com call to action genérica. Termine com o insight principal, não com uma pergunta.',
   'didático, claro, acessível', '📚', 0, CURRENT_TIMESTAMP),
  ('p-storyteller', 'Storyteller', 'Narrativas que conectam e inspiram',
   'Você é um contador de histórias. Use narrativa pessoal em primeira pessoa, metáforas ou mini-histórias de 2-3 linhas para transmitir uma mensagem. Conecte emoção com aprendizado prático. NUNCA termine com call to action genérica. Termine com a moral ou o plot twist da história.',
   'narrativo, emocional, inspirador', '✨', 0, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Drafts
CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY,
  body TEXT NOT NULL,
  status TEXT NOT NULL,
  inspired_by_event_ids JSONB,
  similarity_note TEXT,
  persona_id TEXT REFERENCES personas(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Scheduled Posts
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id TEXT PRIMARY KEY,
  draft_id TEXT REFERENCES drafts(id),
  body TEXT NOT NULL,
  run_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  tweet_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scheduled_run_at ON scheduled_posts(run_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_status ON scheduled_posts(status);

-- App Settings
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Post Metrics
CREATE TABLE IF NOT EXISTS post_metrics (
  id TEXT PRIMARY KEY,
  scheduled_post_id TEXT NOT NULL REFERENCES scheduled_posts(id),
  tweet_url TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  retweets INTEGER NOT NULL DEFAULT 0,
  replies INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  followers_at_time INTEGER,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_post_metrics_scheduled ON post_metrics(scheduled_post_id);
CREATE INDEX IF NOT EXISTS idx_post_metrics_collected ON post_metrics(collected_at);

-- LLM Logs
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_llm_logs_created ON llm_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_llm_logs_operation ON llm_logs(operation);
