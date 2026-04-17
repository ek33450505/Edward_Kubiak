import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ExternalLink, Github, Star, Bot, Database, Terminal, BarChart3, ShoppingBag, DollarSign, Network, LayoutDashboard } from "lucide-react";
import Tilt from "react-parallax-tilt";
import CardSpotlight from "./Effects/CardSpotlight";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const projects = [
  {
    title: "Project Engram",
    description:
      "Persistent AI identity system. Extracts identity signals from conversations — communication style, behavioral corrections, preferences, relationship arc — compresses them with recency-weighted decay scoring, and injects a token-efficient payload at session start. Works across models, across providers. One identity. Any model. Every session.",
    tech: ["Python", "SQLite", "Bash", "Claude Code"],
    icon: Bot,
    color: "emerald",
    category: "personal",
    featured: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/project-engram",
    githubRepo: { owner: "ek33450505", repo: "project-engram" },
    stats: ["v0.6.0", "347 Tests", "4 Providers", "Named Personas", "Portable Spec", "Homebrew Install"],
  },
  {
    title: "CAST — Claude Agent Team",
    description:
      "Local-first, open-source multi-agent framework embedded into Claude Code at the hook layer. 17 specialist agents, 4 enforcement hooks, and model-driven dispatch — no routing tables, no cloud. The full ecosystem ships as 9 modular Homebrew packages: cast-agents, cast-hooks, cast-observe, cast-security, cast-dash, cast-memory, cast-parallel, Claude's Journal, and JARVIS. Install only what you need. brew tap ek33450505/cast && brew install cast",
    tech: ["Claude Code", "Bash", "Hook Architecture", "Node.js", "SQLite", "BATS"],
    icon: Network,
    color: "violet",
    category: "personal",
    featured: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/claude-agent-team",
    githubRepo: { owner: "ek33450505", repo: "claude-agent-team" },
    castEcosystem: true,
    stats: ["17 Agents", "4 Hooks", "255 Tests", "16 Commands", "9 Packages", "v4.6"],
  },
  {
    title: "Claude Code Dashboard",
    description:
      "Observability layer for CAST — a 10-page React 19 + TypeScript UI with real-time SSE activity feed, session cost tracking, per-agent scorecards, Cmd+K global search, and a privacy audit showing your cloud vs. local API ratio. 13+ Express API endpoint categories. Gracefully degrades when CAST is not installed. v1.0.0",
    tech: ["React 19", "TypeScript", "Vite", "Express", "SSE", "Recharts", "better-sqlite3"],
    icon: LayoutDashboard,
    color: "teal",
    category: "personal",
    featured: true,
    aiEngineering: true,
    castEcosystem: true,
    github: "https://github.com/ek33450505/claude-code-dashboard",
    githubRepo: { owner: "ek33450505", repo: "claude-code-dashboard" },
    link: "https://cast-site-iota.vercel.app/",
    stats: ["10 Pages", "13+ APIs", "SSE Live Feed", "v1.0.0"],
  },
  {
    title: "cast-agents",
    description:
      "Part of the open-source CAST ecosystem — install just the agents, nothing else. All 17 specialist Claude Code agents (commit, debug, review, plan, and more) distributed as a standalone Homebrew package. Mix and match CAST modules to build your own stack. brew tap ek33450505/cast-agents && brew install cast-agents",
    tech: ["Claude Code", "Bash", "Shell"],
    icon: Network,
    color: "violet",
    category: "personal",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-agents",
    githubRepo: { owner: "ek33450505", repo: "cast-agents" },
    stats: ["Open Source", "17 Agents", "Homebrew Install", "Claude Code"],
  },
  {
    title: "cast-observe",
    description:
      "Part of the open-source CAST ecosystem — install just the observability layer. Tracks session cost, agent run history, and token spend in local SQLite. Use standalone or pair with cast-dash for a full terminal monitoring stack. Also serves as the data backend for the Claude Code Dashboard. brew tap ek33450505/cast-observe && brew install cast-observe",
    tech: ["Bash", "Shell", "SQLite"],
    icon: BarChart3,
    color: "teal",
    category: "personal",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-observe",
    githubRepo: { owner: "ek33450505", repo: "cast-observe" },
    stats: ["Open Source", "Cost Tracking", "SQLite", "Homebrew Install"],
  },
  {
    title: "cast-security",
    description:
      "Part of the open-source CAST ecosystem — install just the security layer. Policy gates that hard-block dangerous operations, PII redaction, and a tamper-evident audit log of every agent action. Drop in alongside any other CAST module or use standalone. brew tap ek33450505/cast-security && brew install cast-security",
    tech: ["Bash", "Shell", "Hook Architecture"],
    icon: Terminal,
    color: "rose",
    category: "personal",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-security",
    githubRepo: { owner: "ek33450505", repo: "cast-security" },
    stats: ["Open Source", "Policy Gates", "Audit Trail", "PII Redaction"],
  },
  {
    title: "cast-hooks",
    description:
      "Part of the open-source CAST ecosystem — install just the hooks. 13 production Claude Code hook scripts: observability pipeline, safety policy gates, and agent dispatch directives. Works standalone without the full framework, fully BATS-tested. brew tap ek33450505/cast-hooks && brew install cast-hooks",
    tech: ["Bash", "Shell", "Hook Architecture", "BATS"],
    icon: Terminal,
    color: "rose",
    category: "personal",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-hooks",
    githubRepo: { owner: "ek33450505", repo: "cast-hooks" },
    stats: ["Open Source", "13 Hooks", "Observability", "Safety Gates", "Homebrew Install"],
  },
  {
    title: "cast-dash",
    description:
      "Part of the open-source CAST ecosystem — install just the terminal dashboard. An htop-style 4-panel live display built with Python + Textual showing active sessions, agent history, token spend, and hook health. Pair with cast-observe or use standalone against any cast.db. brew tap ek33450505/cast-dash && brew install cast-dash",
    tech: ["Python", "Textual", "SQLite", "Shell"],
    icon: BarChart3,
    color: "teal",
    category: "personal",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-dash",
    githubRepo: { owner: "ek33450505", repo: "cast-dash" },
    stats: ["Open Source", "4-Panel TUI", "Live Data", "SQLite", "Homebrew Install"],
  },
  {
    title: "cast-memory",
    description:
      "Part of the open-source CAST ecosystem — install just the memory layer. Persistent memory for Claude Code agents via Python, Shell, and MCP integration. Agents retain context across sessions without cloud storage. brew tap ek33450505/cast-memory && brew install cast-memory",
    tech: ["Python", "Shell", "MCP", "SQLite"],
    icon: Database,
    color: "emerald",
    category: "personal",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-memory",
    githubRepo: { owner: "ek33450505", repo: "cast-memory" },
    stats: ["Open Source", "Agent Memory", "MCP Integration", "Homebrew Install"],
  },
  {
    title: "cast-parallel",
    description:
      "Part of the open-source CAST ecosystem — parallel plan execution. Splits CAST batches across two Claude Code sessions in isolated git worktrees, then merges results automatically when both finish. brew tap ek33450505/cast-parallel && brew install cast-parallel",
    tech: ["Bash", "Shell", "Git Worktrees", "Python"],
    icon: Terminal,
    color: "sky",
    category: "personal",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-parallel",
    githubRepo: { owner: "ek33450505", repo: "cast-parallel" },
    stats: ["Open Source", "Parallel Execution", "Auto Merge", "Homebrew Install"],
  },
  {
    title: "Forge",
    description:
      "A native macOS terminal emulator built around Claude Code using Tauri v2. Features multi-tab + split pane terminals, Claude session auto-detection, command palette (Cmd+K), ghost-text suggestions, inline error annotations, CAST integration, and 6 built-in themes. Keyboard-first design with 20+ shortcuts.",
    tech: ["Tauri v2", "React 19", "TypeScript", "Rust", "xterm.js", "Zustand", "Tailwind"],
    icon: Terminal,
    color: "amber",
    category: "personal",
    featured: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/forge",
    githubRepo: { owner: "ek33450505", repo: "forge" },
    stats: ["Open Source", "Native macOS", "Claude Code Native", "6 Themes", "20+ Shortcuts"],
  },
  {
    title: "JARVIS",
    description:
      "Part of the open-source CAST ecosystem — a personal assistant framework built on 8 specialized Claude Code agents: morning briefing, email triage, calendar management, meeting prep, EOD summary, weekly report, Jira standup, and nightly backup. Automated via macOS launchd scheduling. brew tap ek33450505/jarvis && brew install jarvis",
    tech: ["Claude Code", "Bash", "Shell", "launchd"],
    icon: Bot,
    color: "sky",
    category: "personal",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/JARVIS",
    githubRepo: { owner: "ek33450505", repo: "JARVIS" },
    stats: ["Open Source", "8 PA Agents", "launchd Scheduling", "Homebrew Install"],
  },
  {
    title: "Claude's Journal",
    description:
      "Part of the open-source CAST ecosystem — session journaling for Claude Code. Gives Claude a persistent journal space for cross-session reflection, idea tracking, and evolving perspectives. brew tap ek33450505/claudes-journal && brew install claudes-journal",
    tech: ["Bash", "Shell", "Markdown"],
    icon: Terminal,
    color: "violet",
    category: "personal",
    castEcosystem: true,
    aiEngineering: true,
    github: "https://github.com/ek33450505/cast-claudes_journal",
    githubRepo: { owner: "ek33450505", repo: "cast-claudes_journal" },
    stats: ["Open Source", "Session Journaling", "Cross-Session Memory", "Homebrew Install"],
  },
  {
    title: "TARUS",
    description:
      "AI assistant I engineered from scratch with dual-LLM architecture — Claude API for cloud intelligence, Ollama for private local inference. Features real-time streaming, SQLite conversation persistence, and a React 19 + Vite frontend.",
    tech: ["React 19", "Vite", "Express", "SQLite", "Claude API", "Ollama"],
    icon: Bot,
    color: "amber",
    category: "personal",
    aiEngineering: true,
    stats: ["Private", "Dual-LLM", "Real-time Streaming", "SQLite Persistence"],
  },
  {
    title: "TARS-Lite",
    description:
      "Zero-cloud LLM assistant — every token processed locally via Ollama. Built for developers who need AI assistance without sending proprietary code to external APIs.",
    tech: ["React", "Vite", "Ollama"],
    icon: Terminal,
    color: "sky",
    category: "personal",
    aiEngineering: true,
    stats: ["Private", "100% Local", "Zero Cloud"],
  },
  {
    title: "CrossCheck",
    description:
      "Mission-critical EMIS data validation platform serving 4,200+ users across 900+ Ohio school districts. Spearheaded the complete migration from AngularJS to React, modernizing the entire frontend architecture.",
    tech: ["React", "Node.js", "Python API"],
    icon: BarChart3,
    color: "emerald",
    category: "professional",
    stats: ["4,200+ Users", "900+ Districts"],
  },
  {
    title: "SES-Wiki",
    description:
      "EMIS scenario reference tool I built from the ground up — React 19 + Express 5 with JSON data persistence, automated backups, and full test coverage via Vitest. The go-to resource for Ohio education data teams.",
    tech: ["React 19", "Vite", "Express 5", "Vitest"],
    icon: Database,
    color: "rose",
    category: "professional",
    stats: ["React 19", "Express 5", "Full Test Coverage"],
  },
  {
    title: "CWS",
    description:
      "Internal catalog platform enabling school districts to browse, request, and manage PowerSchool customizations. Streamlined a process that previously required manual email coordination.",
    tech: ["React 19", "Vite"],
    icon: ShoppingBag,
    color: "amber",
    category: "professional",
    stats: ["React 19", "Vite"],
  },
  {
    title: "E-Rate Dashboard",
    description:
      "Full-stack platform for managing federal E-Rate telecom discount program data — helping districts capture funding they're entitled to. Architected as a Docker Compose monorepo with dual React frontends, a Flask API layer, and PostgreSQL.",
    tech: ["React", "Flask", "PostgreSQL", "Docker", "TypeScript", "MUI"],
    icon: DollarSign,
    color: "sky",
    category: "professional",
    stats: ["Docker Compose", "Dual Frontend", "Flask + PostgreSQL"],
  },
  {
    title: "PromptBot",
    description:
      "Python CLI that transforms rough prompts into high-performance LLM instructions using structured optimization techniques. Built to systematize prompt engineering rather than rely on trial and error.",
    tech: ["Python 3.13", "Click"],
    icon: Terminal,
    color: "sky",
    github: "https://github.com/ek33450505/promptbot",
    githubRepo: { owner: "ek33450505", repo: "promptbot" },
    category: "personal",
    aiEngineering: true,
    stats: ["Python CLI", "Prompt Optimization"],
  },
];

