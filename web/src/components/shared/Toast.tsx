import { useAppStore } from "../../store.js";

export function Toast() {
  const msg = useAppStore((s) => s.msg);
  const clearMsg = useAppStore((s) => s.clearMsg);

  if (!msg) return null;

  return (
    <div className="toast-container">
      <div className="toast">
        <button className="toast-close" onClick={clearMsg}>x</button>
        {msg}
      </div>
    </div>
  );
}
