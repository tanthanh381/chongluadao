import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "../app/page";
import { UxRefresh } from "../app/ux-refresh";
import { InteractivePracticeNav } from "../app/interactive-practice-nav";
import { PrivilegedMfaGate } from "../app/security-hardening";
import "../app/globals.css";
import "../app/ux-refresh.css";
import "../app/interactive-practice-nav.css";
import "../app/visual-refresh.css";
import "../app/security-hardening.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <UxRefresh />
    <InteractivePracticeNav />
    <PrivilegedMfaGate />
  </StrictMode>,
);
