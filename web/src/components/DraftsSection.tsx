import { useState } from "react";
import type { Draft, Persona } from "@shared/types.js";
import { PersonaSelector } from "./PersonaSelector.js";
import { TweetPreview } from "./TweetPreview.js";

export type PostFormat = "short" | "long" | "thread";

type Props = {
  drafts: Draft[];
  personas: Persona[];
  selectedPersonaId: string | null;
  onSelectPersona: (id: string | null) => void;
  tone: string;
  setTone: (v: string) => void;
  count: number;
  setCount: (v: number) => void;
  format: PostFormat;
  setFormat: (v: PostFormat) => void;
  busy: boolean;
  mentorsUsed: string[];
  onGenerate: () => void;
  onScheduleDraft: (draft: Draft) => void;
  onDiscardDraft: (id: string) => void;
  onEditDraft: (id: string, newBody: string) => void;
};

function DraftCard({
  draft,
  persona,
  onSchedule,
  onDiscard,
  onEdit,
}: {
  draft: Draft;
  persona: Persona | undefined;
  onSchedule: () => void;
  onDiscard: () => void;
  onEdit: (body: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(true);
  const [editText, setEditText] = useState(draft.body);
  const isThread = draft.body.includes("\n---\n");

  return (
    <div className="item-card">
      <div className="item-card-header">
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <span className={`badge ${draft.status === "posted" ? "ok" : draft.status === "failed" ? "err" : "warn"}`}>
            {draft.status}
          </span>
          {persona && (
            <span style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>
              {persona.icon} {persona.name}
            </span>
          )}
        </div>
        <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
          {editText.length}/280
        </span>
      </div>

      {editing ? (
        <div style={{ marginTop: "0.4rem" }}>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            style={{ width: "100%", minHeight: 80, fontSize: "0.88rem" }}
          />
          <div className="row" style={{ marginTop: "0.4rem" }}>
            <button
              type="button"
              className="primary small"
              onClick={() => {
                onEdit(editText);
                setEditing(false);
              }}
            >
              Salvar
            </button>
            <button
              type="button"
              className="small"
              onClick={() => {
                setEditText(draft.body);
                setEditing(false);
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : preview ? (
        <div style={{ marginTop: "0.4rem" }}>
          <TweetPreview body={draft.body} isThread={isThread} />
        </div>
      ) : (
        <div className="item-card-body" style={{ cursor: "pointer" }} onClick={() => setEditing(true)} title="Clique para editar">
          {draft.body}
        </div>
      )}

      {draft.similarity_note && (
        <div className="item-card-meta" style={{ color: "var(--warn)" }}>
          {draft.similarity_note}
        </div>
      )}

      {/* Ações */}
      {!editing && (
        <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem", justifyContent: "flex-end" }}>
          <button type="button" className="small" onClick={() => setPreview(!preview)} title="Alternar preview">
            {preview ? "Raw" : "Preview"}
          </button>
          <button type="button" className="small danger" onClick={onDiscard} title="Descartar">
            Descartar
          </button>
          <button type="button" className="small" onClick={() => { setPreview(false); setEditing(true); }} title="Editar texto">
            Editar
          </button>
          <button type="button" className="small" onClick={onSchedule}>
            Agendar →
          </button>
        </div>
      )}

      <div className="item-card-meta">
        {new Date(draft.created_at).toLocaleString("pt-BR")}
      </div>
    </div>
  );
}

const FORMAT_OPTIONS: { value: PostFormat; label: string; desc: string }[] = [
  { value: "short", label: "Curto", desc: "até 280 chars" },
  { value: "long", label: "Longo", desc: "até 4000 chars (Premium)" },
  { value: "thread", label: "Thread", desc: "3-5 posts conectados" },
];

export function DraftsSection({
  drafts, personas, selectedPersonaId, onSelectPersona,
  tone, setTone, count, setCount, format, setFormat,
  busy, mentorsUsed, onGenerate, onScheduleDraft,
  onDiscardDraft, onEditDraft,
}: Props) {
  const selectedPersona = personas.find(p => p.id === selectedPersonaId);

  return (
    <div>
      <PersonaSelector
        personas={personas}
        selected={selectedPersonaId}
        onSelect={onSelectPersona}
      />

      {/* Seletor de formato */}
      <div style={{ marginBottom: "0.75rem" }}>
        <label>Formato</label>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFormat(opt.value)}
              style={{
                flex: 1,
                padding: "0.45rem 0.5rem",
                borderRadius: "var(--radius-sm)",
                border: `1.5px solid ${format === opt.value ? "var(--accent)" : "var(--border)"}`,
                background: format === opt.value ? "var(--accent-glow)" : "var(--surface-raised)",
                color: format === opt.value ? "var(--accent)" : "var(--text-dim)",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: format === opt.value ? 600 : 400,
                textAlign: "center",
              }}
            >
              <div>{opt.label}</div>
              <div style={{ fontSize: "0.7rem", opacity: 0.7 }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <div className="row" style={{ gap: "0.5rem", marginBottom: "0.5rem" }}>
          <div className="field-group" style={{ flex: 1 }}>
            <label htmlFor="tone">Tom do post {selectedPersona ? `(${selectedPersona.name})` : ""}</label>
            <input
              id="tone"
              value={selectedPersona ? selectedPersona.tone : tone}
              onChange={(e) => setTone(e.target.value)}
              disabled={!!selectedPersona}
              style={selectedPersona ? { opacity: 0.6 } : {}}
            />
          </div>
          <div className="field-group" style={{ maxWidth: 90 }}>
            <label htmlFor="count">Variações</label>
            <input
              id="count"
              type="number"
              min={1}
              max={10}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </div>
        </div>
        <button type="button" className="primary" disabled={busy} onClick={onGenerate} style={{ width: "100%" }}>
          {busy ? <><span className="spinner" /> Gerando {count} variações…</> : `Gerar ${count} variações`}
        </button>

        {mentorsUsed.length > 0 && (
          <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "0.5rem" }}>
            Mentores detectados: {mentorsUsed.map(m => `@${m}`).join(", ")}
          </p>
        )}
      </div>

      {(() => {
        const pending = drafts.filter(d => d.status === "pending_approval" || d.status === "draft");
        const rest = drafts.filter(d => d.status !== "pending_approval" && d.status !== "draft");

        return (
          <>
            {pending.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {pending.map((d) => (
                  <DraftCard
                    key={d.id}
                    draft={d}
                    persona={personas.find(p => p.id === d.persona_id)}
                    onSchedule={() => onScheduleDraft(d)}
                    onDiscard={() => onDiscardDraft(d.id)}
                    onEdit={(body) => onEditDraft(d.id, body)}
                  />
                ))}
              </div>
            )}

            {pending.length === 0 && drafts.length === 0 && (
              <div className="empty-state">
                Nenhum rascunho. Selecione uma persona, analise os tópicos e gere variações.
              </div>
            )}

            {rest.length > 0 && (
              <details style={{ marginTop: "0.75rem", fontSize: "0.82rem", color: "var(--text-dim)" }}>
                <summary style={{ cursor: "pointer", padding: "0.4rem 0" }}>
                  Histórico ({rest.length} {rest.length === 1 ? "rascunho" : "rascunhos"})
                </summary>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                  {rest.map((d) => (
                    <DraftCard
                      key={d.id}
                      draft={d}
                      persona={personas.find(p => p.id === d.persona_id)}
                      onSchedule={() => onScheduleDraft(d)}
                      onDiscard={() => onDiscardDraft(d.id)}
                      onEdit={(body) => onEditDraft(d.id, body)}
                    />
                  ))}
                </div>
              </details>
            )}
          </>
        );
      })()}
    </div>
  );
}
