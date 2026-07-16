import { Network, LayoutDashboard, BarChart3, Terminal, Database, ShoppingBag, DollarSign, ShieldCheck, Repeat, Crosshair, Map } from "lucide-react";
import { CAST_STATS, CAST_DESKTOP_STATS, CAST_ECOSYSTEM } from "./castStats.js";

/**
 * @typedef {Object} GitHubRepo
 * @property {string} owner - GitHub organization or user login
 * @property {string} repo  - Repository name
 */

/**
 * Represents a single project entry in the portfolio.
 *
 * @typedef {Object} Project
 * @property {string}   slug          - URL-safe unique identifier
 * @property {string}   title         - Display name
 * @property {string}   description   - Long-form project description
 * @property {string[]} tech          - Technology labels shown as badges
 * @property {React.ComponentType} icon - Lucide icon component for the card
 * @property {string}   color         - Tailwind color key (e.g. "violet", "teal")
 * @property {string}   category      - Top-level category ("personal" | "professional")
 * @property {string}   group         - Display group ("flagship" | "tools" | "ecosystem" | "professional")
 * @property {boolean}  [featured]        - Whether to surface in the featured section
 * @property {boolean}  [aiEngineering]   - Tagged as an AI engineering project
 * @property {boolean}  [castEcosystem]   - Part of the CAST open-source ecosystem
 * @property {string}   [github]          - URL to the GitHub repository
 * @property {GitHubRepo} [githubRepo]    - Structured owner/repo for the GitHub Stars API
 * @property {string[]} [stats]           - Short stat labels shown on the card
 * @property {{label: string, value: string}[]} [highlights] - Hairline stat strip (mono figure + tracked label); showcase-only
 * @property {{title: string, body: string}[]}  [sections]   - Long-form case-study plates (Fraunces title + body); showcase-only
 */

