// Resume content data — extracted from Resume.jsx
// Import into Resume.jsx; do not reference from other components.

import { CAST_STATS, CAST_DESKTOP_STATS } from "./castStats.js";
import { ATLAS_STATS } from "./atlasStats.js";

export const skills = {
  "AI & Agent Systems": [
    "Claude Code (hooks, agents, skills)",
    "Claude API",
    `CAST ${CAST_STATS.version} (${CAST_STATS.agents} agents, ${CAST_STATS.packages} packages)`,
    "Agent Orchestration & Dispatch",
    "Hook Architecture",
    "MCP (Model Context Protocol)",
    "OpenTelemetry (GenAI spans)",
    "Deterministic Agent-Reliability Tooling",
    "RAG / Embeddings (FTS5, Ollama)",
    "Managed Agents (beta)",
  ],
  "Languages & Frameworks": [
    "TypeScript",
    "JavaScript (Node.js, ESM)",
    "Python",
    "Rust",
    "Bash",
    "React 18/19",
    "Next.js 16",
    "Express 4/5",
    "Vite",
    "Tauri 2",
    "Flask",
    "Tailwind CSS v4",
    "TanStack Query v5",
    "Motion",
    "MUI",
    "AG Grid",
    "xterm.js",
  ],
  Data: [
    "SQLite (better-sqlite3, FTS5)",
    "PostgreSQL",
    "MS SQL Server",
    "MongoDB",
    "BigQuery",
    "SQL",
    "Server-Sent Events (SSE)",
  ],
  "Testing & Delivery": [
    "Vitest",
    "React Testing Library",
    "BATS",
    "pytest / unittest",
    "GitHub Actions",
    "Homebrew Packaging",
    "shellcheck",
    "Docker / Docker Compose",
    "Traefik",
    "Jenkins",
    "launchd",
    "Git",
  ],
};

export const summary = `Full stack developer and AI systems engineer. Creator of CAST ${CAST_STATS.version} — a local-first, open-source multi-agent control plane for Claude Code whose ${CAST_STATS.tables}-table execution record is searchable, signed, and predictive — shipped as a ${CAST_STATS.packages}-package Homebrew ecosystem backed by ${CAST_STATS.tests.toLocaleString("en-US")} tests. Creator of Compute Atlas (compute-atlas.com) — an open, source-cited map of the U.S. data-center buildout spanning ${ATLAS_STATS.facilities} facilities across ${ATLAS_STATS.states} states, published as open data with a public API. Builds deterministic, zero-LLM agent-reliability tools (misfire, attest, looptrip) shipped on PyPI and Homebrew. Ships and maintains five production web applications at META Solutions serving 4,200+ users across 900+ Ohio school districts. Open to full-stack and AI-infrastructure roles.`;

