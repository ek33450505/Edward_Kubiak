import { CAST_STATS, CAST_DESKTOP_STATS, CAST_ECOSYSTEM } from "./castStats.js";
import { ATLAS_STATS } from "./atlasStats.js";
import { TOOL_VERSIONS } from "./toolStats.js";

const now = {
  updated: "August 27, 2026",
  sections: [
    {
      title: "Building",
      items: [
        `Compute Atlas ${ATLAS_STATS.version} — an open, source-cited census of U.S. grid-scale compute: ${ATLAS_STATS.facilities.toLocaleString("en-US")} facilities across ${ATLAS_STATS.states} states, ${ATLAS_STATS.operationalGw} GW operational, ${ATLAS_STATS.underConstructionGw} GW under construction and ~${ATLAS_STATS.plannedGw} GW planned — data centers, crypto mining, and the dedicated power generation built to feed them. Interactive MapLibre map with water and geology overlays, community-opposition and named-stakeholder dimensions, open data + public JSON API, and an autonomous daily discovery pipeline that verifies its own sources before staging. Live at compute-atlas.com.`,
        `CAST ${CAST_STATS.version} "Make the Gates Tell the Truth" — ${CAST_STATS.agents}-agent Claude Code framework, ${CAST_ECOSYSTEM.tapsPlusUmbrella}, ${CAST_STATS.tests.toLocaleString("en-US")} tests across ${CAST_STATS.tables} record tables. v10 put every quality gate to one question — what does this check print when the thing it guards did *not* happen? — and rebuilt the ones whose answer was "exactly what success looks like". New tests are mutation-tested: reverted against the bug they guard and confirmed red first. The record still acts — search it with \`cast ask\`, sign it with \`cast ledger --verify\`, predict from it with \`cast predict\`. Public site live at castframework.dev.`,
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
