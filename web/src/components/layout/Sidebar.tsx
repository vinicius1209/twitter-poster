import { NavLink } from "react-router-dom";
import { LayoutDashboard, PenLine, Brain, Settings, Loader2 } from "lucide-react";
import { useAppStore } from "../../store.js";
import { setToken as persistToken } from "../../api.js";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const NAV_ITEMS = [
  { to: "/cockpit", label: "Cockpit", icon: LayoutDashboard },
  { to: "/studio", label: "Studio", icon: PenLine },
  { to: "/brain", label: "Cerebro", icon: Brain },
] as const;

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
    ? quickStatus.ok ? "ok" : quickStatus.profileExists ? "warn" : "err"
    : "unknown";

  const healthLabel = quickStatus
    ? quickStatus.ok ? "Agent sincronizado" : quickStatus.hint
    : "Verificando...";

  return (
    <aside className="fixed top-0 left-0 z-50 flex h-screen w-60 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Brand */}
      <div className="border-b border-sidebar-border px-5 py-5">
        <h1 className="text-lg font-bold tracking-tight">
          Post<span className="text-primary">X</span>
        </h1>
        <p className="mt-0.5 text-[0.7rem] font-light text-muted-foreground">
          Motor de crescimento no X
        </p>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-sidebar-accent text-primary border border-primary/20"
                  : "text-muted-foreground border border-transparent hover:bg-secondary hover:text-foreground"
              )
            }
          >
            <Icon className="size-[18px] shrink-0" />
            <span className="flex-1">{label}</span>
            {to === "/studio" && pendingCount > 0 && (
              <Badge variant="primary" className="h-5 min-w-[20px] justify-center px-1.5 text-[0.65rem]">
                {pendingCount}
              </Badge>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Settings */}
      <div className="border-t border-sidebar-border px-3 py-3">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
            showSettings
              ? "text-foreground bg-secondary"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          <Settings className="size-3.5" />
          Config
        </button>
        {showSettings && (
          <div className="mt-2 animate-in slide-in-from-top-1 duration-150">
            <Input
              type="password"
              placeholder="API Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        )}
      </div>

      {/* Health */}
      <div className="border-t border-sidebar-border px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              healthStatus === "ok" && "bg-success shadow-[0_0_6px] shadow-success",
              healthStatus === "warn" && "bg-warning shadow-[0_0_6px] shadow-warning",
              healthStatus === "err" && "bg-destructive shadow-[0_0_6px] shadow-destructive",
              healthStatus === "unknown" && "bg-muted-foreground animate-pulse"
            )}
          />
          <span className="text-xs text-muted-foreground truncate">{healthLabel}</span>
        </div>
      </div>
    </aside>
  );
}
