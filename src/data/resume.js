// Resume content data — the single source of truth for /resume and both PDFs.
// Import into Resume.jsx and scripts/build-resume-pdf.mjs; do not reference elsewhere.
//
// Claim discipline (docs/claims-ledger.md): every number here is either interpolated
// from a self-healing feed (CAST_STATS / ATLAS_STATS / TOOL_VERSIONS) or is a "placed"
// figure — true, feed-less, and carried in prose with an explicit as-of anchor. Never a tile.

import { CAST_STATS, CAST_DESKTOP_STATS } from "./castStats.js";
import { ATLAS_STATS } from "./atlasStats.js";
import { TOOL_VERSIONS } from "./toolStats.js";
import practice from "./practice.js";

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
    "Flask",
    "Vite",
    "Tauri 2",
    "React Router 7",
    "TanStack Query v5 / Table v8",
    "Radix UI",
    "Tailwind CSS v4",
    "Monaco Editor",
    "Motion",
    "xterm.js",
  ],
  Data: [
    "MS SQL Server",
    "PostgreSQL",
    "SQLite (better-sqlite3, FTS5)",
    "BigQuery",
    "SQL",
    "Drizzle ORM",
    "SQLAlchemy",
    "Server-Sent Events (SSE)",
  ],
  "Testing & Delivery": [
    "Vitest",
    "React Testing Library",
    "BATS",
    "pytest / unittest",
    "GitHub Actions",
    "Jenkins",
    "Docker / Docker Compose",
    "Traefik",
    "Homebrew Packaging",
    "shellcheck",
    "launchd",
    "Git",
  ],
};

export const summary = `Full stack developer, four years building and owning production React applications across Ohio's K-12 education ecosystem. Agents write most of my code now; that moved the work rather than removing it — the judgment, the verification and the consequences stay put, and building the tooling that enforces exactly that is what my open-source work is about. Hired two weeks out of a full-stack certificate in August 2022 to replace an end-of-life AngularJS platform with React, I shipped that rewrite, opened it to districts in September 2024, and remain its sole architect. Creator of CAST ${CAST_STATS.version} — a local-first, open-source multi-agent control plane for Claude Code whose ${CAST_STATS.tables}-table execution record is searchable, signed, and predictive, shipped as a ${CAST_STATS.packages}-package Homebrew ecosystem backed by ${CAST_STATS.tests.toLocaleString("en-US")} tests — and of Compute Atlas (compute-atlas.com), an open, source-cited census of the U.S. grid-scale compute buildout spanning ${ATLAS_STATS.facilities.toLocaleString("en-US")} facilities across ${ATLAS_STATS.states} states, published as open data with a public API. Open to full-stack and AI-infrastructure roles.`;

