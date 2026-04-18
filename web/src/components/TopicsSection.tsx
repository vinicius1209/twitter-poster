import type { TopicRun } from "@shared/types.js";

type Props = {
  topics: TopicRun[];
  windowH: number;
  setWindowH: (v: number) => void;
  busy: boolean;
  analysisSource: "llm" | "heuristic" | null;
  onAnalyze: () => void;
};

const WINDOW_PRESETS = [
  { label: "6h", value: 6 },
  { label: "24h", value: 24 },
  { label: "48h", value: 48 },
  { label: "7 dias", value: 168 },
];

export function TopicsSection({ topics, windowH, setWindowH, busy, analysisSource, onAnalyze }: Props) {
  const latest = topics[0];

  return (
    <div>
      <p style={{ fontSize: "0.85rem", color: "var(--text-dim)", marginBottom: "0.85rem" }}>
        Analisa os tweets coletados para identificar seus interesses e temas recorrentes.
        O resultado alimenta a geração de rascunhos no próximo passo.
      </p>

      {/* Presets de janela */}
      <div style={{ marginBottom: "0.75rem" }}>
        <label>Período de análise</label>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {WINDOW_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setWindowH(p.value)}
              style={{
                flex: 1,
                padding: "0.4rem",
                borderRadius: "var(--radius-sm)",
                border: `1.5px solid ${windowH === p.value ? "var(--accent)" : "var(--border)"}`,
                background: windowH === p.value ? "var(--accent-glow)" : "var(--surface-raised)",
                color: windowH === p.value ? "var(--accent)" : "var(--text-dim)",
                cursor: "pointer",
                fontSize: "0.82rem",
                fontWeight: windowH === p.value ? 600 : 400,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <button type="button" className="primary" disabled={busy} onClick={onAnalyze} style={{ width: "100%", marginBottom: "0.75rem" }}>
        {busy ? <><span className="spinner" /> Analisando…</> : `Analisar últimas ${windowH}h`}
      </button>

      {/* Resultado mais recente */}
      {latest ? (
        <div>
          <div className="item-card">
            {/* Indicador de fonte */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <span className={`badge ${analysisSource === "llm" ? "ok" : "warn"}`}>
                {analysisSource === "llm" ? "IA" : "heurística"}
              </span>
              <span className="mono" style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                {latest.window_hours}h · {new Date(latest.created_at).toLocaleString("pt-BR")}
              </span>
            </div>

            <div className="item-card-body" style={{ whiteSpace: "pre-wrap" }}>
              {latest.summary}
            </div>

            {latest.topics_json && (() => {
              const tags = JSON.parse(latest.topics_json) as string[];
              return tags.length > 0 ? (
                <div style={{ marginTop: "0.6rem", display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                  {tags.map((t, i) => (
                    <span key={i} style={{
                      background: "var(--accent-glow)",
                      color: "var(--accent)",
                      padding: "0.2rem 0.55rem",
                      borderRadius: "20px",
                      fontSize: "0.78rem",
                      fontWeight: 500,
                    }}>
                      {t}
                    </span>
                  ))}
                </div>
              ) : null;
            })()}

            {analysisSource === "heuristic" && (
              <p style={{ fontSize: "0.75rem", color: "var(--warn)", marginTop: "0.5rem" }}>
                Análise básica por frequência de palavras. Configure OPENAI_API_KEY no .env para análise inteligente com IA.
              </p>
            )}
          </div>

          <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "0.5rem", textAlign: "center" }}>
            ↓ Esses tópicos serão usados para gerar rascunhos no próximo passo
          </p>

          {topics.length > 1 && (
            <details style={{ marginTop: "0.5rem", fontSize: "0.82rem", color: "var(--text-dim)" }}>
              <summary style={{ cursor: "pointer", padding: "0.3rem 0" }}>
                Análises anteriores ({topics.length - 1})
              </summary>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.4rem" }}>
                {topics.slice(1).map((t) => (
                  <div key={t.id} className="item-card" style={{ padding: "0.5rem 0.7rem" }}>
                    <div className="item-card-body" style={{ fontSize: "0.8rem" }}>{t.summary}</div>
                    <div className="item-card-meta">
                      {t.window_hours}h · {new Date(t.created_at).toLocaleString("pt-BR")}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      ) : (
        <div className="empty-state">
          Nenhuma análise ainda. Colete tweets primeiro (Step 2), depois clique "Analisar".
        </div>
      )}
    </div>
  );
}
