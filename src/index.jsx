import React from "react";
import ReactDOM from "react-dom/client";
// Display: Fraunces (variable — opsz/SOFT/WONK axes via `full`). Self-hosted to
// satisfy the strict `font-src 'self'` CSP.
import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/fraunces/full-italic.css";
// Survey mono: labels, coordinates, tabular figures.
import "@fontsource-variable/jetbrains-mono/wght.css";
// Body grotesque.
import "@fontsource/dm-sans/300.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/400-italic.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/700.css";
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
