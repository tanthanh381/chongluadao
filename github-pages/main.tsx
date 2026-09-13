import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "../app/page";
import { UxRefresh } from "../app/ux-refresh";
import "../app/globals.css";
import "../app/ux-refresh.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <UxRefresh />
  </StrictMode>,
);