const colorMap = {
  amber: {
    bg: "bg-amber-400/10",
    text: "text-amber-400",
    badge: "bg-amber-400/10 text-amber-400",
    stat: "bg-amber-400/8 text-amber-400/70 border-amber-400/15",
    spotlight: "rgba(0, 255, 194, 0.08)",
  },
  teal: {
    bg: "bg-teal-400/10",
    text: "text-teal-400",
    badge: "bg-teal-400/10 text-teal-400",
    stat: "bg-teal-400/8 text-teal-400/70 border-teal-400/15",
    spotlight: "rgba(45, 212, 191, 0.1)",
  },
  violet: {
    bg: "bg-violet-400/10",
    text: "text-violet-400",
    badge: "bg-violet-400/10 text-violet-400",
    stat: "bg-violet-400/8 text-violet-400/70 border-violet-400/15",
    spotlight: "rgba(167, 139, 250, 0.1)",
  },
  sky: {
    bg: "bg-sky-400/10",
    text: "text-sky-400",
    badge: "bg-sky-400/10 text-sky-400",
    stat: "bg-sky-400/8 text-sky-400/70 border-sky-400/15",
    spotlight: "rgba(56, 189, 248, 0.08)",
  },
  emerald: {
    bg: "bg-emerald-400/10",
    text: "text-emerald-400",
    badge: "bg-emerald-400/10 text-emerald-400",
    stat: "bg-emerald-400/8 text-emerald-400/70 border-emerald-400/15",
    spotlight: "rgba(52, 211, 153, 0.08)",
  },
  rose: {
    bg: "bg-rose-400/10",
    text: "text-rose-400",
    badge: "bg-rose-400/10 text-rose-400",
    stat: "bg-rose-400/8 text-rose-400/70 border-rose-400/15",
    spotlight: "rgba(251, 113, 133, 0.08)",
  },
};

