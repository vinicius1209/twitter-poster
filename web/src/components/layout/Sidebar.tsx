import { NavLink } from "react-router-dom";
import { useAppStore } from "../../store.js";
import { setToken as persistToken } from "../../api.js";
import { useState } from "react";

export function Sidebar() {
  const quickStatus = useAppStore((s) => s.quickStatus);
  const drafts = useAppStore((s) => s.drafts);
  const token = useAppStore((s) => s.token);
  const setToken = useAppStore((s) => s.setToken);
  const [showSettings, setShowSettings] = useState(false);

  const pendingCount = drafts.filter(
    (d) => d.status === "pending_approval" || d.status === "draft"
  ).length;

  const healthStatus = quickStatus
    ? quickStatus.ok
      ? "ok"
      : quickStatus.profileExists
        ? "warn"
        : "err"
    : "unknown";

  const healthLabel = quickStatus
    ? quickStatus.ok
      ? "Agent sincronizado"
      : quickStatus.hint
    : "Verificando...";

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>Post<span>X</span></h1>
        <p>Motor de crescimento no X</p>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/cockpit"
          className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
        >
          <span className="sidebar-link-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          </span>
          <span className="sidebar-link-label">Cockpit</span>
        </NavLink>

        <NavLink
          to="/studio"
          className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
        >
          <span className="sidebar-link-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </span>
          <span className="sidebar-link-label">Studio</span>
          {pendingCount > 0 && (
            <span className="sidebar-link-badge">{pendingCount}</span>
          )}
        </NavLink>

        <NavLink
          to="/brain"
          className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
        >
          <span className="sidebar-link-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44A2.5 2.5 0 0 1 4.5 17.5a2.5 2.5 0 0 1-.44-4.96A2.5 2.5 0 0 1 6.5 10a2.5 2.5 0 0 1 .44-4.96A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44A2.5 2.5 0 0 0 19.5 17.5a2.5 2.5 0 0 0 .44-4.96A2.5 2.5 0 0 0 17.5 10a2.5 2.5 0 0 0-.44-4.96A2.5 2.5 0 0 0 14.5 2Z"/></svg>
          </span>
          <span className="sidebar-link-label">Cerebro</span>
        </NavLink>
      </nav>

      <div className="sidebar-settings">
        <details open={showSettings} onToggle={(e) => setShowSettings((e.target as HTMLDetailsElement).open)}>
          <summary>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.32 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
            Config
          </summary>
          <input
            type="password"
            placeholder="API Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </details>
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-health">
          <span className={`sidebar-health-dot ${healthStatus}`} />
          <span>{healthLabel}</span>
        </div>
      </div>
    </aside>
  );
}
