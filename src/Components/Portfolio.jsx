import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ExternalLink, Github, Bot, Database, Globe, Terminal, BarChart3, ShoppingBag, DollarSign, Network, LayoutDashboard } from "lucide-react";
import Tilt from "react-parallax-tilt";
import CardSpotlight from "./Effects/CardSpotlight";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const projects = [
  {
    title: "CAST — Claude Agent Team",
    description:
      "29-agent specialist team embedded into Claude Code at the hook layer. Three enforcement hooks intercept every prompt — dispatching the right specialist automatically, enforcing post-write code review, and hard-blocking raw git commits. Built to make quality controls infrastructure, not habits.",
    tech: ["Claude Code", "Bash", "Hook Architecture", "Node.js"],
    icon: Network,
    color: "violet",
    category: "personal",
    featured: true,
    github: "https://github.com/ek33450505/claude-agent-team",
  },
  {
    title: "Claude Code Dashboard",
    description:
      "Real-time observability UI for CAST. Live SSE stream of agent dispatches, 30-day token burn analytics by model tier, delegation savings tracking, and per-agent memory indicators. See exactly what your AI development setup is doing — and what it's costing.",
    tech: ["React 19", "TypeScript", "Vite", "Express", "SSE", "Recharts"],
    icon: LayoutDashboard,
    color: "teal",
    category: "personal",
    featured: true,
    github: "https://github.com/ek33450505/claude-code-dashboard",
  },
  {
    title: "TARUS",
    description:
      "AI assistant I engineered from scratch with dual-LLM architecture — Claude API for cloud intelligence, Ollama for private local inference. Features real-time streaming, SQLite conversation persistence, and a React 19 + Vite frontend.",
    tech: ["React 19", "Vite", "Express", "SQLite", "Claude API", "Ollama"],
    icon: Bot,
    color: "amber",
    category: "personal",
  },
  {
    title: "TARS-Lite",
    description:
      "Zero-cloud LLM assistant — every token processed locally via Ollama. Built for developers who need AI assistance without sending proprietary code to external APIs.",
    tech: ["React", "Vite", "Ollama"],
    icon: Terminal,
    color: "sky",
    category: "personal",
  },
  {
    title: "CrossCheck",
    description:
      "Mission-critical EMIS data validation platform serving 4,200+ users across 900+ Ohio school districts. Spearheaded the complete migration from AngularJS to React, modernizing the entire frontend architecture.",
    tech: ["React", "Node.js", "Python API"],
    icon: BarChart3,
    color: "emerald",
    category: "professional",
  },
  {
    title: "SES-Wiki",
    description:
      "EMIS scenario reference tool I built from the ground up — React 19 + Express 5 with JSON data persistence, automated backups, and full test coverage via Vitest. The go-to resource for Ohio education data teams.",
    tech: ["React 19", "Vite", "Express 5", "Vitest"],
    icon: Database,
    color: "rose",
    category: "professional",
  },
  {
    title: "CWS",
    description:
      "Internal catalog platform enabling school districts to browse, request, and manage PowerSchool customizations. Streamlined a process that previously required manual email coordination.",
    tech: ["React 19", "Vite"],
    icon: ShoppingBag,
    color: "amber",
    category: "professional",
  },
  {
    title: "E-Rate Dashboard",
    description:
      "Full-stack platform for managing federal E-Rate telecom discount program data — helping districts capture funding they're entitled to. Architected as a Docker Compose monorepo with dual React frontends, a Flask API layer, and PostgreSQL.",
    tech: ["React", "Flask", "PostgreSQL", "Docker", "TypeScript", "MUI"],
    icon: DollarSign,
    color: "sky",
    category: "professional",
  },
  {
    title: "PromptBot",
    description:
      "Python CLI that transforms rough prompts into high-performance LLM instructions using structured optimization techniques. Built to systematize prompt engineering rather than rely on trial and error.",
    tech: ["Python 3.13", "Click"],
    icon: Terminal,
    color: "sky",
    github: "https://github.com/ek33450505/promptbot",
    category: "personal",
  },
  {
    title: "Run Buddy",
    description:
      "A responsive fitness landing page built with semantic HTML and CSS. One of my earliest projects showcasing front-end fundamentals.",
    tech: ["HTML", "CSS"],
    icon: Globe,
    color: "emerald",
    link: "https://ek33450505.github.io/run-buddy/",
    github: "https://github.com/ek33450505/run-buddy",
    category: "personal",
  },
  {
    title: "Recipe Search",
    description:
      "A collaborative recipe search application leveraging third-party APIs for discovering meals and ingredients.",
    tech: ["JavaScript", "API Integration"],
    icon: Globe,
    color: "rose",
    link: "https://drspookyfox.github.io/RecipeSearch/",
    github: "https://github.com/drspookyfox/RecipeSearch",
    category: "personal",
  },
];