const filters = [
  { key: "all", label: "All" },
  { key: "featured", label: "Featured" },
  { key: "ai-engineering", label: "AI Engineering" },
  { key: "cast-ecosystem", label: "CAST Ecosystem" },
  { key: "professional", label: "Professional" },
  { key: "personal", label: "Personal" },
];

let starsCache = null;
let starsCachePromise = null;

function fetchStarsMap() {
  if (starsCache !== null) return Promise.resolve(starsCache);
  if (starsCachePromise) return starsCachePromise;
  starsCachePromise = fetch("/github-stars.json")
    .then((res) => {
      if (!res.ok) throw new Error("not found");
      return res.json();
    })
    .then((data) => {
      starsCache = data;
      return data;
    })
    .catch(() => {
      starsCache = {};
      return {};
    });
  return starsCachePromise;
}

function useGitHubStars(owner, repo) {
  const [stars, setStars] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!owner || !repo) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchStarsMap()
      .then((map) => {
        if (cancelled) return;
        if (repo in map) {
          setStars(map[repo]);
          setLoading(false);
        } else {
          return fetch(`https://api.github.com/repos/${owner}/${repo}`)
            .then((res) => {
              if (!res.ok) throw new Error("API error");
              return res.json();
            })
            .then((data) => {
              if (!cancelled) {
                setStars(data.stargazers_count ?? null);
                setLoading(false);
              }
            });
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [owner, repo]);

  return { stars, loading };
}

function StarBadge({ owner, repo }) {
  const { stars, loading } = useGitHubStars(owner, repo);
  if (loading || stars === null) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-display tracking-wider bg-amber-400/10 text-amber-400 border border-amber-400/20">
      <Star size={10} className="fill-amber-400" />
      {stars}
    </span>
  );
}