export const experience = [
  {
    role: "Creator & Maintainer — CAST & Agent-Reliability Tools",
    company: "Open Source",
    location: "github.com/ek33450505",
    period: "2024 — Present",
    highlights: [
      `Creator of CAST ${CAST_STATS.version} "The Record That Acts" — a local-first, open-source multi-agent control plane for Claude Code: ${CAST_STATS.agents} specialist agents with hook-driven dispatch, model-aware routing, hook-enforced quality gates, and a ${CAST_STATS.tables}-table SQLite execution record. v9 makes the record act: full-text search over every session (cast ask), signed SHA-256 audit receipts (cast ledger --verify), and telemetry-driven cost prediction (cast predict). ${CAST_STATS.tests.toLocaleString("en-US")} tests, zero cloud dependencies.`,
      `Shipped the CAST ecosystem as ${CAST_STATS.packages} Homebrew packages plus the umbrella cast formula — the flagship framework, cast-desktop (native Tauri 2 + React 19 + Rust app with an embedded Express 5 + SQLite backend, ${CAST_DESKTOP_STATS.dashboardViews} dashboard views, and a real PTY-backed terminal), the Claude Code Dashboard v2.5.0 (React 19 + TypeScript + Express 5 + SSE observability UI), and standalone packages for agent memory, health checks, journaling, MCP access, signed receipts, and dispatch prediction.`,
      "Built a family of deterministic, zero-LLM agent-reliability tools, each shipped to PyPI and Homebrew with CI: misfire v0.2.0, a trace-grounded CLAUDE.md adherence auditor that finds which rules agents actually ignore; attest v0.3.0, a hook that verifies a subagent's DONE claim against the real git delta (325 tests); and looptrip v0.1.2, a coordination-pathology detector that trips duplicate-work loops at iteration 2 and reproduces $792.96 of prevented spend from a committed fixture.",
    ],
  },
  {
    role: "Creator — Compute Atlas",
    company: "Open Source · compute-atlas.com",
    location: "github.com/ek33450505/compute-atlas",
    period: "2026 — Present",
    highlights: [
      `Built and operate Compute Atlas (${ATLAS_STATS.version}) — an open, source-cited census of the U.S. data-center buildout: ${ATLAS_STATS.facilities} facilities across ${ATLAS_STATS.states} states, ${ATLAS_STATS.operationalGw} GW operational and ~${ATLAS_STATS.plannedGw} GW in the planned pipeline, every record carrying at least one public source and an explicit confidence level (confirmed / reported / rumored). Built solo on ${ATLAS_STATS.stack}.`,
      `Shipped the full product: an interactive MapLibre GL map, sortable data tables, per-facility dossiers, and SEO/reference hubs (rankings, power & water, operators, metros, AI-vs-crypto), plus a public CORS-open JSON API — with the entire dataset released as open data (code MIT, data CC BY 4.0).`,
      "Engineered an autonomous daily discovery pipeline — a single bounded `claude -p` run that discovers, enriches, and stages candidate facilities behind a fail-closed kill switch, a heartbeat, and a self-reverting cap, with human approval required before any record goes live.",
    ],
  },
  {
    role: "Applications Developer",
    company: "META Solutions",
    location: "Columbus, OH",
    period: "August 2022 — Present",
    highlights: [
      "Spearheaded the complete migration of CrossCheck from AngularJS to React — a mission-critical EMIS data validation platform (React 18, AG Grid, MUI, TanStack Query, JWT auth) serving 4,200+ users across 900+ Ohio school districts.",
      "Architect and maintain five production web applications across React, Flask, Express, PostgreSQL, and MS SQL Server, each serving Ohio's K-12 education ecosystem.",
      "Engineered SES-Wiki from the ground up — a React 19 + Express 5 EMIS scenario reference tool with JSON persistence, automated backups, and comprehensive Vitest coverage.",
      "Launched the Customization Web Store (CWS) — an internal React 19 + Vite platform that streamlined PowerSchool customization requests, replacing a manual email-based workflow.",
      "Modernized the E-Rate dashboard into a Docker Compose monorepo — dual React frontends, a Flask REST API with PostgreSQL, Traefik reverse proxy, and Jenkins CI/CD — helping districts capture federal telecom discount funding.",
      "Maintain and extend PowerSchool plugin customizations (jQuery/DataTables), including the Alert Builder notification system deployed across multiple client districts.",
      "Use Claude Code and CAST daily as production development infrastructure — the same multi-agent tooling published as open source.",
    ],
  },
];

export const education = [
  {
    degree: "Full Stack Web Development Certificate",
    institution: "The Ohio State University",
    period: "January 2022 — July 2022",
  },
  {
    degree: "Bachelor of Arts and Science in Geological Science",
    institution: "Ohio University",
    period: "August 2005 — June 2009",
  },
];

// Classic-paper print output: neutralize the parchment/atlas theme to black-on-white.
// Applied when printing /resume (Cmd+P) and by the puppeteer PDF generator.
export const printStyles = `
  @media print {
    nav, footer, [data-print-hide] {
      display: none !important;
    }
    body {
      background: white !important;
      color: #1a1a1a !important;
    }
    #resume-print {
      background: white !important;
      padding: 0 !important;
      min-height: unset !important;
    }
    #resume-print .card,
    #resume-print .card-interactive,
    #resume-print .neatline {
      background: white !important;
      border: 1px solid #d4d4d4 !important;
      box-shadow: none !important;
    }
    #resume-print h1, #resume-print h2, #resume-print h3 {
      color: #1a1a1a !important;
    }
    #resume-print p, #resume-print li, #resume-print span, #resume-print a {
      color: #333333 !important;
    }
    /* Flatten the contour-green + sepia accents for paper */
    #resume-print .text-primary,
    #resume-print .text-muted-foreground,
    #resume-print .text-foreground {
      color: #333333 !important;
    }
    #resume-print .bg-primary {
      background-color: #444444 !important;
    }
    #resume-print .border-border {
      border-color: #d4d4d4 !important;
    }
    .mt-10 { margin-top: 1.5rem !important; }
    .mt-8 { margin-top: 1.25rem !important; }
    ul li { page-break-inside: avoid; }
    @page { margin: 0.5in; }
  }
`;
