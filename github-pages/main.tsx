import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "../app/page";
import { UxRefresh } from "../app/ux-refresh";
import { InteractivePracticeNav } from "../app/interactive-practice-nav";
import "../app/globals.css";
import "../app/ux-refresh.css";
import "../app/interactive-practice-nav.css";
import "../app/visual-refresh.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <UxRefresh />
    <InteractivePracticeNav />
  </StrictMode>,
);
