import { CAST_STATS, CAST_DESKTOP_STATS, CAST_ECOSYSTEM } from "./castStats.js";
import { ATLAS_STATS } from "./atlasStats.js";
import { TOOL_VERSIONS } from "./toolStats.js";

const now = {
  updated: "August 3, 2026",
  sections: [
    {
      title: "Building",
      items: [
        `Compute Atlas ${ATLAS_STATS.version} — an open, source-cited atlas of the U.S. data-center buildout: ${ATLAS_STATS.facilities} facilities across ${ATLAS_STATS.states} states, ${ATLAS_STATS.operationalGw} GW operational and ~${ATLAS_STATS.plannedGw} GW planned. Interactive MapLibre map, open data + public JSON API, and an autonomous daily discovery pipeline. Live at compute-atlas.com.`,
        `CAST ${CAST_STATS.version} "The Record That Acts" — ${CAST_STATS.agents}-agent Claude Code framework, ${CAST_ECOSYSTEM.tapsPlusUmbrella}, ${CAST_STATS.tests} tests. v9 makes the execution record act — search it with \`cast ask\`, sign it with \`cast ledger --verify\`, predict from it with \`cast predict\`. Public site live at castframework.dev.`,
        `Attest ${TOOL_VERSIONS.attest} — a deterministic, zero-LLM Claude Code hook that verifies a subagent's “DONE” against the real git diff and blocks proven false completions. Public on GitHub + Homebrew, CI green.`,
        `looptrip ${TOOL_VERSIONS.looptrip} — live on PyPI and Homebrew. Deterministic, framework-agnostic detection of multi-agent coordination pathologies: duplicate-work loops, ping-pong / livelock, deadlock, and non-termination — caught at iteration 2, not on the invoice. OSS library + OpenTelemetry SpanProcessor.`,
        "Beyond Attest and looptrip, prototyping a broader family of local-first, deterministic agent-reliability tools — gates that verify what agents actually do against ground truth, rather than trusting what they report.",
        "cast-doctor — a read-only health check that audits hook wiring, memory freshness, settings drift, and database integrity against any Claude Code install.",
        `cast-desktop — shipped ${CAST_DESKTOP_STATS.version}. Native Tauri 2 + React 19 app with ${CAST_DESKTOP_STATS.dashboardViews} dashboard views, real PTY terminal, Cmd+K palette, and multiple themes. Available via brew tap ek33450505/cast-desktop.`,
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
