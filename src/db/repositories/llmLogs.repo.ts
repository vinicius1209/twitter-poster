import { getDb, type LlmLogRow } from "../index.js";

export function insertLlmLog(params: {
  id: string;
  operation: string;
  model: string;
  promptPreview: string;
  responsePreview: string | null;
  tokensIn: number;
  tokensOut: number;
  durationMs: number;
  error: string | null;
}): void {
  getDb()
    .prepare(
      `INSERT INTO llm_logs (id, operation, model, prompt_preview, response_preview, tokens_in, tokens_out, duration_ms, error, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    )
    .run(
      params.id, params.operation, params.model,
      params.promptPreview.slice(0, 500),
      params.responsePreview?.slice(0, 500) ?? null,
      params.tokensIn, params.tokensOut, params.durationMs, params.error,
    );
}

export function listLlmLogs(limit = 50): LlmLogRow[] {
  return getDb()
    .prepare("SELECT * FROM llm_logs ORDER BY created_at DESC LIMIT ?")
    .all(limit) as LlmLogRow[];
}

export function getLlmUsageSummary(): {
  totalCalls: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalErrors: number;
  estimatedCostUsd: number;
} {
  const row = getDb()
    .prepare(`
      SELECT
        COUNT(*) as totalCalls,
        COALESCE(SUM(tokens_in), 0) as totalTokensIn,
        COALESCE(SUM(tokens_out), 0) as totalTokensOut,
        SUM(CASE WHEN error IS NOT NULL THEN 1 ELSE 0 END) as totalErrors
      FROM llm_logs
    `)
    .get() as { totalCalls: number; totalTokensIn: number; totalTokensOut: number; totalErrors: number };

  // Estimativa de custo: gpt-4o-mini ~$0.15/1M input, $0.60/1M output
  const costIn = (row.totalTokensIn / 1_000_000) * 0.15;
  const costOut = (row.totalTokensOut / 1_000_000) * 0.60;

  return { ...row, estimatedCostUsd: Math.round((costIn + costOut) * 100) / 100 };
}
