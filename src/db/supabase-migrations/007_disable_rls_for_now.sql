-- Desabilita RLS temporariamente até ter auth multi-tenant funcional.
-- O app atual é single-user, RLS bloqueia operações sem user_id.
-- Reabilitar quando Sprint 15 (auth) estiver 100%.

ALTER TABLE authors DISABLE ROW LEVEL SECURITY;
ALTER TABLE raw_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE drafts DISABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE topic_runs DISABLE ROW LEVEL SECURITY;
ALTER TABLE post_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE llm_logs DISABLE ROW LEVEL SECURITY