/** @type {Project[]} */
const projects = [
  // ── Flagship ──────────────────────────────────────────────────────────────
  {
    slug: "cast-claude-agent-team",
    title: "CAST — Claude Agent Team",
    description:
      `Local-first, open-source multi-agent framework embedded into Claude Code at the hook layer. ${CAST_STATS.agents} specialist agents and hook-driven dispatch — no routing tables, no cloud. The execution record is a local, tamper-evident, queryable substrate that acts: \`cast ask\` runs full-text search over every session; \`cast ledger --verify\` produces signed SHA-256 audit receipts; \`cast predict\` gives pre-flight cost and agent suggestions from telemetry; \`cast mcp\` exposes cast.db as a read-only MCP server. The full ecosystem ships as ${CAST_ECOSYSTEM.tapsPlusUmbrella}. Install only what you need. brew tap ek33450505/cast && brew install cast`,
    tech: ["Claude Code", "Bash", "Hook Architecture", "Node.js", "SQLite", "BATS"],
    icon: Network,
    color: "violet",
    category: "personal",
    group: "flagship",
    featured: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/claude-agent-team",
    githubRepo: { owner: "ek33450505", repo: "claude-agent-team" },
    castEcosystem: true,
    stats: [`${CAST_STATS.agents} Agents`, `${CAST_STATS.tests} Tests`, `${CAST_STATS.commands} Commands`, `${CAST_STATS.skills} Skills`, `${CAST_STATS.packages} Taps`, CAST_STATS.version],
  },

  {
    slug: "compute-atlas",
    title: "Compute Atlas",
    description:
      "An open, mapped census of the AI datacenter buildout across North America — 327 facilities in 48 states, each scored across power draw, water use, and community impact from primary sources. Ships as an interactive MapLibre map, a sortable data table, and per-facility dossiers, with the entire dataset published as open data anyone can download and cite. Built with Next.js 16 + React 19 + TypeScript; dual-licensed MIT (code) and CC BY 4.0 (data). Live at compute-atlas.com.",
    tech: ["Next.js 16", "React 19", "TypeScript", "MapLibre GL", "Tailwind", "Open Data"],
    icon: Map,
    color: "amber",
    category: "personal",
    group: "flagship",
    featured: true,
    github: "https://github.com/ek33450505/compute-atlas",
    githubRepo: { owner: "ek33450505", repo: "compute-atlas" },
    link: "https://www.compute-atlas.com",
    stats: ["327 Facilities", "48 States", "8.2 GW Operational", "Open Dataset", "MIT + CC BY 4.0"],
    highlights: [
      { label: "Facilities mapped", value: "327" },
      { label: "States covered", value: "48" },
      { label: "Operational capacity", value: "8.2 GW" },
      { label: "Planned pipeline", value: "142 GW" },
      { label: "Confidence tiers", value: "3" },
      { label: "Per-record sources", value: "≥1" },
    ],
    sections: [
      { title: "The problem",
        body: "The AI datacenter buildout is one of the largest infrastructure expansions in a generation, yet the data describing it is scattered across county permit filings, utility interconnection queues, water-authority applications, and tax-abatement agreements — opaque, non-standardized, and rarely connected to a map. Compute Atlas is an open, source-cited survey that pulls those primary records into one place: 327 facilities across 48 states, 8.2 GW operational today and roughly 142 GW more in the planned pipeline." },
      { title: "Source-cited provenance",
        body: "Every record cites at least one primary source — permit filings, interconnection-queue entries, subsidy disclosures, water applications, or reporting — and carries an explicit confidence level: Confirmed, Reported, or Rumored. An 'honest-zero' convention runs throughout: where a figure isn't known, the atlas records 'unknown' rather than guessing, so an empty field is a statement, not a gap." },
      { title: "The interactive product",
        body: "The survey ships three coordinated views over the same dataset: a MapLibre GL map of every sited facility, a sortable data table for scanning power draw and status across the fleet, and per-facility dossiers with capacity, energy and water profile, operator, and the full source trail behind each claim. Built on Next.js 16 + React 19 + TypeScript." },
      { title: "Open data + dual licensing",
        body: "The entire dataset is public and citable, served through a JSON API so anyone can build on it. Code is open-source under MIT; the compiled dataset is offered under CC BY 4.0. The goal is a reference layer for the compute buildout that others can verify, correct, and extend." },
    ],
  },

  // ── AI & Claude Code Tools ────────────────────────────────────────────────
  {
    slug: "looptrip",
    title: "looptrip",
    description:
      'A deterministic, framework-agnostic, zero-LLM detector of multi-agent coordination pathologies — duplicate-work loops, ping-pong / livelock, deadlock, and non-termination — that trips at iteration 2, not on the invoice. An observer, never a gate: it reads data you already have (OpenTelemetry GenAI handoff spans or a CAST cast.db), and the same event stream always yields the same verdict. On two real recorded runaway sessions it reproduces $792.96 of prevented duplicate-work spend in one command. Live on PyPI. pip install looptrip · brew tap ek33450505/looptrip && brew install looptrip',
    tech: ["Python", "OpenTelemetry", "Claude Code", "SQLite", "Detection"],
    icon: Repeat,
    color: "rose",
    category: "personal",
    group: "tools",
    featured: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/looptrip",
    githubRepo: { owner: "ek33450505", repo: "looptrip" },
    stats: ["Zero-LLM", "OTel SpanProcessor", "$792.96 Proof", "Plugin + Homebrew", "v0.1.2"],
  },
  {
    slug: "misfire",
    title: "misfire",
    description:
      'Linters tell you your rules are messy; misfire tells you which rules your agents actually ignore — and converts only those into hooks, keeping safety rules as prose. A deterministic, local-first, zero-LLM CLI that reads your CLAUDE.md / .claude/rules and your own run history, ranks prose-rule violations from real transcripts, and scaffolds a reviewable hook for the machine-checkable subset. An observer and recommender — never auto-deletes a rule, never auto-applies a change, never writes settings.json. Stdlib-only, no database required. pip install misfire · brew tap ek33450505/misfire && brew install misfire',
    tech: ["Python", "Claude Code", "Hook Architecture", "CLI", "BATS"],
    icon: Crosshair,
    color: "sky",
    category: "personal",
    group: "tools",
    featured: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/misfire",
    githubRepo: { owner: "ek33450505", repo: "misfire" },
    stats: ["Zero-LLM", "430+ Tests", "Evidence-Ranked", "Plugin + Homebrew", "v0.2.0"],
  },
  {
    slug: "attest",
    title: "Attest",
    description:
      'A local, deterministic, zero-LLM Claude Code hook that verifies a subagent\'s "Status: DONE" / "## Handoff" claim against the real git working-tree delta — and, opt-in, blocks a DONE whose claimed files never actually landed on disk. It adds no tokens, cannot hallucinate its own verdict, and fails open on every doubt. Validated end-to-end against real Claude Code v2.1.170 with committed payload fixtures; 325 tests, CI green. brew tap ek33450505/attest && brew install attest',
    tech: ["Python", "Claude Code", "Hook Architecture", "Git", "BATS", "GitHub Actions"],
    icon: ShieldCheck,
    color: "emerald",
    category: "personal",
    group: "tools",
    featured: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/attest",
    githubRepo: { owner: "ek33450505", repo: "attest" },
    stats: ["Zero-LLM", "325 Tests", "Plugin + Homebrew", "v0.3.0"],
  },
  {
    slug: "claude-code-dashboard",
    title: "Claude Code Dashboard",
    description:
      "Observability layer for CAST — a React 19 + TypeScript UI with a real-time SSE activity feed, session cost tracking, per-agent scorecards, evals and agent-reliability views, Cmd+K global search, and a privacy audit showing your cloud vs. local API ratio. Reads ~/.claude directly — no accounts, no telemetry. Gracefully degrades when CAST is not installed. v2.5.0",
    tech: ["React 19", "TypeScript", "Vite", "Express", "SSE", "Recharts", "better-sqlite3"],
    icon: LayoutDashboard,
    color: "teal",
    category: "personal",
    group: "tools",
    aiEngineering: true,
    castEcosystem: true,
    github: "https://github.com/ek33450505/claude-code-dashboard",
    githubRepo: { owner: "ek33450505", repo: "claude-code-dashboard" },
    stats: ["8 Pages", "SSE Live Feed", "No Telemetry", "v2.5.0"],
  },
  {
    slug: "cast-desktop",
    title: "Cast Desktop",
    description:
      `The desktop app for CAST — every signal your agents emit, all in one place. A Tauri 2 + React 19 native app with embedded Express 5 + SQLite backend. Real PTY-backed terminal (xterm.js + Rust Forge), ${CAST_DESKTOP_STATS.dashboardViews} dashboard views, Cmd+K command palette, search-in-terminal, font-size hotkeys, multi-tab terminal with folder-picker cwd, and 6 themes. Local-first — reads directly from ~/.claude/cast.db.`,
    tech: ["Tauri 2", "React 19", "TypeScript", "Rust", "Express 5", "SQLite", "xterm.js"],
    icon: Terminal,
    color: "accent",
    category: "personal",
    group: "tools",
    aiEngineering: true,
    castEcosystem: true,
    github: "https://github.com/ek33450505/cast-desktop",
    githubRepo: { owner: "ek33450505", repo: "cast-desktop" },
    stats: [`${CAST_DESKTOP_STATS.dashboardViews} Dashboard Views`, "Native PTY Terminal", CAST_DESKTOP_STATS.version],
  },

  // ── CAST Ecosystem ────────────────────────────────────────────────────────
  {
    slug: "cast-mcp",
    title: "cast-mcp",
    description:
      "Read-only MCP server over the Claude Code execution record (cast.db) — dispatch decisions, incidents, cost, sessions, and full-text search exposed as 5 MCP tools and 5 resources. stdlib-only, strictly read-only, no arbitrary SQL. Works with or without the full CAST framework. brew tap ek33450505/cast-mcp && brew install cast-mcp",
    tech: ["Python", "MCP", "SQLite", "Claude Code"],
    icon: Database,
    color: "sky",
    category: "personal",
    group: "ecosystem",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-mcp",
    githubRepo: { owner: "ek33450505", repo: "cast-mcp" },
    stats: ["Open Source", "5 MCP Tools", "Read-Only", "Homebrew Install"],
  },
  {
    slug: "cast-ledger",
    title: "cast-ledger",
    description:
      "Signed, hash-chained, tamper-evident session receipts for Claude Code — renders a SHA-256-stamped audit receipt from cast.db, verifies it with --verify, and optionally chains provenance across sessions. Strictly read-only, stdlib-only, local-only. brew tap ek33450505/cast-ledger && brew install cast-ledger",
    tech: ["Python", "SQLite", "SHA-256", "Claude Code"],
    icon: ShieldCheck,
    color: "emerald",
    category: "personal",
    group: "ecosystem",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-ledger",
    githubRepo: { owner: "ek33450505", repo: "cast-ledger" },
    stats: ["Open Source", "Signed Receipts", "Tamper-Evident", "Homebrew Install"],
  },
  {
    slug: "cast-predict",
    title: "cast-predict",
    description:
      "Telemetry-driven dispatch prediction for Claude Code — reads cast.db to predict a task's likely cost, suggest agents ranked by past performance, and surface related incidents before you run it. Strictly read-only, stdlib-only. brew tap ek33450505/cast-predict && brew install cast-predict",
    tech: ["Python", "SQLite", "Telemetry", "Claude Code"],
    icon: BarChart3,
    color: "violet",
    category: "personal",
    group: "ecosystem",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-predict",
    githubRepo: { owner: "ek33450505", repo: "cast-predict" },
    stats: ["Open Source", "Cost Prediction", "Agent Suggestions", "Homebrew Install"],
  },
  {
    slug: "cast-time",
    title: "cast-time",
    description:
      "A single-purpose Claude Code SessionStart hook that solves a fundamental LLM limitation: Claude has no clock. Injects local time, timezone, and a semantic time-of-day bucket (morning/afternoon/evening/night) at session start — no rules, no slash commands, just context. brew tap ek33450505/cast-time && brew install cast-time",
    tech: ["Bash", "Shell", "Hook Architecture", "Claude Code"],
    icon: Terminal,
    color: "sky",
    category: "personal",
    group: "ecosystem",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-time",
    githubRepo: { owner: "ek33450505", repo: "cast-time" },
    stats: ["Open Source", "SessionStart Hook", "Homebrew Install"],
  },
  {
    slug: "cast-doctor",
    title: "cast-doctor",
    description:
      "A standalone, read-only health check for any Claude Code install — validates hook wiring, MCP config, agent frontmatter, cast.db core schema, and stale memories without modifying anything. 11 checks; works with or without the full CAST framework. brew tap ek33450505/cast-doctor && brew install cast-doctor",
    tech: ["Bash", "Shell", "SQLite", "Claude Code"],
    icon: BarChart3,
    color: "teal",
    category: "personal",
    group: "ecosystem",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-doctor",
    githubRepo: { owner: "ek33450505", repo: "cast-doctor" },
    stats: ["Open Source", "Read-Only", "11 Checks", "Homebrew Install"],
  },
  {
    slug: "cast-memory",
    title: "cast-memory",
    description:
      "Persistent, searchable memory for Claude Code agents — FTS5 full-text search, weighted relevance scoring, temporal validity, optional Ollama semantic embeddings, and weekly consolidation over cast.db. brew tap ek33450505/cast-memory && brew install cast-memory",
    tech: ["Python", "SQLite", "FTS5", "MCP", "Ollama"],
    icon: Database,
    color: "emerald",
    category: "personal",
    group: "ecosystem",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-memory",
    githubRepo: { owner: "ek33450505", repo: "cast-memory" },
    stats: ["Open Source", "FTS5 Search", "Ollama Embeddings", "Homebrew Install"],
  },
  {
    slug: "claudes-journal",
    title: "Claude's Journal",
    description:
      "Three-hook journaling for Claude Code (Stop / SessionStart / UserPromptSubmit) — maintains Claude's perspective and working memory across sessions as Obsidian-compatible markdown in ~/Documents/Claude/. brew tap ek33450505/claudes-journal && brew install claudes-journal",
    tech: ["Bash", "Shell", "Markdown"],
    icon: Terminal,
    color: "violet",
    category: "personal",
    group: "ecosystem",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-claudes_journal",
    githubRepo: { owner: "ek33450505", repo: "cast-claudes_journal" },
    stats: ["Open Source", "3 Hooks", "Obsidian-Compatible", "Homebrew Install"],
  },

  // ── Professional ──────────────────────────────────────────────────────────
  {
    slug: "crosscheck",
    title: "CrossCheck",
    description:
      "Mission-critical EMIS data validation platform serving 4,200+ users across 900+ Ohio school districts. Spearheaded the complete migration from AngularJS to React, modernizing the entire frontend architecture.",
    tech: ["React", "Node.js", "Python API"],
    icon: BarChart3,
    color: "emerald",
    category: "professional",
    group: "professional",
    stats: ["4,200+ Users", "900+ Districts"],
  },
  {
    slug: "ses-wiki",
    title: "SES-Wiki",
    description:
      "EMIS scenario reference tool I built from the ground up — React 19 + Express 5 with JSON data persistence, automated backups, and full test coverage via Vitest. The go-to resource for Ohio education data teams.",
    tech: ["React 19", "Vite", "Express 5", "Vitest"],
    icon: Database,
    color: "rose",
    category: "professional",
    group: "professional",
    stats: ["React 19", "Express 5", "Full Test Coverage"],
  },
  {
    slug: "cws",
    title: "CWS",
    description:
      "Internal catalog platform enabling school districts to browse, request, and manage PowerSchool customizations. Streamlined a process that previously required manual email coordination.",
    tech: ["React 19", "Vite"],
    icon: ShoppingBag,
    color: "accent",
    category: "professional",
    group: "professional",
    stats: ["React 19", "Vite"],
  },
  {
    slug: "e-rate-dashboard",
    title: "E-Rate Dashboard",
    description:
      "Full-stack platform for managing federal E-Rate telecom discount program data — helping districts capture funding they're entitled to. Architected as a Docker Compose monorepo with dual React frontends, a Flask API layer, and PostgreSQL.",
    tech: ["React", "Flask", "PostgreSQL", "Docker", "TypeScript", "MUI"],
    icon: DollarSign,
    color: "sky",
    category: "professional",
    group: "professional",
    stats: ["Docker Compose", "Dual Frontend", "Flask + PostgreSQL"],
  },
];

export default projects;
