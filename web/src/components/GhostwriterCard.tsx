import { useState } from "react";

type Props = {
  onGhostwrite: (text: string, format: "short" | "long" | "thread", count: number) => Promise<void>;
  busy: boolean;
};

export function GhostwriterCard({ onGhostwrite, busy }: Props) {
  const [text, setText] = useState("");
  const [format, setFormat] = useState<"short" | "long" | "thread">("short");
  const [count, setCount] = useState(3);

  return (
    <div>
      <p style={{ fontSize: "0.85rem", color: "var(--text-dim)", marginBottom: "0.75rem" }}>
        Cole um artigo, ideia, anotação ou texto longo. A IA transforma em posts otimizados para o X.
      </p>

      <label>Conteúdo original</label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Cole aqui seu artigo, ideia, thread de email, anotação..."
        style={{ minHeight: 120, marginBottom: "0.5rem" }}
      />

      <div className="row" style={{ marginBottom: "0.75rem", gap: "0.5rem" }}>
        <div style={{ display: "flex", gap: "0.3rem", flex: 1 }}>
          {(["short", "long", "thread"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              style={{
                flex: 1, padding: "0.35rem", fontSize: "0.78rem",
                borderRadius: "var(--radius-sm)",
                border: `1.5px solid ${format === f ? "var(--accent)" : "var(--border)"}`,
                background: format === f ? "var(--accent-glow)" : "var(--surface-raised)",
                color: format === f ? "var(--accent)" : "var(--text-dim)",
                cursor: "pointer", fontWeight: format === f ? 600 : 400,
              }}
            >
              {f === "short" ? "Curto" : f === "long" ? "Longo" : "Thread"}
            </button>
          ))}
        </div>
        <div className="field-group" style={{ maxWidth: 70 }}>
          <input type="number" min={1} max={10} value={count} onChange={(e) => setCount(Number(e.target.value))} />
        </div>
      </div>

      <button
        type="button"
        className="primary"
        disabled={busy || text.trim().length < 10}
        onClick={() => onGhostwrite(text, format, count)}
        style={{ width: "100%" }}
      >
        {busy ? <><span className="spinner" /> Transformando…</> : `Gerar ${count} posts`}
      </button>
    </div>
  );
}
