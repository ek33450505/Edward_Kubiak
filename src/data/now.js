import { CAST_STATS, CAST_DESKTOP_STATS, CAST_ECOSYSTEM } from "./castStats.js";

const now = {
  updated: "June 5, 2026",
  sections: [
    {
      title: "Building",
      items: [
        `CAST ${CAST_STATS.version} — ${CAST_STATS.agents}-agent Claude Code framework, ${CAST_ECOSYSTEM.tapsPlusUmbrella}, ${CAST_STATS.tests} tests. Public site live at castframework.dev.`,
        "cast-routines + cast-doctor — schedules autonomous Claude Code workflows via YAML + cron; doctor is a read-only health check that works against any Claude Code install.",
        `cast-desktop — shipped ${CAST_DESKTOP_STATS.version}. Native Tauri 2 + React 19 app with ${CAST_DESKTOP_STATS.dashboardViews} dashboard views, real PTY terminal, Cmd+K palette, and 6 themes. Available via brew tap ek33450505/cast-desktop.`,
        "Actively networking and exploring new opportunities.",
      ],
    },
    {
      title: "Learning",
      items: [
        "Managed Agents API (Anthropic beta) — hosted agent execution on Anthropic infrastructure, eliminating local filesystem contention for parallel work",
        "Hook-driven agent dispatch at scale — Claude Code hooks wired for quality gates, observability, safety policy, and dispatch",
        "AI systems observability — cast.db, real-time SSE feeds, and per-agent scorecards at the session level",
      ],
    },
    {
      title: "Running",
      items: [
        "Mohican 100 — May 23-24 2026. Race day just behind me.",
        "Looking for my next fall 100-miler after Rim to River 2024 (planning a return in October 2026).",
        "Current focus: back-to-back long runs, trail-specific vertical gain through Ohio singletrack.",
      ],
    },
  ],
};

export default now;
