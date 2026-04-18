import type { SessionHealth } from "@shared/types.js";
import type { QuickSessionStatus } from "../api.js";

type Props = {
  session: SessionHealth | null;
  quickStatus: QuickSessionStatus | null;
  busy: boolean;
  onCheck: () => void;
};

export function SessionCard({ session, quickStatus, busy, onCheck }: Props) {
  const isLoggedIn = session?.loggedIn ?? false;

  return (
    <div>
      {!session && quickStatus && (
        <p style={{ fontSize: "0.85rem", color: "var(--text-dim)", marginBottom: "1rem" }}>
          {quickStatus.profileExists
            ? "Perfil do navegador encontrado no disco. Verifique se a sessão ainda está ativa."
            : "Nenhum perfil salvo ainda. Clique abaixo para abrir o navegador e fazer login no X."}
        </p>
      )}

      {session && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            marginBottom: "1rem",
            padding: "0.7rem 0.9rem",
            borderRadius: "var(--radius-sm)",
            background: isLoggedIn ? "var(--ok-bg)" : "var(--warn-bg)",
            border: `1px solid ${isLoggedIn ? "color-mix(in srgb, var(--ok) 20%, transparent)" : "color-mix(in srgb, var(--warn) 20%, transparent)"}`,
          }}
        >
          <span style={{ fontSize: "1.1rem" }}>{isLoggedIn ? "●" : "○"}</span>
          <span style={{ fontSize: "0.88rem", color: isLoggedIn ? "var(--ok)" : "var(--warn)" }}>
            {session.hint}
          </span>
        </div>
      )}

      <button
        type="button"
        className="primary"
        disabled={busy}
        onClick={onCheck}
        style={{ width: "100%" }}
      >
        {busy ? <><span className="spinner" /> Verificando…</> : "Verificar sessão no X"}
      </button>

      {!session && (
        <p style={{ fontSize: "0.78rem", color: "var(--text-dim)", marginTop: "0.6rem", textAlign: "center" }}>
          Abre o navegador e navega ao X. Pode demorar ~15s.
        </p>
      )}
    </div>
  );
}
