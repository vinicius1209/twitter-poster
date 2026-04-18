import type { ScheduledPost } from "@shared/types.js";

type Props = {
  scheduled: ScheduledPost[];
  scheduleBody: string;
  setScheduleBody: (v: string) => void;
  scheduleAt: string;
  setScheduleAt: (v: string) => void;
  busy: boolean;
  onSchedule: () => void;
  onCancel: (id: string) => void;
};

export function ScheduleSection({
  scheduled, scheduleBody, setScheduleBody, scheduleAt, setScheduleAt,
  busy, onSchedule, onCancel,
}: Props) {
  return (
    <div>
      <div style={{ marginBottom: "1rem" }}>
        <label>Texto do post</label>
        <textarea
          value={scheduleBody}
          onChange={(e) => setScheduleBody(e.target.value)}
          placeholder="Cole ou edite o texto do rascunho que deseja agendar…"
          style={{ marginBottom: "0.5rem" }}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-dim)", marginBottom: "0.75rem" }}>
          <span>{scheduleBody.length} caracteres {scheduleBody.length <= 280 ? "(curto)" : scheduleBody.length <= 4000 ? "(longo — requer Premium)" : "(thread)"}</span>
          {scheduleBody.length > 25000 && <span style={{ color: "var(--danger)" }}>Excede o limite máximo!</span>}
        </div>

        <label htmlFor="dt">Data e hora</label>
        <input
          id="dt"
          type="datetime-local"
          value={scheduleAt}
          onChange={(e) => setScheduleAt(e.target.value)}
          style={{ marginBottom: "0.75rem" }}
        />

        <button
          type="button"
          className="primary"
          disabled={busy || !scheduleBody.trim() || !scheduleAt || scheduleBody.length > 25000}
          onClick={onSchedule}
          style={{ width: "100%" }}
        >
          {busy ? <><span className="spinner" /> Agendando…</> : "Agendar publicação"}
        </button>

        <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "0.5rem", textAlign: "center" }}>
          O app publica automaticamente no horário. Mantenha-o rodando com o navegador logado.
        </p>
      </div>

      {scheduled.length > 0 && (
        <div>
          <label style={{ marginBottom: "0.5rem" }}>Fila de publicação</label>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {scheduled.map((s) => (
              <div key={s.id} className="item-card">
                <div className="item-card-header">
                  <span className={`badge ${s.status === "posted" ? "ok" : s.status === "failed" ? "err" : "warn"}`}>
                    {s.status}
                  </span>
                  {s.status === "scheduled" && (
                    <button type="button" className="small danger" onClick={() => onCancel(s.id)}>
                      Cancelar
                    </button>
                  )}
                </div>
                <div className="item-card-body" style={{ fontSize: "0.85rem" }}>{s.body}</div>
                <div className="item-card-meta">
                  {new Date(s.run_at).toLocaleString("pt-BR")}
                  {s.last_error && <span style={{ color: "var(--danger)", marginLeft: "0.5rem" }}>· {s.last_error}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
