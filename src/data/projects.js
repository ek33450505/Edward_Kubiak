import { Network, LayoutDashboard, BarChart3, Terminal, Database, ShoppingBag, DollarSign, ShieldCheck, Repeat, Crosshair } from "lucide-react";
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

  // ── AI & Claude Code Tools ────────────────────────────────────────────────
  {
    slug: "looptrip",
    title: "looptrip",
    description:
      'A deterministic, framework-agnostic, zero-LLM detector of multi-agent coordination pathologies — duplicate-work loops, ping-pong / livelock, deadlock, and non-termination — that trips at iteration 2, not on the invoice. An observer, never a gate: it reads data you already have (OpenTelemetry GenAI handoff spans or a CAST cast.db), and the same event stream always yields the same verdict. On two real recorded runaway sessions it reproduces $792.96 of prevented duplicate-work spend in one command. 516 tests; live on PyPI. pip install looptrip · brew tap ek33450505/looptrip && brew install looptrip',
    tech: ["Python", "OpenTelemetry", "Claude Code", "SQLite", "Detection"],
    icon: Repeat,
    color: "rose",
    category: "personal",
    group: "tools",
    featured: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/looptrip",
    githubRepo: { owner: "ek33450505", repo: "looptrip" },
    stats: ["Zero-LLM", "516 Tests", "$792.96 Proof", "Plugin + Homebrew", "v0.1.2"],
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
    stats: ["Zero-LLM", "490 Tests", "Evidence-Ranked", "Plugin + Homebrew", "v0.2.0"],
  },
  {
    slug: "attest",
    title: "Attest",
    description:
      'A local, deterministic, zero-LLM Claude Code hook that verifies a subagent\'s "Status: DONE" / "## Handoff" claim against the real git working-tree delta — and, opt-in, blocks a DONE whose claimed files never actually landed on disk. It adds no tokens, cannot hallucinate its own verdict, and fails open on every doubt. Validated end-to-end against real Claude Code v2.1.170 with committed payload fixtures; 304 tests, CI green. brew tap ek33450505/attest && brew install attest',
    tech: ["Python", "Claude Code", "Hook Architecture", "Git", "BATS", "GitHub Actions"],
    icon: ShieldCheck,
    color: "emerald",
    category: "personal",
    group: "tools",
    featured: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/attest",
    githubRepo: { owner: "ek33450505", repo: "attest" },
    stats: ["Zero-LLM", "304 Tests", "Plugin + Homebrew", "v0.2.0"],
  },
  {
    slug: "claude-code-dashboard",
    title: "Claude Code Dashboard",
    description:
      "Observability layer for CAST — a 10-page React 19 + TypeScript UI with real-time SSE activity feed, session cost tracking, per-agent scorecards, Cmd+K global search, and a privacy audit showing your cloud vs. local API ratio. 15+ Express API endpoint categories. Gracefully degrades when CAST is not installed. v2.2.0",
    tech: ["React 19", "TypeScript", "Vite", "Express", "SSE", "Recharts", "better-sqlite3"],
    icon: LayoutDashboard,
    color: "teal",
    category: "personal",
    group: "tools",
    aiEngineering: true,
    castEcosystem: true,
    github: "https://github.com/ek33450505/claude-code-dashboard",
    githubRepo: { owner: "ek33450505", repo: "claude-code-dashboard" },
    stats: ["10 Pages", "15+ APIs", "SSE Live Feed", "v2.2.0"],
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
    slug: "cast-time",
    title: "cast-time",
    description:
      "A single-purpose Claude Code SessionStart hook that solves a fundamental LLM limitation: Claude has no clock. Injects local time, timezone, and a semantic time-of-day bucket (morning/afternoon/evening/night) at session start — no rules, no slash commands, just context.",
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
    slug: "cast-routines",
    title: "cast-routines",
    description:
      "Part of the open-source CAST ecosystem — schedule autonomous Claude Code workflows via YAML + cron. Define a routine in YAML, point cron at it, and Claude runs the workflow on its own. Generalizes the JARVIS PA pattern into a reusable scheduling primitive. brew tap ek33450505/cast-routines && brew install cast-routines",
    tech: ["Bash", "YAML", "cron", "Claude Code"],
    icon: Terminal,
    color: "accent",
    category: "personal",
    group: "ecosystem",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-routines",
    githubRepo: { owner: "ek33450505", repo: "cast-routines" },
    stats: ["Open Source", "YAML Routines", "cron Scheduling", "Homebrew Install"],
  },
  {
    slug: "cast-doctor",
    title: "cast-doctor",
    description:
      "Part of the open-source CAST ecosystem — a read-only health check for any Claude Code install. Audits hook wiring, memory freshness, settings drift, and database integrity without modifying anything. Drop in alongside CAST or use standalone on a vanilla Claude Code setup. brew tap ek33450505/cast-doctor && brew install cast-doctor",
    tech: ["Bash", "Shell", "SQLite", "Claude Code"],
    icon: BarChart3,
    color: "teal",
    category: "personal",
    group: "ecosystem",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-doctor",
    githubRepo: { owner: "ek33450505", repo: "cast-doctor" },
    stats: ["Open Source", "Read-Only", "Health Check", "Homebrew Install"],
  },
  {
    slug: "cast-agents",
    title: "cast-agents",
    description:
      `Part of the open-source CAST ecosystem — install just the agents, nothing else. All ${CAST_STATS.agents} specialist Claude Code agents (commit, debug, review, plan, and more) distributed as a standalone Homebrew package. Mix and match CAST modules to build your own stack. brew tap ek33450505/cast-agents && brew install cast-agents`,
    tech: ["Claude Code", "Bash", "Shell"],
    icon: Network,
    color: "violet",
    category: "personal",
    group: "ecosystem",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-agents",
    githubRepo: { owner: "ek33450505", repo: "cast-agents" },
    stats: ["Open Source", `${CAST_STATS.agents} Agents`, "Homebrew Install", "Claude Code"],
  },
  {
    slug: "cast-observe",
    title: "cast-observe",
    description:
      "Part of the open-source CAST ecosystem — install just the observability layer. Tracks session cost, agent run history, and token spend in local SQLite. Use standalone or pair with cast-dash for a full terminal monitoring stack. Also serves as the data backend for the Claude Code Dashboard. brew tap ek33450505/cast-observe && brew install cast-observe",
    tech: ["Bash", "Shell", "SQLite"],
    icon: BarChart3,
    color: "teal",
    category: "personal",
    group: "ecosystem",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-observe",
    githubRepo: { owner: "ek33450505", repo: "cast-observe" },
    stats: ["Open Source", "Cost Tracking", "SQLite", "Homebrew Install"],
  },
  {
    slug: "cast-security",
    title: "cast-security",
    description:
      "Part of the open-source CAST ecosystem — install just the security layer. Policy gates that hard-block dangerous operations, PII redaction, and a tamper-evident audit log of every agent action. Drop in alongside any other CAST module or use standalone. brew tap ek33450505/cast-security && brew install cast-security",
    tech: ["Bash", "Shell", "Hook Architecture"],
    icon: Terminal,
    color: "rose",
    category: "personal",
    group: "ecosystem",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-security",
    githubRepo: { owner: "ek33450505", repo: "cast-security" },
    stats: ["Open Source", "Policy Gates", "Audit Trail", "PII Redaction"],
  },
  {
    slug: "cast-hooks",
    title: "cast-hooks",
    description:
      "Part of the open-source CAST ecosystem — install just the hooks. 13 production Claude Code hook scripts: observability pipeline, safety policy gates, and agent dispatch directives. Works standalone without the full framework, fully BATS-tested. brew tap ek33450505/cast-hooks && brew install cast-hooks",
    tech: ["Bash", "Shell", "Hook Architecture", "BATS"],
    icon: Terminal,
    color: "rose",
    category: "personal",
    group: "ecosystem",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-hooks",
    githubRepo: { owner: "ek33450505", repo: "cast-hooks" },
    stats: ["Open Source", "13 Hooks", "Observability", "Safety Gates", "Homebrew Install"],
  },
  {
    slug: "cast-dash",
    title: "cast-dash",
    description:
      "Part of the open-source CAST ecosystem — install just the terminal dashboard. An htop-style 4-panel live display built with Python + Textual showing active sessions, agent history, token spend, and hook health. Pair with cast-observe or use standalone against any cast.db. brew tap ek33450505/cast-dash && brew install cast-dash",
    tech: ["Python", "Textual", "SQLite", "Shell"],
    icon: BarChart3,
    color: "teal",
    category: "personal",
    group: "ecosystem",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-dash",
    githubRepo: { owner: "ek33450505", repo: "cast-dash" },
    stats: ["Open Source", "4-Panel TUI", "Live Data", "SQLite", "Homebrew Install"],
  },
  {
    slug: "cast-memory",
    title: "cast-memory",
    description:
      "Part of the open-source CAST ecosystem — install just the memory layer. Persistent memory for Claude Code agents via Python, Shell, and MCP integration. Agents retain context across sessions without cloud storage. brew tap ek33450505/cast-memory && brew install cast-memory",
    tech: ["Python", "Shell", "MCP", "SQLite"],
    icon: Database,
    color: "emerald",
    category: "personal",
    group: "ecosystem",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-memory",
    githubRepo: { owner: "ek33450505", repo: "cast-memory" },
    stats: ["Open Source", "Agent Memory", "MCP Integration", "Homebrew Install"],
  },
  {
    slug: "cast-parallel",
    title: "cast-parallel",
    description:
      "Part of the open-source CAST ecosystem — parallel plan execution. Splits CAST batches across two Claude Code sessions in isolated git worktrees, then merges results automatically when both finish. brew tap ek33450505/cast-parallel && brew install cast-parallel",
    tech: ["Bash", "Shell", "Git Worktrees", "Python"],
    icon: Terminal,
    color: "sky",
    category: "personal",
    group: "ecosystem",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-parallel",
    githubRepo: { owner: "ek33450505", repo: "cast-parallel" },
    stats: ["Open Source", "Parallel Execution", "Auto Merge", "Homebrew Install"],
  },
  {
    slug: "claudes-journal",
    title: "Claude's Journal",
    description:
      "Part of the open-source CAST ecosystem — session journaling for Claude Code. Gives Claude a persistent journal space for cross-session reflection, idea tracking, and evolving perspectives. brew tap ek33450505/claudes-journal && brew install claudes-journal",
    tech: ["Bash", "Shell", "Markdown"],
    icon: Terminal,
    color: "violet",
    category: "personal",
    group: "ecosystem",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-claudes_journal",
    githubRepo: { owner: "ek33450505", repo: "cast-claudes_journal" },
    stats: ["Open Source", "Session Journaling", "Cross-Session Memory", "Homebrew Install"],
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
