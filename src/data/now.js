import { CAST_STATS, CAST_DESKTOP_STATS, CAST_ECOSYSTEM } from "./castStats.js";
import { ATLAS_STATS } from "./atlasStats.js";
import { TOOL_VERSIONS } from "./toolStats.js";

const now = {
  updated: "October 20, 2026",
  sections: [
    {
      title: "Building",
      items: [
        `Compute Atlas ${ATLAS_STATS.version} — a full-stack data product I designed and shipped solo, and now cited by Erin Brockovich's data center reporting map and by Power To The People. An open, source-cited census of U.S. grid-scale compute: ${ATLAS_STATS.facilities.toLocaleString("en-US")} facilities across ${ATLAS_STATS.coverage}, ${ATLAS_STATS.operationalGw} GW operational, ${ATLAS_STATS.underConstructionGw} GW under construction and ~${ATLAS_STATS.plannedGw} GW planned. Next.js and MapLibre front end, Postgres-backed open JSON API, email subscriptions and a rate-limited intake form, CI, and an autonomous daily discovery pipeline that verifies its own sources before staging. Live at compute-atlas.com.`,
        `CAST ${CAST_STATS.version} — the development architecture behind my work, Compute Atlas included: a ${CAST_STATS.agents}-agent Claude Code framework with hook-driven dispatch and review gates, ${CAST_ECOSYSTEM.tapsPlusUmbrella}, ${CAST_STATS.tests.toLocaleString("en-US")} tests across ${CAST_STATS.tables} record tables. New tests are mutation-tested: reverted against the bug they guard and confirmed red first. The record still acts — search it with \`cast ask\`, sign it with \`cast ledger --verify\`, predict from it with \`cast predict\`. Public site live at castframework.dev.`,
        `Attest ${TOOL_VERSIONS.attest} — a deterministic, zero-LLM Claude Code hook that verifies a subagent's “DONE” against the real git diff and blocks proven false completions. Public on GitHub + Homebrew, CI green.`,
        `looptrip ${TOOL_VERSIONS.looptrip} — live on PyPI and Homebrew. Deterministic, framework-agnostic detection of multi-agent coordination pathologies: duplicate-work loops, ping-pong / livelock, deadlock, and non-termination — caught at iteration 2, not on the invoice. OSS library + OpenTelemetry SpanProcessor.`,
        `tin-can ${TOOL_VERSIONS["tin-can"]} — hands an AI coding session off to a fresh terminal tab: the agent writes a handoff file, and one command starts the next session pointed at it. A small bash script plus an optional Claude Code plugin; CI runs ShellCheck and BATS on Ubuntu and macOS.`,
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
  ],
};

export default now;
