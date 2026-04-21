import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "./store.js";
import { Sidebar } from "./components/layout/Sidebar.js";
import { Toast } from "./components/shared/Toast.js";
import { CockpitPage } from "./pages/CockpitPage.js";
import { StudioPage } from "./pages/StudioPage.js";
import { BrainPage } from "./pages/BrainPage.js";

export function App() {
  const loadAll = useAppStore((s) => s.loadAll);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  return (
    <div className="shell">
      <Sidebar />
      <main className="shell-main">
        <Routes>
          <Route path="/cockpit" element={<CockpitPage />} />
          <Route path="/studio" element={<StudioPage />} />
          <Route path="/brain" element={<BrainPage />} />
          <Route path="*" element={<Navigate to="/cockpit" replace />} />
        </Routes>
      </main>
      <Toast />
    </div>
  );
}
