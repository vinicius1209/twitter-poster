import { useState } from "react";
import type { RawEvent, Author } from "@shared/types.js";

type CollectionStat = { source: string; count: number; latest: string; hasMedia: number };

type Props = {
  stats: CollectionStat[];
  totalEvents: number;
  authors: Author[];
  busy: boolean;
  onSyncLikes: (maxScrolls: number, maxTweets: number) => void;
  onSyncProfile: (handle: string, maxScrolls: number, maxTweets: number) => void;
  onSyncWatchlist: () => void;
  onAddAuthor: (handle: string) => void;
  onDeleteAuthor: (handle: string) => void;
  onLoadTweets: (source: string) => Promise<RawEvent[]>;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  return `${Math.floor(hours / 24)}d atrás`;
}

function SourceCard({ stat, onLoadTweets }: { stat: CollectionStat; onLoadTweets: () => Promise<RawEvent[]> }) {
  const [open, setOpen] = useState(false);
  const [tweets, setTweets] = useState<RawEvent[]>([]);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const data = await onLoadTweets();
      setTweets(data);
    } catch {
      setTweets([]);
    }
    setLoading(false);
    setOpen(true);
  }

  return (
    <div className="item-card" style={{ padding: "0.6rem 0.8rem", cursor: "pointer" }} onClick={toggle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span className="mono" style={{ fontSize: "0.82rem", color: "var(--accent)" }}>
            {stat.source === "likes" ? "Minhas curtidas" : stat.source.replace("profile:", "@")}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginLeft: "0.5rem" }}>
            {timeAgo(stat.latest)}
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
          {stat.hasMedia > 0 && (
            <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
              {stat.hasMedia} com mídia
            </span>
          )}
          <span className="mono" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
            {stat.count}
          </span>
          <span style={{ fontSize: "0.7rem", color: "var(--text-dim)", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "" }}>
            ▼
          </span>
        </div>
      </div>

      {open && (
        <div style={{ marginTop: "0.5rem" }} onClick={(e) => e.stopPropagation()}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "0.5rem" }}><span className="spinner" /></div>
          ) : tweets.length > 0 ? (
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {tweets.map((ev) => (
                <div key={ev.id} style={{
                  padding: "0.4rem 0",
                  borderTop: "1px solid var(--border)",
                  fontSize: "0.8rem",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                    <span className="mono" style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                      @{ev.author_handle ?? "?"}
                    </span>
                    {ev.tweet_url && (
                      <a href={ev.tweet_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.72rem" }}>
                        ver no X ↗
                      </a>
                    )}
                  </div>
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.4, color: "var(--text)" }}>
                    {ev.text_content.length > 250 ? ev.text_content.slice(0, 250) + "…" : ev.text_content}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", textAlign: "center" }}>Nenhum tweet encontrado.</p>
          )}
        </div>
      )}
    </div>
  );
}

export function CollectCard({
  stats, totalEvents, authors, busy,
  onSyncLikes, onSyncProfile, onSyncWatchlist,
  onAddAuthor, onDeleteAuthor, onLoadTweets,
}: Props) {
  const [profileSync, setProfileSync] = useState("");
  const [newAuthor, setNewAuthor] = useState("");
  const [depth, setDepth] = useState(15);

  const maxTweets = depth * 10;

  return (
    <div>
      {/* Profundidade */}
      <div style={{ marginBottom: "0.75rem" }}>
        <label>Profundidade: {depth} scrolls (~{maxTweets} tweets)</label>
        <input
          type="range"
          min={3}
          max={50}
          value={depth}
          onChange={(e) => setDepth(Number(e.target.value))}
          style={{ width: "100%", accentColor: "var(--accent)" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-dim)" }}>
          <span>Rápido (30)</span>
          <span>Profundo (500)</span>
        </div>
      </div>

      {/* Ações */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
        <button type="button" className="primary" disabled={busy} onClick={() => onSyncLikes(depth, maxTweets)} style={{ width: "100%" }}>
          {busy ? <><span className="spinner" /> Coletando…</> : "Coletar minhas curtidas"}
        </button>
        <div className="row">
          <input
            placeholder="@usuario — coletar perfil"
            value={profileSync}
            onChange={(e) => setProfileSync(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            disabled={busy || !profileSync.trim()}
            onClick={() => {
              onSyncProfile(profileSync.replace(/^@/, ""), depth, maxTweets);
              setProfileSync("");
            }}
          >
            Coletar
          </button>
        </div>
        {authors.length > 0 && (
          <button type="button" disabled={busy} onClick={onSyncWatchlist} style={{ width: "100%" }}>
            Coletar watchlist ({authors.length} perfis)
          </button>
        )}
      </div>

      {/* Watchlist */}
      <div style={{ marginBottom: "1rem" }}>
        <label>Watchlist — perfis monitorados</label>
        <div className="row" style={{ marginBottom: "0.5rem" }}>
          <input
            placeholder="handle sem @"
            value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            disabled={busy || !newAuthor.trim()}
            onClick={() => { onAddAuthor(newAuthor); setNewAuthor(""); }}
          >
            + Adicionar
          </button>
        </div>
        {authors.length > 0 ? (
          <div className="author-tags">
            {authors.map((a) => (
              <span key={a.id} className="author-tag">
                @{a.handle}
                <button type="button" onClick={() => onDeleteAuthor(a.handle)} title="Remover">×</button>
              </span>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>
            Adicione perfis para monitorar automaticamente.
          </p>
        )}
      </div>

      {/* Base de conhecimento */}
      {stats.length > 0 ? (
        <div>
          <label>Base de conhecimento</label>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {stats.map((s) => (
              <SourceCard key={s.source} stat={s} onLoadTweets={() => onLoadTweets(s.source)} />
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
              {totalEvents} tweets
            </span>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          Nenhum tweet coletado. Clique em "Coletar minhas curtidas" ou adicione um perfil.
        </div>
      )}
    </div>
  );
}