function ProjectCard({ project }) {
  const colors = colorMap[project.color];
  const reducedMotion = useReducedMotion();
  return (
    <motion.div key={project.title} variants={cardVariants} className="group">
      <Tilt
        tiltMaxAngleX={reducedMotion ? 0 : 6}
        tiltMaxAngleY={reducedMotion ? 0 : 6}
        glareEnable={!reducedMotion}
        glareMaxOpacity={0.08}
        glareColor="#00FFC2"
        glarePosition="all"
        glareBorderRadius="12px"
        scale={reducedMotion ? 1 : 1.02}
        transitionSpeed={400}
      >
        <CardSpotlight
          className={`p-6 rounded-xl border bg-slate-900/30 transition-all duration-300 ${
            project.featured
              ? "border-amber-400/25 hover:border-amber-400/50 shadow-[0_0_30px_rgba(251,191,36,0.04)]"
              : "border-slate-800/60 hover:border-slate-700"
          }`}
          spotlightColor={colors.spotlight}
        >
          {/* Icon + title */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${colors.bg}`}>
                <project.icon size={20} className={colors.text} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display text-lg font-bold text-slate-100">
                    {project.title}
                  </h3>
                  {project.featured && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-display tracking-[0.15em] uppercase bg-amber-400/15 text-amber-400 border border-amber-400/20">
                      Featured
                    </span>
                  )}
                  {project.castEcosystem && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-display tracking-[0.15em] uppercase bg-violet-400/15 text-violet-400 border border-violet-400/20">
                      CAST Ecosystem
                    </span>
                  )}
                  {project.githubRepo && (
                    <StarBadge owner={project.githubRepo.owner} repo={project.githubRepo.repo} />
                  )}
                </div>
                <span className="font-display text-[10px] tracking-[0.2em] text-slate-500 uppercase">
                  {project.category}{project.castEcosystem ? " · CAST Ecosystem" : project.aiEngineering ? " · AI Engineering" : ""}
                </span>
              </div>
            </div>

            {/* Links */}
            <div className="flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors"
                  aria-label="View source code on GitHub (opens in new tab)"
                >
                  <Github size={16} aria-hidden="true" />
                </a>
              )}
              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors"
                  aria-label="View live site (opens in new tab)"
                >
                  <ExternalLink size={16} aria-hidden="true" />
                </a>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-400 leading-relaxed mb-3">
            {project.description}
          </p>

          {/* Metric stat chips */}
          {project.stats && project.stats.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {project.stats.map((stat) => (
                <span
                  key={stat}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-display tracking-wider border ${colors.stat}`}
                >
                  {stat}
                </span>
              ))}
            </div>
          )}

          {/* Tech badges */}
          <div className="flex flex-wrap gap-2">
            {project.tech.map((t) => (
              <span
                key={t}
                className={`px-2.5 py-1 rounded-md text-[11px] font-display tracking-wider ${colors.badge}`}
              >
                {t}
              </span>
            ))}
          </div>
        </CardSpotlight>
      </Tilt>
    </motion.div>
  );
}

