import { useState } from "react";

type ProfileStudy = {
  handle: string;
  tweetCount: number;
  themes: string[];
  writingStyle: string;
  typicalFormat: string;
  engagementTips: string;
  summary: string;
};

type Props = {
  onStudy: (handle: string) => Promise<ProfileStudy>;
};

export function ProfileStudyCard({ onStudy }: Props) {
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [study, setStudy] = useState<ProfileStudy | null>(null);

  async function run() {
    if (!handle.trim()) return;
    setLoading(true);
    try {
      const result = await onStudy(handle.replace(/^@/, ""));
      setStudy(result);
    } catch (e) {
      setStudy({ handle, tweetCount: 0, themes: [], writingStyle: "", typicalFormat: "", engagementTips: "", summary: e instanceof Error ? e.message : "Erro" });
    }
    setLoading(false);
  }

  return (
    <div>
      <p style={{ fontSize: "0.85rem", color: "var(--text-dim)", marginBottom: "0.75rem" }}>
        A IA analisa os tweets coletados de um perfil e revela: temas, estilo de escrita, formatos preferidos e dicas de engajamento.
      </p>

      <div className="row" style={{ marginBottom: "0.75rem" }}>
        <input
          placeholder="@handle para estudar"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="button" className="primary" disabled={loading || !handle.trim()} onClick={run}>
          {loading ? <><span className="spinner" /> Analisando…</> : "Estudar perfil"}
        </button>
      </div>

      {study && (
        <div className="item-card">
          <div className="item-card-header">
            <span className="mono" style={{ color: "var(--accent)" }}>@{study.handle}</span>
            <span style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>{study.tweetCount} tweets analisados</span>
          </div>

          {study.summary && (
            <div className="item-card-body" style={{ marginBottom: "0.75rem" }}>
              {study.summary}
            </div>
          )}

          {study.themes.length > 0 && (
            <div style={{ marginBottom: "0.6rem" }}>
              <label style={{ marginBottom: "0.3rem" }}>Temas</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                {study.themes.map((t, i) => (
                  <span key={i} style={{
                    background: "var(--accent-glow)", color: "var(--accent)",
                    padding: "0.15rem 0.5rem", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 500,
                  }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {study.writingStyle && (
            <div style={{ marginBottom: "0.5rem" }}>
              <label>Estilo de escrita</label>
              <p style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>{study.writingStyle}</p>
            </div>
          )}

          {study.typicalFormat && (
            <div style={{ marginBottom: "0.5rem" }}>
              <label>Formato típico</label>
              <p style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>{study.typicalFormat}</p>
            </div>
          )}

          {study.engagementTips && (
            <div>
              <label>Dicas de engajamento</label>
              <p style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>{study.engagementTips}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