const colorMap = {
  amber: {
    bg: "bg-amber-400/10",
    text: "text-amber-400",
    badge: "bg-amber-400/10 text-amber-400",
    spotlight: "rgba(0, 255, 194, 0.08)",
  },
  teal: {
    bg: "bg-teal-400/10",
    text: "text-teal-400",
    badge: "bg-teal-400/10 text-teal-400",
    spotlight: "rgba(45, 212, 191, 0.1)",
  },
  violet: {
    bg: "bg-violet-400/10",
    text: "text-violet-400",
    badge: "bg-violet-400/10 text-violet-400",
    spotlight: "rgba(167, 139, 250, 0.1)",
  },
  sky: {
    bg: "bg-sky-400/10",
    text: "text-sky-400",
    badge: "bg-sky-400/10 text-sky-400",
    spotlight: "rgba(56, 189, 248, 0.08)",
  },
  emerald: {
    bg: "bg-emerald-400/10",
    text: "text-emerald-400",
    badge: "bg-emerald-400/10 text-emerald-400",
    spotlight: "rgba(52, 211, 153, 0.08)",
  },
  rose: {
    bg: "bg-rose-400/10",
    text: "text-rose-400",
    badge: "bg-rose-400/10 text-rose-400",
    spotlight: "rgba(251, 113, 133, 0.08)",
  },
};

const filters = [
  { key: "all", label: "All" },
  { key: "featured", label: "Featured" },
  { key: "professional", label: "Professional" },
  { key: "personal", label: "Personal" },
];

function Portfolio() {
  const [filter, setFilter] = useState("all");

  const filtered =
    filter === "all"
      ? projects
      : filter === "featured"
      ? projects.filter((p) => p.featured)
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mt-8 flex gap-2"
        >
          {filters.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
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
          className="mt-10 grid md:grid-cols-2 gap-5"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {filtered.map((project) => {
            const colors = colorMap[project.color];
            return (
              <motion.div key={project.title} variants={cardVariants}>
                <Tilt
                  tiltMaxAngleX={6}
                  tiltMaxAngleY={6}
                  glareEnable
                  glareMaxOpacity={0.08}
                  glareColor="#00FFC2"
                  glarePosition="all"
                  glareBorderRadius="12px"
                  scale={1.02}
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
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-lg font-bold text-slate-100">
                              {project.title}
                            </h3>
                            {project.featured && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-display tracking-[0.15em] uppercase bg-amber-400/15 text-amber-400 border border-amber-400/20">
                                Featured
                              </span>
                            )}
                          </div>
                          <span className="font-display text-[10px] tracking-[0.2em] text-slate-500 uppercase">
                            {project.category}
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
                            title="Source Code"
                          >
                            <Github size={16} />
                          </a>
                        )}
                        {project.link && (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors"
                            title="Live Site"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-400 leading-relaxed mb-4">
                      {project.description}
                    </p>

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
          })}
        </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Portfolio;
