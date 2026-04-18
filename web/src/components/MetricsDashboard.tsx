import type { MetricsSummary } from "@shared/types.js";

type Props = {
  metrics: MetricsSummary | null;
  busy: boolean;
  onCollect: () => void;
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div style={{
      background: "var(--bg)",
      borderRadius: "var(--radius-sm)",
      padding: "0.85rem",
      textAlign: "center",
      flex: 1,
      minWidth: 100,
    }}>
      <div style={{ fontSize: "1.4rem", marginBottom: "0.2rem" }}>{icon}</div>
      <div className="mono" style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--accent)" }}>{value}</div>
      <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
    </div>
  );
}

export function MetricsDashboard({ metrics, busy, onCollect }: Props) {
  if (!metrics) {
    return (
      <div>
        <div className="empty-state">Carregando métricas...</div>
        <button type="button" className="primary" disabled={busy} onClick={onCollect} style={{ width: "100%", marginTop: "0.75rem" }}>
          {busy ? <><span className="spinner" /> Coletando…</> : "Coletar métricas agora"}
        </button>
      </div>
    );
  }

  const { totalPosts, totalLikes, totalRetweets, totalViews, bestPost, posts } = metrics;

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <StatCard icon="📝" label="Posts" value={formatNumber(totalPosts)} />
        <StatCard icon="❤️" label="Likes" value={formatNumber(totalLikes)} />
        <StatCard icon="🔄" label="Retweets" value={formatNumber(totalRetweets)} />
        <StatCard icon="👁" label="Views" value={formatNumber(totalViews)} />
      </div>

      {/* Best post */}
      {bestPost && (
        <div className="item-card" style={{ borderColor: "color-mix(in srgb, var(--ok) 30%, var(--border))", marginBottom: "1rem" }}>
          <div className="item-card-header">
            <span className="badge ok">melhor post</span>
            <span style={{ fontSize: "0.78rem", color: "var(--text-dim)" }}>
              ❤️ {bestPost.likes} · 👁 {formatNumber(bestPost.views)}
            </span>
          </div>
          <div className="item-card-body">{bestPost.body}</div>
          <div className="item-card-meta">{new Date(bestPost.run_at).toLocaleString("pt-BR")}</div>
        </div>
      )}

      {/* Per-post metrics */}
      {posts.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
          <label>Performance por post</label>
          {posts.map((p) => (
            <div key={p.id} className="item-card">
              <div className="item-card-body" style={{ fontSize: "0.85rem" }}>
                {p.body.length > 120 ? p.body.slice(0, 120) + "…" : p.body}
              </div>
              {p.latestMetric ? (
                <div className="item-card-meta" style={{ display: "flex", gap: "1rem" }}>
                  <span>❤️ {p.latestMetric.likes}</span>
                  <span>🔄 {p.latestMetric.retweets}</span>
                  <span>💬 {p.latestMetric.replies}</span>
                  <span>👁 {formatNumber(p.latestMetric.views)}</span>
                  {p.latestMetric.followers_at_time && (
                    <span>👥 {formatNumber(p.latestMetric.followers_at_time)}</span>
                  )}
                </div>
              ) : (
                <div className="item-card-meta">Métricas ainda não coletadas</div>
              )}
              <div className="item-card-meta">
                {new Date(p.run_at).toLocaleString("pt-BR")}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ marginBottom: "1rem" }}>
          Nenhum post publicado ainda. Agende e publique posts para ver métricas.
        </div>
      )}

      <button type="button" className="primary" disabled={busy} onClick={onCollect} style={{ width: "100%" }}>
        {busy ? <><span className="spinner" /> Coletando métricas…</> : "Atualizar métricas"}
      </button>
      <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "0.5rem", textAlign: "center" }}>
        Métricas são coletadas automaticamente a cada 6h. Clique para forçar atualização.
      </p>
    </div>
  );
}
