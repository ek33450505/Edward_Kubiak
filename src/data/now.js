import { CAST_STATS, CAST_DESKTOP_STATS, CAST_ECOSYSTEM } from "./castStats.js";

const now = {
  updated: "June 21, 2026",
  sections: [
    {
      title: "Building",
      items: [
        `CAST ${CAST_STATS.version} — ${CAST_STATS.agents}-agent Claude Code framework, ${CAST_ECOSYSTEM.tapsPlusUmbrella}, ${CAST_STATS.tests} tests. Public site live at castframework.dev.`,
        "Attest v0.1.0 — just shipped a deterministic, zero-LLM Claude Code hook that verifies a subagent's “DONE” against the real git diff and blocks proven false completions. Public on GitHub + Homebrew, 290 tests, CI green.",
        "looptrip — in progress (private). Deterministic, framework-agnostic detection of multi-agent coordination pathologies: duplicate-work loops, ping-pong / livelock, deadlock, and non-termination — caught at iteration 2, not on the invoice. Ships as an OSS library + OpenTelemetry SpanProcessor.",
        "Beyond Attest and looptrip, prototyping a broader family of local-first, deterministic agent-reliability tools — gates that verify what agents actually do against ground truth, rather than trusting what they report.",
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
        "Rim to River 100 — October 24, 2026. Next race on the calendar.",
        "Current focus: back-to-back long runs, trail-specific vertical gain through Ohio singletrack.",
      ],
    },
  ],
};

export default now;
