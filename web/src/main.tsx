import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { App } from "./App";
import "./styles/variables.css";
import "./styles/global.css";
import "./styles/components.css";
import "./styles/sidebar.css";
import "./styles/cockpit.css";
import "./styles/studio.css";
import "./styles/brain.css";
import "./styles/toast.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
