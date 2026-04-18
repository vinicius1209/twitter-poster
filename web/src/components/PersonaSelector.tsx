import type { Persona } from "@shared/types.js";

type Props = {
  personas: Persona[];
  selected: string | null;
  onSelect: (id: string | null) => void;
};

export function PersonaSelector({ personas, selected, onSelect }: Props) {
  if (personas.length === 0) return null;

  return (
    <div style={{ marginBottom: "1rem" }}>
      <label>Persona</label>
      <div style={{
        display: "flex",
        gap: "0.5rem",
        overflowX: "auto",
        paddingBottom: "0.3rem",
      }}>
        {personas.map((p) => {
          const isActive = selected === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(isActive ? null : p.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.25rem",
                padding: "0.6rem 0.85rem",
                minWidth: 90,
                borderRadius: "var(--radius-sm)",
                border: `1.5px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                background: isActive ? "var(--accent-glow)" : "var(--surface-raised)",
                cursor: "pointer",
                transition: "all 0.15s",
                color: isActive ? "var(--accent)" : "var(--text)",
                fontWeight: isActive ? 600 : 400,
                fontSize: "0.82rem",
              }}
            >
              <span style={{ fontSize: "1.4rem" }}>{p.icon}</span>
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>
      {selected && (
        <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "0.35rem" }}>
          {personas.find(p => p.id === selected)?.description}
        </p>
      )}
    </div>
  );
}
