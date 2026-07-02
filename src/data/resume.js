// Resume content data — extracted from Resume.jsx
// Import into Resume.jsx; do not reference from other components.

import { CAST_STATS, CAST_DESKTOP_STATS } from "./castStats";

export const skills = {
  Frontend: [
    "React 18/19",
    "Vite",
    "TypeScript",
    "Tailwind CSS",
    "Framer Motion",
    "TanStack Query v5",
    "React Router v6/v7",
    "react-resizable-panels",
    "@nivo/charts",
    "Recharts",
    "cmdk",
    "Sonner",
    "Zustand",
    "Radix UI",
    "xterm.js",
    "Bootstrap 5",
    "React Bootstrap",
    "MUI",
    "TanStack Table",
    "AG Grid",
    "AngularJS",
    "jQuery",
    "DataTables",
  ],
  Backend: [
    "Node.js",
    "Express 4/5",
    "tsx",
    "concurrently",
    "Python",
    "Rust",
    "Flask",
    "MS SQL Server",
    "PHP",
    "Server-Sent Events (SSE)",
    "better-sqlite3",
    "REST API Design",
    "Docker",
    "Docker Compose",
    "Traefik",
    "Jenkins",
  ],
  Data: [
    "SQLite",
    "PostgreSQL",
    "MongoDB",
    "BigQuery",
    "SQL",
    "AES-256 Encryption",
  ],
  "AI Infrastructure & Developer Tools": [
    "Claude API",
    "Anthropic SDK",
    "Claude Code",
    `CAST ${CAST_STATS.version} (${CAST_STATS.agents} agents, ${CAST_STATS.packages} Homebrew taps)`,
    "Agent Architecture",
    "Managed Agents (beta)",
    "Tauri v2",
    "Ollama",
    "RAG / Embeddings",
    "Shell Scripting",
    "Textual (Python TUI)",
    "Hook Architecture",
    "MCP (Model Context Protocol)",
    "launchd Scheduling",
    "BATS (Bash Automated Testing System)",
    "ElevenLabs TTS",
    "Git",
    "CI/CD",
    "Jest",
    "Vitest",
    "Playwright",
  ],
};

export const skillColors = {
  Frontend: "bg-accent-400/10 text-accent-400",
  Backend: "bg-sky-400/10 text-sky-400",
  Data: "bg-emerald-400/10 text-emerald-400",
  "AI Infrastructure & Developer Tools": "bg-rose-400/10 text-rose-400",
};

export const labelColors = {
  Frontend: "text-accent-400",
  Backend: "text-sky-400",
  Data: "text-emerald-400",
  "AI Infrastructure & Developer Tools": "text-rose-400",
};

export const experience = [
  {
    role: "Application Developer",
    company: "META Solutions",
    location: "Columbus, OH",
    period: "August 2022 — Present",
    highlights: [
      `Creator of CAST (Claude Agent Specialist Team) ${CAST_STATS.version} — a local-first, open-source multi-agent framework embedded into Claude Code via hook-driven dispatch. ${CAST_STATS.agents} specialist agents with model-driven routing (Sonnet for complex tasks, Haiku for lightweight, Opus for migration review), local SQLite observability, per-agent persistent memory, and a hook-enforced quality gate layer. No cloud dependencies — everything runs on the developer machine.`,
      `Shipped cast-desktop ${CAST_DESKTOP_STATS.version} — the flagship native macOS app for CAST. Built with Tauri 2 + React 19 + Rust, embedded Express 5 + SQLite backend, real PTY-backed terminal via xterm.js + Rust Forge, ${CAST_DESKTOP_STATS.dashboardViews} dashboard views (Activity, Sessions, Agents, Hooks, Memory, Plans, System, Token Spend, DB Explorer, Docs), Cmd+K command palette, search-in-terminal, multi-tab terminal with folder-picker cwd, and 6 themes. Distributed via brew tap ek33450505/cast-desktop.`,
      `Launched castframework.dev and aligned the ${CAST_STATS.packages}-tap Homebrew ecosystem — cast-agents, cast-hooks, cast-observe, cast-security, cast-dash, cast-memory, cast-parallel, cast-routines, cast-doctor, cast-time, cast-desktop, Claude's Journal, and the umbrella \`cast\` formula — so developers can install only the components they need. Each tap has its own versioned releases and standalone functionality.`,
      "Built two complementary observability layers: the Claude Code Dashboard v2.2.0 (React 19 + TypeScript + Express 5 + SSE) — a 10-page real-time UI with session cost tracking, per-agent scorecards, Cmd+K search, and privacy auditing — and cast-dash, an htop-style Python TUI for terminal-native monitoring.",
      "Shipped cast-routines and cast-doctor — routines schedule autonomous Claude Code workflows via YAML + cron; doctor is a read-only health-check CLI that audits any Claude Code install for missing hooks, stale memory, and configuration drift.",
      "Spearheaded the complete migration of CrossCheck from AngularJS to React — a mission-critical EMIS validation platform built with React 18, AG Grid, MUI, JWT auth, and TanStack Query, now serving 4,200+ users across 900+ Ohio school districts.",
      "Architected and maintain five production web applications across React, Flask, Express, PostgreSQL, and jQuery/DataTables — each serving Ohio's K-12 education ecosystem.",
      "Engineered SES-Wiki from the ground up — a React 19 + Express 5 EMIS scenario reference tool, complete with JSON persistence, automated backups, and comprehensive Vitest test coverage.",
      "Launched the Customization Web Store (CWS) — an internal React 19 + Vite platform that streamlined PowerSchool customization requests, replacing a manual email-based workflow.",
      "Modernized the E-Rate dashboard into a Docker Compose monorepo architecture — dual React frontends, a Flask REST API with PostgreSQL, Traefik reverse proxy, and Jenkins CI/CD — helping districts track and capture federal telecom discount funding.",
      "Maintain and extend PowerSchool plugin customizations (jQuery/DataTables) including the Alert Builder — a notification system deployed across multiple client school districts.",
      "Pioneer AI-augmented development workflows — engineered TARUS (dual-LLM assistant) and PromptBot (prompt optimizer), and leverage Claude Code daily as an AI pair programmer to accelerate velocity and code quality.",
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

export const printStyles = `
  @media print {
    nav, footer, [data-print-hide] {
      display: none !important;
    }
    body {
      background: white !important;
      color: #0f172a !important;
    }
    #resume-print {
      background: white !important;
      padding: 0 !important;
      min-height: unset !important;
    }
    #resume-print .rounded-xl {
      border: 1px solid #e2e8f0 !important;
      background: white !important;
    }
    #resume-print h1, #resume-print h2, #resume-print h3 {
      color: #0f172a !important;
    }
    #resume-print p, #resume-print li, #resume-print span {
      color: #334155 !important;
    }
    #resume-print .text-accent-400, #resume-print .text-sky-400,
    #resume-print .text-emerald-400, #resume-print .text-rose-400,
    #resume-print .text-slate-400 {
      color: #475569 !important;
    }
    #resume-print .bg-accent-400\\/10, #resume-print .bg-sky-400\\/10,
    #resume-print .bg-emerald-400\\/10, #resume-print .bg-rose-400\\/10 {
      background-color: #f1f5f9 !important;
    }
    .mt-10 { margin-top: 1.5rem !important; }
    .mt-8 { margin-top: 1.25rem !important; }
    ul li { page-break-inside: avoid; }
    @page { margin: 0.5in; }
  }
`;
