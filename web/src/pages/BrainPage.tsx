import { useState } from "react";
import { useAppStore } from "../store.js";
import { api } from "../api.js";
import type { Author } from "@shared/types.js";

type ProfileStudy = {
  handle: string;
  tweetCount: number;
  themes: string[];
  writingStyle: string;
  typicalFormat: string;
  engagementTips: string;
  summary: string;
};

const WINDOW_PRESETS = [
  { label: "6h", value: 6 },
  { label: "24h", value: 24 },
  { label: "48h", value: 48 },
  { label: "7 dias", value: 168 },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min atras`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atras`;
  return `${Math.floor(hours / 24)}d atras`;
}

/* ── MentorCard ───────────────────────────── */

function MentorCard({
  author,
  syncStatus,
  busy,
  onSync,
  onRemove,
  onStudy,
}: {
  author: Author;
  syncStatus: string | null;
  busy: boolean;
  onSync: () => void;
  onRemove: () => void;
  onStudy: () => void;
}) {
  return (
    <div className="mentor-card">
      <div className="mentor-card-header">
        <div className="mentor-card-avatar">
          {author.handle[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <div className="mentor-card-handle">@{author.handle}</div>
          {author.display_name && (
            <div className="mentor-card-name">{author.display_name}</div>
          )}
        </div>
      </div>
      {syncStatus && (
        <div className="mentor-card-status">Ultima coleta: {syncStatus}</div>
      )}
      <div className="mentor-card-actions">
        <button type="button" className="small" disabled={busy} onClick={onStudy}>
          Raio-X
        </button>
        <button type="button" className="small" disabled={busy} onClick={onSync}>
          {busy ? <><span className="spinner" /></> : "Coletar"}
        </button>
        <button type="button" className="small danger" disabled={busy} onClick={onRemove}>
          Remover
        </button>
      </div>
    </div>
  );
}

/* ── StyleXRayDrawer ──────────────────────── */

function StyleXRayDrawer({
  study,
  onClose,
}: {
  study: ProfileStudy;
  onClose: () => void;
}) {
  return (
    <>
      <div className="xray-drawer-overlay" onClick={onClose} />
      <div className="xray-drawer">
        <button className="xray-drawer-close" onClick={onClose}>x</button>

        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.3rem" }}>@{study.handle}</h2>
        <p style={{ fontSize: "0.82rem", color: "var(--text-dim)", marginBottom: "1.25rem" }}>
          {study.tweetCount} tweets analisados
        </p>

        {study.summary && (
          <div className="xray-section">
            <h4>Resumo</h4>
            <p style={{ fontSize: "0.88rem", lineHeight: 1.6 }}>{study.summary}</p>
          </div>
        )}

        {study.themes.length > 0 && (
          <div className="xray-section">
            <h4>Temas</h4>
            <div className="xray-tags">
              {study.themes.map((t, i) => (
                <span key={i} className="xray-tag">{t}</span>
              ))}
            </div>
          </div>
        )}

        {study.writingStyle && (
          <div className="xray-section">
            <h4>Estilo de escrita</h4>
            <p style={{ fontSize: "0.85rem", color: "var(--text-dim)", lineHeight: 1.6 }}>{study.writingStyle}</p>
          </div>
        )}

        {study.typicalFormat && (
          <div className="xray-section">
            <h4>Formato tipico</h4>
            <p style={{ fontSize: "0.85rem", color: "var(--text-dim)", lineHeight: 1.6 }}>{study.typicalFormat}</p>
          </div>
        )}

        {study.engagementTips && (
          <div className="xray-section">
            <h4>Dicas de engajamento</h4>
            <p style={{ fontSize: "0.85rem", color: "var(--text-dim)", lineHeight: 1.6 }}>{study.engagementTips}</p>
          </div>
        )}
      </div>
    </>
  );
}

/* ── BrainPage ────────────────────────────── */

export function BrainPage() {
  const authors = useAppStore((s) => s.authors);
  const collectionStats = useAppStore((s) => s.collectionStats);
  const topics = useAppStore((s) => s.topics);
  const windowH = useAppStore((s) => s.windowH);
  const setWindowH = useAppStore((s) => s.setWindowH);
  const analysisSource = useAppStore((s) => s.analysisSource);
  const setAnalysisSource = useAppStore((s) => s.setAnalysisSource);
  const busy = useAppStore((s) => s.busy);
  const run = useAppStore((s) => s.run);
  const setMsg = useAppStore((s) => s.setMsg);

  const [newHandle, setNewHandle] = useState("");
  const [studyLoading, setStudyLoading] = useState<string | null>(null);
  const [studyResult, setStudyResult] = useState<ProfileStudy | null>(null);
  const [depth, setDepth] = useState(15);

  const maxTweets = depth * 10;

  function getSyncStatus(handle: string): string | null {
    const stat = collectionStats.find((s) => s.source === `profile:${handle}`);
    return stat ? timeAgo(stat.latest) : null;
  }

  async function handleAddAuthor() {
    if (!newHandle.trim()) return;
    await run("author", async () => {
      await api.addAuthor(newHandle.replace(/^@/, ""));
      setNewHandle("");
    });
  }

  async function handleRemoveAuthor(handle: string) {
    await run("del", async () => {
      await api.deleteAuthor(handle);
    });
  }

  async function handleSyncProfile(handle: string) {
    await run("profile", async () => {
      await api.syncProfile(handle, depth, maxTweets);
      setMsg(`@${handle} coletado.`);
    });
  }

  async function handleSyncLikes() {
    await run("likes", async () => {
      await api.syncLikes(depth, maxTweets);
      setMsg("Curtidas coletadas.");
    });
  }

  async function handleSyncWatchlist() {
    await run("watchlist", async () => {
      await api.syncWatchlist();
      setMsg("Watchlist coletada.");
    });
  }

  async function handleStudy(handle: string) {
    setStudyLoading(handle);
    try {
      const result = await api.studyProfile(handle);
      setStudyResult(result);
    } catch (e) {
      setStudyResult({
        handle,
        tweetCount: 0,
        themes: [],
        writingStyle: "",
        typicalFormat: "",
        engagementTips: "",
        summary: e instanceof Error ? e.message : "Erro",
      });
    }
    setStudyLoading(null);
  }

  async function handleAnalyze() {
    await run("analyze", async () => {
      const r = await api.analyze(windowH);
      setAnalysisSource(r.analysisSource);
      setMsg(`${r.summary}\n(${r.sampleSize} trechos via ${r.analysisSource === "llm" ? "IA" : "heuristica"})`);
    });
  }

  const isBusy = !!busy;
  const latest = topics[0];

  return (
    <div>
      <div className="page-header">
        <h1>Cerebro</h1>
        <p>Mentores, analise de estilo e configuracao do agente</p>
      </div>

      {/* Add mentor */}
      <div className="mentor-add">
        <input
          placeholder="@handle para monitorar"
          value={newHandle}
          onChange={(e) => setNewHandle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddAuthor()}
        />
        <button type="button" disabled={isBusy || !newHandle.trim()} onClick={handleAddAuthor}>
          + Adicionar
        </button>
      </div>

      {/* Mentor Grid */}
      {authors.length > 0 ? (
        <div className="mentor-grid">
          {authors.map((a) => (
            <MentorCard
              key={a.id}
              author={a}
              syncStatus={getSyncStatus(a.handle)}
              busy={isBusy || studyLoading === a.handle}
              onSync={() => handleSyncProfile(a.handle)}
              onRemove={() => handleRemoveAuthor(a.handle)}
              onStudy={() => handleStudy(a.handle)}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ marginBottom: "1rem" }}>
          Adicione perfis para monitorar e aprender seu estilo.
        </div>
      )}

      {/* Bulk actions */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <button type="button" disabled={isBusy} onClick={handleSyncLikes} style={{ flex: 1 }}>
          {busy === "likes" ? <><span className="spinner" /> Coletando...</> : "Coletar curtidas"}
        </button>
        {authors.length > 0 && (
          <button type="button" disabled={isBusy} onClick={handleSyncWatchlist} style={{ flex: 1 }}>
            {busy === "watchlist" ? <><span className="spinner" /> Coletando...</> : `Coletar watchlist (${authors.length})`}
          </button>
        )}
      </div>

      {/* Agent Config */}
      <div className="agent-config" style={{ marginBottom: "1.5rem" }}>
        <h3>Configuracao do Agente</h3>

        <div className="config-row">
          <div>
            <div className="config-row-label">Profundidade de coleta</div>
            <div className="config-row-detail">{depth} scrolls (~{maxTweets} tweets)</div>
          </div>
          <input
            type="range"
            min={3}
            max={50}
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            style={{ width: 120, accentColor: "var(--accent)" }}
          />
        </div>

        <div className="config-row">
          <div>
            <div className="config-row-label">Periodo de analise</div>
          </div>
          <div style={{ display: "flex", gap: "0.3rem" }}>
            {WINDOW_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                className="small"
                onClick={() => setWindowH(p.value)}
                style={{
                  border: `1.5px solid ${windowH === p.value ? "var(--accent)" : "var(--border)"}`,
                  background: windowH === p.value ? "var(--accent-glow)" : "var(--surface-raised)",
                  color: windowH === p.value ? "var(--accent)" : "var(--text-dim)",
                  fontWeight: windowH === p.value ? 600 : 400,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="primary"
          disabled={busy === "analyze"}
          onClick={handleAnalyze}
          style={{ width: "100%", marginTop: "0.75rem" }}
        >
          {busy === "analyze" ? <><span className="spinner" /> Analisando...</> : `Analisar ultimas ${windowH}h`}
        </button>
      </div>

      {/* Latest analysis result */}
      {latest && (
        <div style={{ marginBottom: "1.5rem" }}>
          <label>Ultima analise</label>
          <div className="item-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <span className={`badge ${analysisSource === "llm" ? "ok" : "warn"}`}>
                {analysisSource === "llm" ? "IA" : "heuristica"}
              </span>
              <span className="mono" style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                {latest.window_hours}h / {new Date(latest.created_at).toLocaleString("pt-BR")}
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
                    <span key={i} className="xray-tag">{t}</span>
                  ))}
                </div>
              ) : null;
            })()}
          </div>
        </div>
      )}

      {/* Collection stats */}
      {collectionStats.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <label>Base de conhecimento</label>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {collectionStats.map((s) => (
              <div key={s.source} className="item-card" style={{ padding: "0.5rem 0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="mono" style={{ fontSize: "0.82rem", color: "var(--accent)" }}>
                    {s.source === "likes" ? "Minhas curtidas" : s.source.replace("profile:", "@")}
                  </span>
                  <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                    {s.hasMedia > 0 && (
                      <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>{s.hasMedia} midia</span>
                    )}
                    <span className="mono" style={{ fontSize: "0.85rem", fontWeight: 600 }}>{s.count}</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>{timeAgo(s.latest)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: "0.5rem",
            padding: "0.5rem 0.8rem",
            background: "var(--bg)",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.82rem",
            color: "var(--text-dim)",
            display: "flex",
            justifyContent: "space-between",
          }}>
            <span>Total na base</span>
            <span className="mono" style={{ color: "var(--accent)", fontWeight: 600 }}>
              {collectionStats.reduce((a, s) => a + s.count, 0)} tweets
            </span>
          </div>
        </div>
      )}

      {/* Style X-Ray Drawer */}
      {studyResult && (
        <StyleXRayDrawer study={studyResult} onClose={() => setStudyResult(null)} />
      )}
    </div>
  );
}
