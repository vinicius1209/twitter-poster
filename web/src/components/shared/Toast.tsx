import { useEffect } from "react";
import { X } from "lucide-react";
import { useAppStore } from "../../store.js";

export function Toast() {
  const msg = useAppStore((s) => s.msg);
  const clearMsg = useAppStore((s) => s.clearMsg);

  useEffect(() => {
    if (!msg) return;
    const timer = setTimeout(clearMsg, 8000);
    return () => clearTimeout(timer);
  }, [msg, clearMsg]);

  if (!msg) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[300] max-w-[420px] w-[calc(100%-2.5rem)] animate-in slide-in-from-bottom-3 duration-200">
      <div className="relative rounded-lg border border-border bg-card p-3.5 pr-10 text-sm text-muted-foreground shadow-2xl font-mono leading-relaxed whitespace-pre-wrap max-h-[200px] overflow-y-auto">
        <button
          onClick={clearMsg}
          className="absolute top-2.5 right-2.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-4" />
        </button>
        {msg}
      </div>
    </div>
  );
}
