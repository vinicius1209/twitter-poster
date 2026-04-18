import { type ReactNode } from "react";

type Props = {
  number: number;
  title: string;
  description: string;
  status: "pending" | "active" | "done";
  statusLabel?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export function Step({ number, title, description, status, statusLabel, open, onToggle, children }: Props) {
  const statusText = statusLabel ?? (status === "done" ? "concluído" : status === "active" ? "ativo" : "pendente");

  return (
    <div className={`step ${status}`}>
      <div className="step-header" onClick={onToggle} role="button" tabIndex={0}>
        <div className="step-number">
          {status === "done" ? "✓" : number}
        </div>
        <div className="step-header-text">
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className={`step-status ${status}`}>{statusText}</span>
      </div>
      {open && (
        <div className="step-body">
          <div className="step-card">{children}</div>
        </div>
      )}
    </div>
  );
}
