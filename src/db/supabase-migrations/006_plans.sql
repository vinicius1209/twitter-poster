CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_brl INTEGER NOT NULL DEFAULT 0,
  max_generations_month INTEGER NOT NULL DEFAULT 3,
  max_personas INTEGER NOT NULL DEFAULT 1,
  max_profiles INTEGER NOT NULL DEFAULT 0,
  has_scheduling INTEGER NOT NULL DEFAULT 0,
  has_metrics INTEGER NOT NULL DEFAULT 0,
  has_ghostwriter INTEGER NOT NULL DEFAULT 0,
  has_profile_study INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO plans (id, name, price_brl, max_generations_month, max_personas, max_profiles, has_scheduling, has_metrics, has_ghostwriter, has_profile_study) VALUES
  ('free', 'Free', 0, 3, 1, 0, 0, 0, 0, 0),
  ('criador', 'Criador', 2900, 999, 4, 3, 1, 1, 0, 0),
  ('pro', 'Pro', 7900, 999, 99, 10, 1, 1, 1, 1)
ON CONFLICT (id) DO NOTHING
