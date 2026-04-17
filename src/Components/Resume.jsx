import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { motion } from "motion/react";
import { Mail, MapPin, Download } from "lucide-react";

const skills = {
  Frontend: [
    "React 18/19",
    "Vite",
    "TypeScript",
    "Tailwind CSS",
    "Framer Motion",
    "TanStack Query v5",
    "React Router v6/v7",
    "cmdk",
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
    "Claude Code",
    "CAST v4.6 (17 agents, 9 Homebrew packages)",
    "Agent Architecture",
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

const skillColors = {
  Frontend: "bg-amber-400/10 text-amber-400",
  Backend: "bg-sky-400/10 text-sky-400",
  Data: "bg-emerald-400/10 text-emerald-400",
  "AI Infrastructure & Developer Tools": "bg-rose-400/10 text-rose-400",
};

const labelColors = {
  Frontend: "text-amber-400",
  Backend: "text-sky-400",
  Data: "text-emerald-400",
  "AI Infrastructure & Developer Tools": "text-rose-400",
};

const experience = [
  {
    role: "Application Developer",
    company: "META Solutions",
    location: "Columbus, OH",
    period: "August 2022 — Present",
    highlights: [
      "Creator of CAST (Claude Agent Specialist Team) v4.6 — a local-first, open-source multi-agent framework embedded into Claude Code via hook-driven dispatch. 17 specialist agents with model-driven routing (Sonnet for complex tasks, Haiku for lightweight), local SQLite observability, per-agent persistent memory with FTS5 search, and 255 BATS tests. No cloud dependencies — everything runs on the developer machine.",
      "Architected the CAST ecosystem as 9 modular Homebrew packages — cast-agents, cast-hooks, cast-observe, cast-security, cast-dash, cast-memory, cast-parallel, Claude's Journal, and JARVIS — enabling developers to install only the components they need. Each package has its own Homebrew tap, versioned releases, and standalone functionality.",
      "Built two complementary observability layers: the Claude Code Dashboard (React 19 + TypeScript + Express 5 + SSE) — a 10-page real-time UI with session cost tracking, per-agent scorecards, Cmd+K search, and privacy auditing — and cast-dash, an htop-style Python TUI for terminal-native monitoring.",
      "Building Forge — a native macOS terminal emulator designed around Claude Code using Tauri v2, React 19, TypeScript, and xterm.js. Features multi-tab splits, Claude session detection, CAST integration, command palette, ghost-text suggestions, inline error annotations, and 6 built-in themes. Open source.",
      "Engineered JARVIS — part of the CAST ecosystem — a personal assistant framework built on 8 specialized Claude Code agents (briefing, triage, calendar, meeting prep, EOD summary, weekly report, backup, Jira standup) with macOS launchd scheduling for automated daily workflows.",
      "Spearheaded the complete migration of CrossCheck from AngularJS to React — a mission-critical EMIS validation platform built with React 18, AG Grid, MUI, JWT auth, and TanStack Query, now serving 4,200+ users across 900+ Ohio school districts.",
      "Architected and maintain five production web applications across React, Flask, Express, PostgreSQL, and jQuery/DataTables — each serving Ohio's K-12 education ecosystem.",
      "Engineered SES-Wiki from the ground up — a React 19 + Express 5 EMIS scenario reference tool, complete with JSON persistence, automated backups, and comprehensive Vitest test coverage.",
      "Launched the Customization Web Store (CWS) — an internal React 19 + Vite platform that streamlined PowerSchool customization requests, replacing a manual email-based workflow.",
      "Modernized the E-Rate dashboard into a Docker Compose monorepo architecture — dual React frontends, a Flask REST API with PostgreSQL, Traefik reverse proxy, and Jenkins CI/CD — helping districts track and capture federal telecom discount funding.",
      "Maintain and extend PowerSchool plugin customizations (jQuery/DataTables) including the Alert Builder — a notification system deployed across multiple client school districts.",
      "Pioneered AI-augmented development workflows — engineered TARUS (dual-LLM assistant) and PromptBot (prompt optimizer), and leverage Claude Code daily as an AI pair programmer to accelerate velocity and code quality.",
    ],
  },
];

const education = [
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

const Resume = () => {
  const contentRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "Edward_Kubiak_Resume",
  });

  return (
  <div className="min-h-[calc(100vh-80px)] py-20 print:bg-white print:text-black">
    <div ref={contentRef} className="max-w-4xl mx-auto px-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Edward <span className="text-amber-400">Kubiak</span>
          </h1>
          <div className="mt-3 w-16 h-0.5 bg-amber-400/60" />
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
            <a
              href="mailto:edward.kubiak.dev@gmail.com"
              className="inline-flex items-center gap-1.5 hover:text-amber-400 transition-colors"
            >
              <Mail size={14} /> edward.kubiak.dev@gmail.com
            </a>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} /> Columbus, Ohio
            </span>
            <a
              href="https://dev.to/edwardkubiak"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-amber-400 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M7.42 10.05c-.18-.16-.46-.23-.84-.23H6v4.36h.58c.37 0 .67-.08.84-.23.18-.16.27-.45.27-.85v-2.2c0-.4-.09-.69-.27-.85zm13.37-6.41H3.21C1.99 3.64 1 4.63 1 5.85v12.3c0 1.22.99 2.21 2.21 2.21h17.58c1.22 0 2.21-.99 2.21-2.21V5.85c0-1.22-.99-2.21-2.21-2.21zM8.85 14.4c-.37.38-.85.56-1.43.56H5.18V9.04h2.24c.58 0 1.06.19 1.43.56.37.38.56.85.56 1.43v1.94c0 .58-.19 1.06-.56 1.43zm4.75-4.25H11.5v1.64h1.28v1.11H11.5v1.64h2.1v1.11H11c-.65 0-1.11-.47-1.11-1.11v-4.16c0-.65.47-1.11 1.11-1.11h2.6v1.11zm5.04 4.73c-.4.6-.97.85-1.64.54-.52-.23-.82-.73-.97-1.5l-.63-3.12-.63 3.12c-.15.77-.45 1.27-.97 1.5-.67.31-1.24.06-1.64-.54l-1.78-5.73h1.23l1.26 4.57 1.26-4.57h.7l1.26 4.57 1.26-4.57h1.23l-1.78 5.73z"/>
              </svg>
              dev.to/edwardkubiak
            </a>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="print:hidden inline-flex items-center gap-2 px-4 py-2 border border-slate-700 text-slate-400 font-display text-xs tracking-wider uppercase rounded-lg hover:border-amber-400 hover:text-amber-400 transition-all duration-300 cursor-pointer shrink-0"
        >
          <Download size={14} />
          Download PDF
        </button>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-10 p-6 rounded-xl border border-slate-800/60 bg-slate-900/30"
      >
        <h2 className="font-display text-xs tracking-[0.3em] text-slate-500 uppercase mb-3">
          Summary
        </h2>
        <p className="text-slate-300 leading-relaxed">
          AI systems engineer and full stack developer who builds developer tooling and multi-agent frameworks. Creator of CAST v4.6 — a local-first, open-source 17-agent framework for Claude Code distributed as 9 modular Homebrew packages — and Forge, a native macOS terminal built around Claude Code with Tauri + React 19. Ships and maintains five production web applications at META Solutions serving 4,200+ users across 900+ Ohio school districts.
        </p>
      </motion.div>

      {/* Skills grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8"
      >
        <h2 className="font-display text-xs tracking-[0.3em] text-slate-500 uppercase mb-4">
          Skills
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {Object.entries(skills).map(([category, items], i) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="p-5 rounded-xl border border-slate-800/60 bg-slate-900/30"
            >
              <h3
                className={`font-display text-sm font-bold tracking-wider mb-3 ${labelColors[category]}`}
              >
                {category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {items.map((skill) => (
                  <span
                    key={skill}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-display tracking-wider ${skillColors[category]}`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Experience */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        className="mt-8"
      >
        <h2 className="font-display text-xs tracking-[0.3em] text-slate-500 uppercase mb-4">
          Experience
        </h2>
        {experience.map((job) => (
          <div
            key={job.company}
            className="p-6 rounded-xl border border-slate-800/60 bg-slate-900/30"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-100">
                  {job.role}
                </h3>
                <p className="text-amber-400 text-sm font-display">
                  {job.company} &mdash; {job.location}
                </p>
              </div>
              <span className="font-display text-xs tracking-wider text-slate-500 shrink-0">
                {job.period}
              </span>
            </div>
            <ul className="space-y-3">
              {job.highlights.map((h, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="text-sm text-slate-300 leading-relaxed pl-4 relative"
                >
                  <span aria-hidden="true" className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-amber-400/40" />
                  {h}
                </motion.li>
              ))}
            </ul>
          </div>
        ))}
      </motion.div>

      {/* Education */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        className="mt-8 mb-8"
      >
        <h2 className="font-display text-xs tracking-[0.3em] text-slate-500 uppercase mb-4">
          Education
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {education.map((edu) => (
            <div
              key={edu.institution}
              className="p-5 rounded-xl border border-slate-800/60 bg-slate-900/30"
            >
              <h3 className="font-display text-sm font-bold text-slate-100">
                {edu.degree}
              </h3>
              <p className="text-slate-400 text-sm mt-1">{edu.institution}</p>
              <p className="font-display text-xs tracking-wider text-slate-500 mt-2">
                {edu.period}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  </div>
  );
};

export default Resume;
