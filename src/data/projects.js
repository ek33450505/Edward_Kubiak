import { Network, LayoutDashboard, BarChart3, Terminal, Database, ShoppingBag, DollarSign, ShieldCheck, Repeat, Crosshair, Map, Globe } from "lucide-react";
import { CAST_STATS, CAST_DESKTOP_STATS, CAST_ECOSYSTEM } from "./castStats.js";
import { ATLAS_STATS } from "./atlasStats.js";
import { TOOL_VERSIONS } from "./toolStats.js";

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
 * @property {string}   [summary]     - Short (≤160 char) meta-description summary for SEO
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
 * @property {string}   [dateAdded]       - ISO date the project was first added; feeds RSS pubDate + sitemap lastmod
 * @property {{label: string, value: string}[]} [highlights] - Hairline stat strip (mono figure + tracked label); showcase-only
 * @property {{title: string, body: string}[]}  [sections]   - Long-form case-study plates (Fraunces title + body); showcase-only
 */

/** @type {Project[]} */
const projects = [
  // ── Flagship ──────────────────────────────────────────────────────────────
  {
    slug: "compute-atlas",
    dateAdded: "2026-07-08",
    title: "Compute Atlas",
    description:
      `An open, source-cited census of U.S. grid-scale compute — ${ATLAS_STATS.facilities.toLocaleString("en-US")} facilities across ${ATLAS_STATS.states} states, spanning hyperscale and AI campuses, crypto-mining sites, and the dedicated power generation contracted to feed them, from proposed and permitted through under-construction and operational. Every record cites a public source and carries an explicit confidence level. It ships as an interactive MapLibre GL map, sortable tables, and per-facility dossiers, alongside reference hubs for power, water, operators, metros, community opposition, and named stakeholders — with the whole dataset published as open data behind a JSON API. A scheduled autonomous discovery pipeline expands coverage daily, and nothing goes live without human approval. Built on ${ATLAS_STATS.stack}; dual-licensed ${ATLAS_STATS.license}. Live at compute-atlas.com.`,
    summary: "An open, source-cited census of U.S. grid-scale compute — data centers, crypto mining, and dedicated power — mapped, tabulated, and published as open data.",
    tech: ["Next.js 16", "React 19", "TypeScript", "MapLibre GL", "Neon Postgres", "Drizzle", "Vercel", "Open Data"],
    icon: Map,
    color: "amber",
    category: "personal",
    group: "flagship",
    featured: true,
    github: "https://github.com/ek33450505/compute-atlas",
    githubRepo: { owner: "ek33450505", repo: "compute-atlas" },
    link: "https://www.compute-atlas.com",
    heroImage: "/media/compute-atlas.png",
    stats: [
      ATLAS_STATS.version,
      `${ATLAS_STATS.facilities.toLocaleString("en-US")} Facilities`,
      `${ATLAS_STATS.operationalGw} GW Operational`,
      `${ATLAS_STATS.states} States`,
      `${ATLAS_STATS.plannedGw} GW Planned`,
      "MIT + CC BY 4.0",
    ],
    highlights: [
      { label: "Facilities mapped", value: `${ATLAS_STATS.facilities.toLocaleString("en-US")}` },
      { label: "States covered", value: `${ATLAS_STATS.states}` },
      { label: "Operational capacity", value: `${ATLAS_STATS.operationalGw} GW` },
      { label: "Under construction", value: `${ATLAS_STATS.underConstructionGw} GW` },
      { label: "Planned pipeline", value: `${ATLAS_STATS.plannedGw} GW` },
      { label: "Per-record sources", value: "≥1" },
    ],
    sections: [
      { title: "The problem",
        body: `There is no national registry of grid-scale compute. The buildout is one of the largest infrastructure expansions in a generation, yet the records describing it sit scattered across county permit portals, utility interconnection queues, SEC filings, water-authority applications, and tax-abatement agreements — opaque, non-standardized, and almost never connected to a map. Compute Atlas pulls those primary records into one source-cited survey: ${ATLAS_STATS.facilities.toLocaleString("en-US")} facilities across ${ATLAS_STATS.states} states, ${ATLAS_STATS.operationalGw} GW operational today, ${ATLAS_STATS.underConstructionGw} GW under construction, and roughly ${ATLAS_STATS.plannedGw} GW more in the planned pipeline.` },
      { title: "Three facility types, one dataset",
        body: "The atlas deliberately refuses the narrow definition. It tracks traditional and hyperscale data centers, AI/ML-specific campuses, crypto-mining operations, and — increasingly the decisive constraint — the dedicated power generation built or contracted to supply them, including gas, nuclear, small modular reactors, solar, wind, and fusion. Classifying a crypto site as a crypto site rather than quietly folding it into an 'AI' total is part of the honesty of the record." },
      { title: "Source-cited provenance",
        body: "Every record cites at least one public source with a URL, a label, a source kind, and a retrieval date, and carries an explicit confidence level: confirmed, reported, or rumored. Data centers with a discernible AI angle are separately classified confirmed, likely, or mixed-use. Ranges, ceilings, and modeled projections go in a record's notes and never into a numeric field. An 'honest-zero' convention runs throughout: where a figure isn't known the atlas records 'unknown' rather than guessing, so an empty field is a statement, not a gap." },
      { title: "The civic footprint",
        body: "Beyond capacity, the survey tracks what these facilities mean for the places that host them. A community-opposition dimension records documented friction — litigation, moratoria, referendums, and the projects local opposition actually defeated — each with a public source. A stakeholder dimension names people with a documented stake in a specific site: founders, controlling owners, investors, executives, board members, landowners, and public officials, with the governmental role marked explicitly as a role and not a financial interest. That dimension holds a stricter evidentiary bar than any other — a citation and an as-of date are mandatory, and a source must tie the person to that site, never merely to its operator." },
      { title: "The interactive product",
        body: `The survey ships coordinated views over one dataset — a MapLibre GL map of every sited facility with water and geology overlays and siting-context datums, sortable tables for scanning power draw and status across the fleet, and per-facility dossiers carrying capacity, energy and water profile, operator, and the full source trail behind each claim. Reference hubs cover rankings, power, operators, metros, states, opposition, stakeholders, and AI-vs-crypto classification, and a /learn tier answers the underlying questions in cited prose rather than statistics alone. Built on ${ATLAS_STATS.stack}.` },
      { title: "Autonomous discovery pipeline",
        body: "Coverage grows through a scheduled daily research run: a bounded `claude -p` invocation that discovers candidate facilities, folds in light enrichment, and stages them for review. Candidate source URLs are mechanically verified before staging, and a source-verification census runs over the live dataset so provenance decays are caught rather than assumed away. The pipeline is hardened with a fail-closed kill switch, a heartbeat, extraction guards, cap enforcement, and a self-reverting cap so a bad run reverts itself. The core invariant holds regardless: nothing becomes a live facility without human approval." },
      { title: "Open data + dual licensing",
        body: "The entire dataset is public and citable, served through a JSON API so anyone can build on it, with a lead-first contribution path for anyone who can point at a source. Code is open-source under MIT; the compiled dataset is offered under CC BY 4.0. The goal is a reference layer for the compute buildout that journalists, researchers, local officials, and residents can verify, correct, and extend." },
    ],
  },

  {
    slug: "cast-claude-agent-team",
    dateAdded: "2026-04-17",
    title: "CAST — Claude Agent Team",
    description:
      `Local-first, open-source multi-agent framework embedded into Claude Code at the hook layer. ${CAST_STATS.agents} specialist agents and hook-driven dispatch — no routing tables, no cloud. The execution record is a local, tamper-evident, queryable substrate that acts: \`cast ask\` runs full-text search over every session; \`cast ledger --verify\` produces signed SHA-256 audit receipts; \`cast predict\` gives pre-flight cost and agent suggestions from telemetry; \`cast mcp\` exposes cast.db as a read-only MCP server. The full ecosystem ships as ${CAST_ECOSYSTEM.tapsPlusUmbrella}. Install only what you need. brew tap ek33450505/cast && brew install cast`,
    summary: "Open-source, local-first multi-agent framework embedded in Claude Code at the hook layer — specialist agents, hook-driven dispatch, a tamper-evident record.",
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
    stats: [`${CAST_STATS.agents} Agents`, `${CAST_STATS.tests.toLocaleString("en-US")} Tests`, `${CAST_STATS.commands} Commands`, `${CAST_STATS.skills} Skills`, `${CAST_STATS.packages} Taps`, CAST_STATS.version],
  },

  // ── AI & Claude Code Tools ────────────────────────────────────────────────
  {
    slug: "looptrip",
    dateAdded: "2026-06-22",
    title: "looptrip",
    description:
      'A deterministic, framework-agnostic, zero-LLM detector of multi-agent coordination pathologies — duplicate-work loops, ping-pong / livelock, deadlock, and non-termination — that trips at iteration 2, not on the invoice. An observer, never a gate: it reads data you already have (OpenTelemetry GenAI handoff spans or a CAST cast.db), and the same event stream always yields the same verdict. On two real recorded runaway sessions it reproduces prevented duplicate-work spend from a committed fixture in one command. Live on PyPI. pip install looptrip · brew tap ek33450505/looptrip && brew install looptrip',
    summary: "Deterministic, zero-LLM detector of multi-agent coordination failures — loops, ping-pong, deadlock, non-termination — trips at iteration 2, not the invoice.",
    tech: ["Python", "OpenTelemetry", "Claude Code", "SQLite", "Detection"],
    icon: Repeat,
    color: "rose",
    category: "personal",
    group: "tools",
    featured: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/looptrip",
    githubRepo: { owner: "ek33450505", repo: "looptrip" },
    stats: ["Zero-LLM", "OTel SpanProcessor", "Plugin + Homebrew", TOOL_VERSIONS.looptrip],
  },
  {
    slug: "misfire",
    dateAdded: "2026-06-24",
    title: "misfire",
    description:
      'Linters tell you your rules are messy; misfire tells you which rules your agents actually ignore — and converts only those into hooks, keeping safety rules as prose. A deterministic, local-first, zero-LLM CLI that reads your CLAUDE.md / .claude/rules and your own run history, ranks prose-rule violations from real transcripts, and scaffolds a reviewable hook for the machine-checkable subset. An observer and recommender — never auto-deletes a rule, never auto-applies a change, never writes settings.json. Stdlib-only, no database required. pip install misfire · brew tap ek33450505/misfire && brew install misfire',
    summary: "Zero-LLM CLI that reads your CLAUDE.md rules and run history, ranks which prose rules agents actually ignore, and scaffolds hooks for the checkable subset.",
    tech: ["Python", "Claude Code", "Hook Architecture", "CLI", "BATS"],
    icon: Crosshair,
    color: "sky",
    category: "personal",
    group: "tools",
    featured: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/misfire",
    githubRepo: { owner: "ek33450505", repo: "misfire" },
    stats: ["Zero-LLM", "Evidence-Ranked", "Plugin + Homebrew", TOOL_VERSIONS.misfire],
  },
  {
    slug: "attest",
    dateAdded: "2026-06-21",
    title: "Attest",
    description:
      'A local, deterministic, zero-LLM Claude Code hook that verifies a subagent\'s "Status: DONE" / "## Handoff" claim against the real git working-tree delta — and, opt-in, blocks a DONE whose claimed files never actually landed on disk. It adds no tokens, cannot hallucinate its own verdict, and fails open on every doubt. Validated end-to-end against real Claude Code with committed payload fixtures; CI green. brew tap ek33450505/attest && brew install attest',
    summary: "Local, zero-LLM Claude Code hook that verifies a subagent's DONE claim against the real git working-tree delta — and can block a DONE whose files never landed.",
    tech: ["Python", "Claude Code", "Hook Architecture", "Git", "BATS", "GitHub Actions"],
    icon: ShieldCheck,
    color: "emerald",
    category: "personal",
    group: "tools",
    featured: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/attest",
    githubRepo: { owner: "ek33450505", repo: "attest" },
    stats: ["Zero-LLM", "Plugin + Homebrew", TOOL_VERSIONS.attest],
  },
  {
    slug: "claude-code-dashboard",
    dateAdded: "2026-04-17",
    title: "Claude Code Dashboard",
    description:
      "Observability layer for CAST — a React 19 + TypeScript UI with a real-time SSE activity feed, session cost tracking, per-agent scorecards, evals and agent-reliability views, Cmd+K global search, and a privacy audit showing your cloud vs. local API ratio. Reads ~/.claude directly — no accounts, no telemetry. Gracefully degrades when CAST is not installed.",
    summary: "Observability UI for CAST — real-time SSE activity feed, cost tracking, per-agent scorecards, evals, and Cmd+K search. Reads ~/.claude directly, no telemetry.",
    tech: ["React 19", "TypeScript", "Vite", "Express", "SSE", "Recharts", "better-sqlite3"],
    icon: LayoutDashboard,
    color: "teal",
    category: "personal",
    group: "tools",
    aiEngineering: true,
    castEcosystem: true,
    github: "https://github.com/ek33450505/claude-code-dashboard",
    githubRepo: { owner: "ek33450505", repo: "claude-code-dashboard" },
    stats: ["SSE Live Feed", "No Telemetry", TOOL_VERSIONS["claude-code-dashboard"]],
  },
  {
    slug: "cast-desktop",
    dateAdded: "2026-05-14",
    title: "Cast Desktop",
    description:
      `The desktop app for CAST — every signal your agents emit, all in one place. A Tauri 2 + React 19 native app with embedded Express 5 + SQLite backend. Real PTY-backed terminal (xterm.js + Rust Forge), ${CAST_DESKTOP_STATS.dashboardViews} dashboard views, Cmd+K command palette, search-in-terminal, font-size hotkeys, multi-tab terminal with folder-picker cwd, and multiple themes. Local-first — reads directly from ~/.claude/cast.db.`,
    summary: "Desktop app for CAST — a Tauri 2 + React 19 native app with an embedded Express/SQLite backend, a real PTY-backed terminal, and dashboard views. Local-first.",
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
    dateAdded: "2026-07-02",
    title: "cast-mcp",
    description:
      "Read-only MCP server over the Claude Code execution record (cast.db) — dispatch decisions, incidents, cost, sessions, and full-text search exposed through MCP tools and resources. stdlib-only, strictly read-only, no arbitrary SQL. Works with or without the full CAST framework. brew tap ek33450505/cast-mcp && brew install cast-mcp",
    summary: "Read-only MCP server over the Claude Code execution record — dispatch decisions, incidents, cost, sessions, and full-text search as MCP tools. Stdlib-only.",
    tech: ["Python", "MCP", "SQLite", "Claude Code"],
    icon: Database,
    color: "sky",
    category: "personal",
    group: "ecosystem",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-mcp",
    githubRepo: { owner: "ek33450505", repo: "cast-mcp" },
    stats: ["Open Source", "Read-Only", "Homebrew Install"],
  },
  {
    slug: "cast-ledger",
    dateAdded: "2026-07-02",
    title: "cast-ledger",
    description:
      "Signed, hash-chained, tamper-evident session receipts for Claude Code — renders a SHA-256-stamped audit receipt from cast.db, verifies it with --verify, and optionally chains provenance across sessions. Strictly read-only, stdlib-only, local-only. brew tap ek33450505/cast-ledger && brew install cast-ledger",
    summary: "Signed, hash-chained, tamper-evident session receipts for Claude Code — renders a SHA-256 audit receipt from cast.db and verifies it with --verify. Read-only.",
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
    dateAdded: "2026-07-02",
    title: "cast-predict",
    description:
      "Telemetry-driven dispatch prediction for Claude Code — reads cast.db to predict a task's likely cost, suggest agents ranked by past performance, and surface related incidents before you run it. Strictly read-only, stdlib-only. brew tap ek33450505/cast-predict && brew install cast-predict",
    summary: "Telemetry-driven dispatch prediction for Claude Code — reads cast.db to forecast task cost, rank agents by past performance, and surface incidents beforehand.",
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
    dateAdded: "2026-05-06",
    title: "cast-time",
    description:
      "A single-purpose Claude Code SessionStart hook that solves a fundamental LLM limitation: Claude has no clock. Injects local time, timezone, and a semantic time-of-day bucket (morning/afternoon/evening/night) at session start — no rules, no slash commands, just context. brew tap ek33450505/cast-time && brew install cast-time",
    summary: "A single-purpose Claude Code SessionStart hook that fixes a basic LLM gap: no clock. Injects local time, timezone, and a time-of-day bucket at session start.",
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
    dateAdded: "2026-05-11",
    title: "cast-doctor",
    description:
      "A standalone, read-only health check for any Claude Code install — validates hook wiring, MCP config, agent frontmatter, cast.db core schema, and stale memories without modifying anything. A suite of read-only checks; works with or without the full CAST framework. brew tap ek33450505/cast-doctor && brew install cast-doctor",
    summary: "Standalone, read-only health check for any Claude Code install — validates hook wiring, MCP config, agent frontmatter, cast.db schema, and stale memories.",
    tech: ["Bash", "Shell", "SQLite", "Claude Code"],
    icon: BarChart3,
    color: "teal",
    category: "personal",
    group: "ecosystem",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-doctor",
    githubRepo: { owner: "ek33450505", repo: "cast-doctor" },
    stats: ["Open Source", "Read-Only", "Homebrew Install"],
  },
  {
    slug: "cast-memory",
    dateAdded: "2026-04-17",
    title: "cast-memory",
    description:
      "Persistent, searchable memory for Claude Code agents — FTS5 full-text search, weighted relevance scoring, temporal validity, optional Ollama semantic embeddings, and weekly consolidation over cast.db. brew tap ek33450505/cast-memory && brew install cast-memory",
    summary: "Persistent, searchable memory for Claude Code agents — FTS5 full-text search, weighted relevance, temporal validity, and optional Ollama semantic embeddings.",
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
    dateAdded: "2026-04-17",
    title: "Claude's Journal",
    description:
      "Hook-based journaling for Claude Code (Stop / SessionStart / UserPromptSubmit) — maintains Claude's perspective and working memory across sessions as Obsidian-compatible markdown in ~/Documents/Claude/. brew tap ek33450505/claudes-journal && brew install claudes-journal",
    summary: "Hook-based journaling for Claude Code — maintains Claude's perspective and memory across sessions as Obsidian-compatible markdown in ~/Documents/Claude/.",
    tech: ["Bash", "Shell", "Markdown"],
    icon: Terminal,
    color: "violet",
    category: "personal",
    group: "ecosystem",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-claudes_journal",
    githubRepo: { owner: "ek33450505", repo: "cast-claudes_journal" },
    stats: ["Open Source", "Obsidian-Compatible", "Homebrew Install"],
  },
  {
    slug: "cast-website",
    dateAdded: "2026-05-26",
    title: "cast-website",
    description:
      "Marketing and documentation site for the CAST framework — a React 19 + Vite + Tailwind v4 build with Framer Motion and Lenis smooth-scroll, deployed on Vercel at castframework.dev. Presents the framework, its ecosystem packages, and install paths.",
    summary: "Marketing and documentation site for the CAST framework — a React 19 + Vite + Tailwind v4 build with Framer Motion and Lenis smooth-scroll, deployed on Vercel.",
    tech: ["React 19", "Vite", "Tailwind v4", "Framer Motion", "Vercel"],
    icon: Globe,
    color: "teal",
    category: "personal",
    group: "ecosystem",
    castEcosystem: true,
    link: "https://castframework.dev",
    stats: ["React 19", "Vite", "Tailwind v4", "Live Site"],
  },

  // ── Professional ──────────────────────────────────────────────────────────
  {
    slug: "crosscheck",
    dateAdded: "2026-04-17",
    title: "CrossCheck",
    description:
      "Mission-critical EMIS data validation platform serving Ohio school districts. Spearheaded the complete migration from AngularJS to React, modernizing the entire frontend architecture.",
    summary: "Mission-critical EMIS data-validation platform serving Ohio school districts. Spearheaded the full frontend migration from AngularJS to React.",
    tech: ["React", "Node.js", "Python API"],
    icon: BarChart3,
    color: "emerald",
    category: "professional",
    group: "professional",
  },
  {
    slug: "ses-wiki",
    dateAdded: "2026-04-17",
    title: "SES-Wiki",
    description:
      "EMIS scenario reference tool I built from the ground up — React 19 + Express 5 with JSON data persistence, automated backups, and full test coverage via Vitest. The go-to resource for Ohio education data teams.",
    summary: "EMIS scenario reference tool built from the ground up — React 19 + Express 5 with JSON persistence, automated backups, and full Vitest coverage.",
    tech: ["React 19", "Vite", "Express 5", "Vitest"],
    icon: Database,
    color: "rose",
    category: "professional",
    group: "professional",
    stats: ["React 19", "Express 5", "Full Test Coverage"],
  },
  {
    slug: "cws",
    dateAdded: "2026-04-17",
    title: "CWS",
    description:
      "Internal catalog platform enabling school districts to browse, request, and manage PowerSchool customizations. Streamlined a process that previously required manual email coordination.",
    summary: "Internal catalog platform letting Ohio school districts browse, request, and manage PowerSchool customizations — replacing a manual email-coordination process.",
    tech: ["React 19", "Vite"],
    icon: ShoppingBag,
    color: "accent",
    category: "professional",
    group: "professional",
    stats: ["React 19", "Vite"],
  },
  {
    slug: "e-rate-dashboard",
    dateAdded: "2026-04-17",
    title: "E-Rate Dashboard",
    description:
      "Full-stack platform for managing federal E-Rate telecom discount program data — helping districts capture funding they're entitled to. Architected as a Docker Compose monorepo with dual React frontends, a Flask API layer, and PostgreSQL.",
    summary: "Full-stack platform for managing federal E-Rate telecom-discount data — a Docker Compose monorepo with dual React frontends, a Flask API, and PostgreSQL.",
    tech: ["React", "Flask", "PostgreSQL", "Docker", "TypeScript", "MUI"],
    icon: DollarSign,
    color: "sky",
    category: "professional",
    group: "professional",
    stats: ["Docker Compose", "Dual Frontend", "Flask + PostgreSQL"],
  },
];

export default projects;