const VALID_FILTERS = new Set(["all", "featured", "ai-engineering", "cast-ecosystem", "professional", "personal"]);

function Portfolio() {
  const [searchParams] = useSearchParams();
  const initialFilter = (() => {
    const param = searchParams.get("filter");
    return param && VALID_FILTERS.has(param) ? param : "all";
  })();
  const [filter, setFilter] = useState(initialFilter);

  const filtered =
    filter === "all"
      ? projects
      : filter === "featured"
      ? projects.filter((p) => p.featured)
      : filter === "ai-engineering"
      ? projects.filter((p) => p.aiEngineering)
      : filter === "cast-ecosystem"
      ? projects.filter((p) => p.castEcosystem)
      : projects.filter((p) => p.category === filter);

  return (
    <div className="min-h-[calc(100vh-80px)] py-20">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Projects
          </h1>
          <div className="mt-3 w-16 h-0.5 bg-amber-400/60" />
        </motion.div>

        {/* Filter tabs */}
        <motion.div
          role="tablist"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-8 flex flex-wrap gap-2"
        >
          {filters.map(({ key, label }) => (
            <button
              key={key}
              id={`tab-${key}`}
              onClick={() => setFilter(key)}
              role="tab"
              aria-selected={filter === key}
              aria-controls="projects-panel"
              className={`px-4 py-2 font-display text-xs tracking-widest uppercase rounded-lg border transition-all duration-300 cursor-pointer ${
                filter === key
                  ? "bg-amber-400 text-slate-950 border-amber-400 font-bold"
                  : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </motion.div>

        {/* Project grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            id="projects-panel"
            role="tabpanel"
            aria-labelledby={`tab-${filter}`}
            tabIndex={0}
            className="mt-10 grid md:grid-cols-2 gap-5"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {filtered.length === 0 && (
              <div className="col-span-2 py-20 text-center text-slate-500 font-display text-sm tracking-wider">
                No projects in this category yet.
              </div>
            )}
            {filtered.map((project) => (
              <ProjectCard key={project.title} project={project} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Portfolio;