export const experience = [
  {
    role: "Applications Developer",
    company: "META Solutions",
    location: "Columbus, OH",
    period: "August 2022 — Present",
    tech: [
      "React 18/19",
      "Vite 7",
      "TypeScript",
      "TanStack Query v5 / Table v8",
      "Radix UI",
      "Monaco Editor",
      "Express 5",
      "Flask",
      "MS SQL Server",
      "PostgreSQL",
      "Docker",
      "Jenkins",
      "Vitest",
    ],
    highlights: [
      "Hired two weeks out of a full-stack certificate, explicitly to rebuild CrossCheck — the EMIS data-validation platform Ohio school districts use to find and fix state-reporting errors before they cost funding. Its predecessor was an end-of-life AngularJS 1.x + jQuery + PHP application: not a framework swap but a ground-up React rewrite across an architecture boundary. Built through the first year, internal deployments from September 2023, production January 2024, opened to districts September 2024 — and I am the sole architect and author of 1,706 of its 1,728 commits (as of September 2026).",
      "Own CrossCheck end to end today: roughly 54,000 lines across 265 source files, 109 test files, and a suite documented at 1,193 passing tests as of August 30, 2026. Led its migration off Create React App to Vite 7, off Bootstrap onto a design-token system guarded by its own test, and off component-level useEffect fetches onto a typed service and query layer (TanStack Query v5, TanStack Table v8, Radix primitives, Monaco for in-app SQL) one caller at a time, with a colocated test per service and query hook. TypeScript conversion is deliberately incremental and ongoing.",
      "Shipped security as artifacts rather than assumptions: a Content-Security-Policy header pinned by a test that fails when the policy changes, esbuild console and debugger stripping on production builds only, a DOMPurify link-hardening hook, and a lint rule that fails the build if raw HTML injection appears anywhere outside one sanctioned module.",
      "Built SES-Wiki from an empty directory in March 2026 — a full-stack EMIS scenario reference in React 19 + Vite 7 and Express 5 on Node 20, strict TypeScript, roughly 21,300 lines with 31 test files and 340 tests green as of August 3, 2026. Designed a storage-adapter abstraction that fails loud on an unknown backend, around 25 REST endpoints with ETag revalidation and a typed error taxonomy mapped to status codes in exactly one place, an append-only audit log on every mutation, and the proxy-identity, bearer-validation and rate-limiting middleware. Delivery is a multi-stage Docker image through Jenkins — lint, typecheck, then tests, cheapest gate first — into a private registry and Portainer. It is in QA, mounting inside CrossCheck at same origin behind a validated bearer token; district cutover is expected in early 2027.",
      "Inherited and modernized the Customization Web Store (customizations.metasolutions.net), META's public catalog of PowerSchool customizations: Create React App to Vite 7, React 17 to 19, jQuery and Fancybox removed from a live production page, an XSS vector closed with DOMPurify sanitization of API-sourced HTML, and an accessibility, SEO and dependency-hygiene pass recorded as seven dated findings documents.",
      "Own the E-Rate dashboard front end on a four-service Docker Compose platform (Flask + SQLAlchemy API, PostgreSQL, a Python ingest scraper, Traefik, Jenkins) that helps districts capture federal telecom discount funding. Ran an eight-dimension audit with adversarial verification in August 2026 — 98 findings, 3 critical, none refuted — then executed the first remediation phase: route guards on six authenticated routes that had been reachable by direct navigation, a hardcoded dev-bypass login removed from the production bundle and grep-verified gone from the shipped artifact, npm audit findings from 387 to 62, and a rebuilt applications table with debounced search, failed-edit rollback and a monotonic sequence race guard.",
      "Maintain and extend PowerSchool plugin customizations (jQuery/DataTables), including the Alert Builder notification system deployed across multiple client districts.",
      `Use Claude Code and CAST daily as production development infrastructure — the same multi-agent tooling I publish as open source — with the review gate recorded independently rather than assumed: over the 30 days ending September 4, 2026, CrossCheck work passed 147 code-review verdicts of which 14 came back with concerns and 2 blocked outright. The throughput shows in git: 156 commits in all of 2025 against 519 in the first nine months of 2026, and a test suite that went from 884 to 1,193 over the same stretch.`,
    ],
  },
  {
    role: "Creator & Maintainer — CAST & Agent-Reliability Tools",
    company: "Open Source",
    location: "github.com/ek33450505",
    period: "2026 — Present",
    tech: [
      "Claude Code",
      "Node.js / ESM",
      "Python",
      "Rust",
      "Bash",
      "SQLite (FTS5)",
      "Tauri 2",
      "React 19",
      "Express 5",
      "OpenTelemetry",
      "BATS",
      "Homebrew",
    ],
    highlights: [
      `Creator of CAST ${CAST_STATS.version} "Make the Gates Tell the Truth" — a local-first, open-source multi-agent control plane for Claude Code: ${CAST_STATS.agents} specialist agents with hook-driven dispatch, model-aware routing, hook-enforced quality gates, and a ${CAST_STATS.tables}-table SQLite execution record that acts — full-text search over every session (cast ask), signed SHA-256 audit receipts (cast ledger --verify), and telemetry-driven cost prediction (cast predict). v10 audited every quality gate against one question — what does this check report when the thing it guards did not happen? — and rebuilt the ones that reported success either way; new tests are mutation-tested against the bug they guard before they are trusted. ${CAST_STATS.tests.toLocaleString("en-US")} tests, zero cloud dependencies.`,
      `Shipped the CAST ecosystem as ${CAST_STATS.packages} Homebrew packages plus the umbrella cast formula — the flagship framework, cast-desktop (native Tauri 2 + React 19 + Rust app with an embedded Express 5 + SQLite backend, ${CAST_DESKTOP_STATS.dashboardViews} dashboard views, and a real PTY-backed terminal), the Claude Code Dashboard ${TOOL_VERSIONS["claude-code-dashboard"]} (React 19 + TypeScript + Express 5 + SSE observability UI), and standalone packages for agent memory, health checks, journaling, MCP access, signed receipts, and dispatch prediction.`,
      `Built a family of deterministic, zero-LLM agent-reliability tools, each shipped with CI — misfire and looptrip to PyPI and Homebrew, attest as a Homebrew formula and Claude Code plugin: misfire ${TOOL_VERSIONS.misfire}, a trace-grounded CLAUDE.md adherence auditor that finds which rules agents actually ignore; attest ${TOOL_VERSIONS.attest}, a hook that verifies a subagent's DONE claim against the real git delta; and looptrip ${TOOL_VERSIONS.looptrip}, a coordination-pathology detector that trips duplicate-work loops at iteration 2 and reproduces prevented duplicate-work spend from a committed fixture.`,
    ],
  },
  {
    role: "Creator — Compute Atlas",
    company: "Open Source · compute-atlas.com",
    location: "github.com/ek33450505/compute-atlas",
    period: "2026 — Present",
    tech: [
      "Next.js 16",
      "React 19",
      "TypeScript",
      "MapLibre GL",
      "Neon Postgres",
      "Drizzle ORM",
      "Vercel",
    ],
    highlights: [
      `Built and operate Compute Atlas (${ATLAS_STATS.version}) — an open, source-cited census of the U.S. grid-scale compute buildout covering data centers, crypto-mining sites, and the dedicated power generation contracted to feed them: ${ATLAS_STATS.facilities.toLocaleString("en-US")} facilities across ${ATLAS_STATS.states} states, ${ATLAS_STATS.operationalGw} GW operational, ${ATLAS_STATS.underConstructionGw} GW under construction and ~${ATLAS_STATS.plannedGw} GW in the planned pipeline, every record carrying at least one public source and an explicit confidence level (confirmed / reported / rumored). Built solo on ${ATLAS_STATS.stack}.`,
      "Shipped the full product: an interactive MapLibre GL map with water and geology overlays, sortable data tables, per-facility dossiers, and reference hubs (rankings, power, operators, metros, states, AI-vs-crypto), plus a /learn tier answering the underlying questions in cited prose and a public CORS-open JSON API — with the entire dataset released as open data (code MIT, data CC BY 4.0).",
      "Engineered an autonomous daily discovery pipeline — a single bounded `claude -p` run that discovers, enriches, and stages candidate facilities behind a fail-closed kill switch, a heartbeat, extraction guards, and a self-reverting cap, mechanically verifying every candidate source URL before staging, with human approval required before any record goes live.",
      "Extended the survey beyond capacity into its civic footprint — a community-opposition dimension recording litigation, moratoria, referendums and the projects opposition defeated, and a named-stakeholder dimension tying founders, owners, investors, executives, landowners and public officials to specific sites under a mandatory-citation, site-level evidentiary bar.",
    ],
  },
];

// Pre-engineering roles. Deliberately compact: dates and titles close the timeline,
// and the framing line carries the transferable thread without diluting the technical record.
export const earlierCareer = {
  note: "Nine years of operations and people management preceded the career change — shift and crew leadership, training programs, performance management, and client accounts.",
  roles: [
    {
      role: "Shift Supervisor",
      company: "United Parcel Service",
      location: "Columbus, OH",
      period: "September 2020 — August 2022",
    },
    {
      role: "Account & Production Manager",
      company: "Peabody Landscape Group",
      location: "Columbus, OH",
      period: "March 2013 — June 2020",
    },
  ],
};

// Condensed from src/data/practice.js so /practice, /resume and both PDFs cannot diverge.
export const aiPractice = {
  note: "How I work with agents — condensed. Full write-up and dated case studies at edwardkubiak.com/practice.",
  items: [
    ...practice.loop.filter((step) => step.resumeLine).map((step) => step.resumeLine),
    ...practice.principles.filter((p) => p.resumeLine).map((p) => p.resumeLine),
  ],
};

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
