import { useState } from "react";
import { useAppStore } from "../store.js";
import { api } from "../api.js";
import { TweetPreview } from "../components/TweetPreview.js";
import type { Draft, Persona } from "@shared/types.js";

type PostFormat = "short" | "long" | "thread";

const FORMAT_OPTIONS: { value: PostFormat; label: string; desc: string }[] = [
  { value: "short", label: "Curto", desc: "280" },
  { value: "long", label: "Longo", desc: "4000" },
  { value: "thread", label: "Thread", desc: "3-5" },
];

/* ── TweetCard ────────────────────────────── */

function TweetCard({
  draft,
  persona,
  onSchedule,
  onDiscard,
  onEdit,
}: {
  draft: Draft;
  persona: Persona | undefined;
  onSchedule: (body: string) => void;
  onDiscard: () => void;
  onEdit: (body: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(draft.body);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleAt, setScheduleAt] = useState(() => {
    const t = new Date();
    t.setMinutes(t.getMinutes() + 5);
    return t.toISOString().slice(0, 16);
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const isThread = draft.body.includes("\n---\n");

  async function handleAction(name: string, fn: () => void | Promise<void>) {
    if (actionLoading) return;
    setActionLoading(name);
    try { await fn(); } finally { setActionLoading(null); }
  }

  return (
    <div className="tweet-card">
      <div className="tweet-card-header">
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <span className={`badge ${draft.status === "posted" ? "ok" : draft.status === "failed" ? "err" : "warn"}`}>
            {{ pending_approval: "Pendente", draft: "Rascunho", scheduled: "Agendado", posted: "Publicado", failed: "Falhou", discarded: "Descartado" }[draft.status] ?? draft.status}
          </span>
          {persona && (
            <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
              {persona.icon} {persona.name}
            </span>
          )}
        </div>
        <span style={{ fontSize: "0.7rem", color: "var(--text-dim)", fontFamily: "'Space Mono', monospace" }}>
          {editText.length} chars
        </span>
      </div>

      {editing ? (
        <div style={{ padding: "0.5rem 0.75rem" }}>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            style={{ width: "100%", minHeight: 80, fontSize: "0.85rem" }}
          />
          <div className="row" style={{ marginTop: "0.4rem" }}>
            <button
              type="button"
              className="primary small"
              disabled={!!actionLoading}
              onClick={() => handleAction("save", () => {
                onEdit(editText);
                setEditing(false);
              })}
            >
              {actionLoading === "save" ? <><span className="spinner" /> Salvando...</> : "Salvar"}
            </button>
            <button type="button" className="small" onClick={() => { setEditText(draft.body); setEditing(false); }}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="tweet-card-preview">
          <TweetPreview body={draft.body} isThread={isThread} />
        </div>
      )}

      {draft.similarity_note && (
        <div style={{ padding: "0 0.75rem 0.25rem", fontSize: "0.75rem", color: "var(--warn)" }}>
          {draft.similarity_note}
        </div>
      )}

      {!editing && (
        <div className="tweet-card-actions" style={{ position: "relative" }}>
          <button type="button" className="small danger" disabled={!!actionLoading} onClick={() => handleAction("discard", onDiscard)}>
            {actionLoading === "discard" ? <><span className="spinner" /></> : "Descartar"}
          </button>
          <button type="button" className="small" disabled={!!actionLoading} onClick={() => setEditing(true)}>
            Editar
          </button>
          <button
            type="button"
            className="small primary"
            disabled={!!actionLoading}
            onClick={() => setShowSchedule(!showSchedule)}
          >
            Agendar
          </button>

          {showSchedule && (
            <div className="schedule-popover">
              <label>Data e hora</label>
              <input
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
              />
              <button
                type="button"
                className="primary small"
                disabled={!!actionLoading || !scheduleAt}
                onClick={() => handleAction("schedule", () => {
                  onSchedule(new Date(scheduleAt).toISOString());
                  setShowSchedule(false);
                })}
                style={{ width: "100%" }}
              >
                {actionLoading === "schedule" ? <><span className="spinner" /> Agendando...</> : "Confirmar"}
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ padding: "0 0.75rem 0.5rem", fontSize: "0.7rem", color: "var(--text-dim)", fontFamily: "'Space Mono', monospace" }}>
        {new Date(draft.created_at).toLocaleString("pt-BR")}
      </div>
    </div>
  );
}

/* ── ScheduledCard (for "Na Fila" / "Publicados" columns) ──── */

function ScheduledCard({
  post,
  onCancel,
}: {
  post: { id: string; body: string; run_at: string; status: string; last_error: string | null; tweet_url: string | null };
  onCancel: () => void;
}) {
  const isThread = post.body.includes("\n---\n");
  return (
    <div className="tweet-card">
      <div className="tweet-card-header">
        <span className={`badge ${post.status === "posted" ? "ok" : post.status === "failed" ? "err" : "warn"}`}>
          {post.status === "posted" ? "Publicado" : post.status === "failed" ? "Falhou" : "Agendado"}
        </span>
        <span style={{ fontSize: "0.7rem", color: "var(--text-dim)", fontFamily: "'Space Mono', monospace" }}>
          {new Date(post.run_at).toLocaleString("pt-BR")}
        </span>
      </div>
      <div className="tweet-card-preview">
        <TweetPreview body={post.body} isThread={isThread} />
      </div>
      {post.last_error && (
        <div style={{ padding: "0 0.75rem 0.25rem", fontSize: "0.72rem", color: "var(--danger)" }}>
          {post.last_error}
        </div>
      )}
      {post.status === "scheduled" && (
        <div className="tweet-card-actions">
          <button type="button" className="small danger" onClick={onCancel}>Cancelar</button>
        </div>
      )}
    </div>
  );
}

/* ── KanbanColumn ─────────────────────────── */

function KanbanColumn({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="kanban-column">
      <div className="kanban-column-header">
        <span className="kanban-column-title">{title}</span>
        <span className="kanban-column-count">{count}</span>
      </div>
      <div className="kanban-column-body">
        {children}
      </div>
    </div>
  );
}

/* ── StudioPage ───────────────────────────── */

export function StudioPage() {
  const drafts = useAppStore((s) => s.drafts);
  const scheduled = useAppStore((s) => s.scheduled);
  const personas = useAppStore((s) => s.personas);
  const selectedPersonaId = useAppStore((s) => s.selectedPersonaId);
  const setSelectedPersonaId = useAppStore((s) => s.setSelectedPersonaId);
  const tone = useAppStore((s) => s.tone);
  const setTone = useAppStore((s) => s.setTone);
  const draftCount = useAppStore((s) => s.draftCount);
  const setDraftCount = useAppStore((s) => s.setDraftCount);
  const draftFormat = useAppStore((s) => s.draftFormat);
  const setDraftFormat = useAppStore((s) => s.setDraftFormat);
  const windowH = useAppStore((s) => s.windowH);
  const busy = useAppStore((s) => s.busy);
  const mentorsUsed = useAppStore((s) => s.mentorsUsed);
  const run = useAppStore((s) => s.run);
  const setMentorsUsed = useAppStore((s) => s.setMentorsUsed);
  const setMsg = useAppStore((s) => s.setMsg);

  const selectedPersona = personas.find((p) => p.id === selectedPersonaId);

  // Split drafts by status
  const pendingDrafts = drafts.filter((d) => d.status === "pending_approval" || d.status === "draft");
  const scheduledPosts = scheduled.filter((s) => s.status === "scheduled");
  const postedPosts = scheduled.filter((s) => s.status === "posted" || s.status === "failed");

  // Ghostwriter state
  const [ghostText, setGhostText] = useState("");
  const [showGhostwriter, setShowGhostwriter] = useState(false);

  async function handleGenerate() {
    await run("draft", async () => {
      const r = await api.generateDrafts({
        windowHours: windowH,
        tone,
        count: draftCount,
        personaId: selectedPersonaId ?? undefined,
        format: draftFormat,
      });
      setMentorsUsed(r.mentorsUsed);
      setMsg(`${r.drafts.length} variacoes geradas. Mentores: ${r.mentorsUsed.map((m) => "@" + m).join(", ") || "nenhum"}`);
    });
  }

  async function handleGhostwrite() {
    await run("ghostwrite", async () => {
      const r = await api.ghostwrite(ghostText, draftFormat, draftCount);
      setMsg(`${r.drafts.length} posts gerados pelo ghostwriter.`);
    });
  }

  async function handleScheduleDraft(draftId: string, body: string, runAt: string) {
    await run("schedule", async () => {
      await api.schedule(body, runAt, draftId);
      setMsg("Post agendado.");
    });
  }

  async function handleDiscard(id: string) {
    await run("discard", async () => {
      await api.discardDraft(id);
    });
  }

  async function handleEdit(id: string, body: string) {
    await run("edit", async () => {
      await api.patchDraft(id, { body });
      setMsg("Rascunho editado.");
    });
  }

  async function handleCancel(id: string) {
    await run("cancel", async () => {
      await api.cancelScheduled(id);
      setMsg("Agendamento cancelado.");
    });
  }

  return (
    <div>
      <div className="page-header">
        <h1>Studio</h1>
        <p>Crie, revise e publique seus posts</p>
      </div>

      <div className="studio-layout">
        <div className="studio-main">
          {/* Kanban Board */}
          <div className="kanban">
            <KanbanColumn title="Ideias" count={pendingDrafts.length}>
              {pendingDrafts.length === 0 ? (
                <div className="empty-state" style={{ margin: "0.5rem", fontSize: "0.82rem" }}>
                  Gere rascunhos no painel lateral
                </div>
              ) : (
                pendingDrafts.map((d) => (
                  <TweetCard
                    key={d.id}
                    draft={d}
                    persona={personas.find((p) => p.id === d.persona_id)}
                    onSchedule={(runAt) => handleScheduleDraft(d.id, d.body, runAt)}
                    onDiscard={() => handleDiscard(d.id)}
                    onEdit={(body) => handleEdit(d.id, body)}
                  />
                ))
              )}
            </KanbanColumn>

            <KanbanColumn title="Na Fila" count={scheduledPosts.length}>
              {scheduledPosts.length === 0 ? (
                <div className="empty-state" style={{ margin: "0.5rem", fontSize: "0.82rem" }}>
                  Aprove rascunhos para agendar
                </div>
              ) : (
                scheduledPosts.map((s) => (
                  <ScheduledCard key={s.id} post={s} onCancel={() => handleCancel(s.id)} />
                ))
              )}
            </KanbanColumn>

            <KanbanColumn title="Publicados" count={postedPosts.length}>
              {postedPosts.length === 0 ? (
                <div className="empty-state" style={{ margin: "0.5rem", fontSize: "0.82rem" }}>
                  Posts publicados aparecem aqui
                </div>
              ) : (
                postedPosts.map((s) => (
                  <ScheduledCard key={s.id} post={s} onCancel={() => {}} />
                ))
              )}
            </KanbanColumn>
          </div>
        </div>

        {/* Right sidebar: Persona + Generate */}
        <div className="studio-sidebar">
          <div className="persona-toolbar">
            {/* Personas */}
            {personas.length > 0 && (
              <div>
                <h3>Persona</h3>
                <div className="persona-grid">
                  {personas.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`persona-btn ${selectedPersonaId === p.id ? "active" : ""}`}
                      onClick={() => setSelectedPersonaId(selectedPersonaId === p.id ? null : p.id)}
                    >
                      <span className="persona-btn-icon">{p.icon}</span>
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
                {selectedPersona && (
                  <p style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.35rem" }}>
                    {selectedPersona.description}
                  </p>
                )}
              </div>
            )}

            {/* Tone */}
            <div>
              <label>Tom {selectedPersona ? `(${selectedPersona.name})` : ""}</label>
              <input
                value={selectedPersona ? selectedPersona.tone : tone}
                onChange={(e) => setTone(e.target.value)}
                disabled={!!selectedPersona}
                style={selectedPersona ? { opacity: 0.6 } : {}}
              />
            </div>

            {/* Format */}
            <div className="generate-bar">
              <label>Formato</label>
              <div className="format-options">
                {FORMAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`format-btn ${draftFormat === opt.value ? "active" : ""}`}
                    onClick={() => setDraftFormat(opt.value)}
                  >
                    {opt.label}
                    <div style={{ fontSize: "0.65rem", opacity: 0.7 }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Count */}
            <div>
              <label>Variacoes</label>
              <input
                type="number"
                min={1}
                max={10}
                value={draftCount}
                onChange={(e) => setDraftCount(Number(e.target.value))}
              />
            </div>

            {/* Generate button */}
            <button
              type="button"
              className="primary"
              disabled={busy === "draft"}
              onClick={handleGenerate}
              style={{ width: "100%" }}
            >
              {busy === "draft" ? <><span className="spinner" /> Gerando...</> : `Gerar ${draftCount} variacoes`}
            </button>

            {mentorsUsed.length > 0 && (
              <p style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                Mentores: {mentorsUsed.map((m) => `@${m}`).join(", ")}
              </p>
            )}

            {/* Ghostwriter toggle */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
              <button
                type="button"
                className="small"
                onClick={() => setShowGhostwriter(!showGhostwriter)}
                style={{ width: "100%", fontSize: "0.78rem" }}
              >
                {showGhostwriter ? "Fechar Ghostwriter" : "Ghostwriter"}
              </button>
              {showGhostwriter && (
                <div style={{ marginTop: "0.5rem" }}>
                  <textarea
                    value={ghostText}
                    onChange={(e) => setGhostText(e.target.value)}
                    placeholder="Cole um texto para transformar em posts..."
                    style={{ minHeight: 80, fontSize: "0.82rem" }}
                  />
                  <button
                    type="button"
                    className="primary small"
                    disabled={busy === "ghostwrite" || ghostText.trim().length < 10}
                    onClick={handleGhostwrite}
                    style={{ width: "100%", marginTop: "0.35rem" }}
                  >
                    {busy === "ghostwrite" ? <><span className="spinner" /> Transformando...</> : `Gerar ${draftCount} posts`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
