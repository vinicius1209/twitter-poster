import { getSupabase } from "../supabase.js";

export type LlmLogRow = {
  id: string;
  operation: string;
  model: string;
  prompt_preview: string;
  response_preview: string | null;
  tokens_in: number;
  tokens_out: number;
  duration_ms: number;
  error: string | null;
  created_at: string;
};

export async function insertLlmLog(params: {
  id: string; operation: string; model: string;
  promptPreview: string; responsePreview: string | null;
  tokensIn: number; tokensOut: number; durationMs: number;
  error: string | null; userId?: string;
}): Promise<void> {
  await getSupabase().from("llm_logs").insert({
    id: params.id, operation: params.operation, model: params.model,
    prompt_preview: params.promptPreview.slice(0, 500),
    response_preview: params.responsePreview?.slice(0, 500) ?? null,
    tokens_in: params.tokensIn, tokens_out: params.tokensOut,
    duration_ms: params.durationMs, error: params.error,
    user_id: params.userId ?? null, created_at: new Date().toISOString(),
  });
}

export async function listLlmLogs(limit = 50): Promise<LlmLogRow[]> {
  const { data } = await getSupabase().from("llm_logs").select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as LlmLogRow[];
}

export async function getLlmUsageSummary(): Promise<{
  totalCalls: number; totalTokensIn: number; totalTokensOut: number;
  totalErrors: number; estimatedCostUsd: number;
}> {
  const { data } = await getSupabase().from("llm_logs").select("tokens_in, tokens_out, error");
  const rows = data ?? [];
  const totalTokensIn = rows.reduce((a: number, r: any) => a + (r.tokens_in ?? 0), 0);
  const totalTokensOut = rows.reduce((a: number, r: any) => a + (r.tokens_out ?? 0), 0);
  const costIn = (totalTokensIn / 1_000_000) * 0.15;
  const costOut = (totalTokensOut / 1_000_000) * 0.60;
  return {
    totalCalls: rows.length,
    totalTokensIn, totalTokensOut,
    totalErrors: rows.filter((r: any) => r.error != null).length,
    estimatedCostUsd: Math.round((costIn + costOut) * 100) / 100,
  };
}
