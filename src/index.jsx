import React from "react";
import ReactDOM from "react-dom/client";
// Geist (UI/body/display) + Geist Mono (labels, figures). Self-hosted to satisfy
// the strict `font-src 'self'` CSP.
import "@fontsource-variable/geist/index.css";
import "@fontsource-variable/geist-mono/index.css";
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
