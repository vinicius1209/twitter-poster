import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store.js";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min atras`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atras`;
  return `${Math.floor(hours / 24)}d atras`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export function CockpitPage() {
  const navigate = useNavigate();
  const drafts = useAppStore((s) => s.drafts);
  const scheduled = useAppStore((s) => s.scheduled);
  const metrics = useAppStore((s) => s.metrics);
  const collectionStats = useAppStore((s) => s.collectionStats);
  const authors = useAppStore((s) => s.authors);

  const pendingDrafts = drafts.filter(
    (d) => d.status === "pending_approval" || d.status === "draft"
  );
  const postedCount = scheduled.filter((s) => s.status === "posted").length;
  const scheduledCount = scheduled.filter((s) => s.status === "scheduled").length;
  const totalCollected = collectionStats.reduce((a, s) => a + s.count, 0);

  // Build activity log from real data
  const activities: { icon: string; text: string; time: string }[] = [];

  // Recent collections
  for (const stat of collectionStats.slice(0, 5)) {
    const label = stat.source === "likes" ? "Curtidas coletadas" : `@${stat.source.replace("profile:", "")} coletado`;
    activities.push({
      icon: stat.source === "likes" ? "heart" : "user",
      text: `${label} (${stat.count} tweets)`,
      time: stat.latest,
    });
  }

  // Recent scheduled
  for (const s of scheduled.slice(0, 3)) {
    activities.push({
      icon: s.status === "posted" ? "check" : s.status === "failed" ? "x" : "clock",
      text: s.status === "posted" ? "Post publicado" : s.status === "failed" ? `Falha: ${s.last_error ?? "erro"}` : "Agendado para publicacao",
      time: s.run_at,
    });
  }

  activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div>
      <div className="page-header">
        <h1>Cockpit</h1>
        <p>Visao geral do seu motor de crescimento</p>
      </div>

      {/* Stats row */}
      <div className="cockpit-stats">
        <div className="stat-card">
          <div style={{ fontSize: "1.4rem", marginBottom: "0.2rem" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </div>
          <div className="stat-card-value">{formatNumber(postedCount)}</div>
          <div className="stat-card-label">Publicados</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: "1.4rem", marginBottom: "0.2rem" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></svg>
          </div>
          <div className="stat-card-value">{formatNumber(metrics?.totalLikes ?? 0)}</div>
          <div className="stat-card-label">Likes</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: "1.4rem", marginBottom: "0.2rem" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </div>
          <div className="stat-card-value">{formatNumber(metrics?.totalViews ?? 0)}</div>
          <div className="stat-card-label">Views</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: "1.4rem", marginBottom: "0.2rem" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div className="stat-card-value">{authors.length}</div>
          <div className="stat-card-label">Mentores</div>
        </div>
      </div>

      <div className="cockpit-grid">
        {/* Action Inbox */}
        <div className="action-inbox" style={{ gridColumn: "1 / -1" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
            <div className="action-inbox-count">{pendingDrafts.length}</div>
            <div className="action-inbox-text">
              <h3>
                {pendingDrafts.length > 0
                  ? "Rascunhos aguardando revisao"
                  : "Nenhum rascunho pendente"}
              </h3>
              <p>
                {pendingDrafts.length > 0
                  ? "Revise, edite e aprove para publicacao"
                  : scheduledCount > 0
                    ? `${scheduledCount} post${scheduledCount > 1 ? "s" : ""} na fila de publicacao`
                    : "Gere novos rascunhos no Studio"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="primary"
            onClick={() => navigate("/studio")}
          >
            {pendingDrafts.length > 0 ? "Revisar" : "Criar"} &rarr;
          </button>
        </div>

        {/* Gamification: Collection */}
        <div className="gamification-card">
          <div className="gamification-card-value">{formatNumber(totalCollected)}</div>
          <div className="gamification-card-label">Tweets na base</div>
          <div className="gamification-card-detail">
            {collectionStats.length} fonte{collectionStats.length !== 1 ? "s" : ""} monitorada{collectionStats.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Gamification: Scheduled */}
        <div className="gamification-card">
          <div className="gamification-card-value">{scheduledCount}</div>
          <div className="gamification-card-label">Na fila</div>
          <div className="gamification-card-detail">
            {postedCount} publicado{postedCount !== 1 ? "s" : ""} no total
          </div>
        </div>
      </div>

      {/* Activity Log */}
      {activities.length > 0 && (
        <div className="activity-log">
          <h3>Atividade recente</h3>
          {activities.slice(0, 8).map((a, i) => (
            <div key={i} className="activity-log-item">
              <span className="activity-log-icon">
                {a.icon === "heart" ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></svg>
                ) : a.icon === "user" ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                ) : a.icon === "check" ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                ) : a.icon === "x" ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                )}
              </span>
              <span className="activity-log-content">{a.text}</span>
              <span className="activity-log-time">{timeAgo(a.time)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Best post */}
      {metrics?.bestPost && (
        <div style={{ marginTop: "1rem" }}>
          <div className="item-card" style={{ borderColor: "color-mix(in srgb, var(--ok) 30%, var(--border))" }}>
            <div className="item-card-header">
              <span className="badge ok">melhor post</span>
              <span style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>
                {formatNumber(metrics.bestPost.likes)} likes / {formatNumber(metrics.bestPost.views)} views
              </span>
            </div>
            <div className="item-card-body">{metrics.bestPost.body}</div>
            <div className="item-card-meta">{new Date(metrics.bestPost.run_at).toLocaleString("pt-BR")}</div>
          </div>
        </div>
      )}
    </div>
  );
}
