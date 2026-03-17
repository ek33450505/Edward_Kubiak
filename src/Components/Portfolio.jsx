import { useState } from "react";
import { motion } from "motion/react";
import { ExternalLink, Github, Bot, Database, Globe, Terminal, BarChart3, ShoppingBag, DollarSign } from "lucide-react";

const projects = [
  {
    title: "TARUS",
    description:
      "Dual-LLM AI assistant combining Claude and Ollama for intelligent conversation with both cloud and local model support. Features real-time streaming, conversation persistence, and a modern React UI.",
    tech: ["React 19", "Vite", "Express", "SQLite", "Claude API", "Ollama"],
    icon: Bot,
    color: "amber",
    github: "https://github.com/ek33450505",
    category: "personal",
  },
  {
    title: "TARS-Lite",
    description:
      "Privacy-first local LLM assistant powered entirely by Ollama. All processing stays on-device with no cloud dependencies.",
    tech: ["React", "Vite", "Ollama"],
    icon: Terminal,
    color: "sky",
    github: "https://github.com/ek33450505",
    category: "personal",
  },
  {
    title: "CrossCheck",
    description:
      "EMIS data validation platform serving ~4,200 users across 900+ Ohio school districts. Led the full transformation from AngularJS to React.",
    tech: ["React", "Node.js", "Python API"],
    icon: BarChart3,
    color: "emerald",
    category: "professional",
  },
  {
    title: "SES-Wiki",
    description:
      "EMIS scenario documentation and charting tool with comprehensive test coverage. Built with the latest React and Express stack.",
    tech: ["React 19", "Vite", "Express 5", "Vitest"],
    icon: Database,
    color: "rose",
    category: "professional",
  },
  {
    title: "CWS",
    description:
      "Customization Web Store — an internal platform for browsing and managing application customizations.",
    tech: ["React 19", "Vite"],
    icon: ShoppingBag,
    color: "amber",
    category: "professional",
  },
  {
    title: "E-Rate Dashboard",
    description:
      "Full-stack dashboard for managing federal E-Rate telecom discount program data. Docker Compose monorepo with dual React frontends, Flask API, and PostgreSQL database.",
    tech: ["React", "Flask", "PostgreSQL", "Docker", "TypeScript", "MUI"],
    icon: DollarSign,
    color: "sky",
    category: "professional",
  },
  {
    title: "PromptBot",
    description:
      "CLI tool for optimizing LLM prompts. Takes raw prompts and refines them using structured techniques for better AI output.",
    tech: ["Python 3.13", "Click"],
    icon: Terminal,
    color: "sky",
    github: "https://github.com/ek33450505",
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
    category: "personal",
  },
];

const colorMap = {
  amber: {
    bg: "bg-amber-400/10",
    text: "text-amber-400",
    badge: "bg-amber-400/10 text-amber-400",
  },
  sky: {
    bg: "bg-sky-400/10",
    text: "text-sky-400",
    badge: "bg-sky-400/10 text-sky-400",
  },
  emerald: {
    bg: "bg-emerald-400/10",
    text: "text-emerald-400",
    badge: "bg-emerald-400/10 text-emerald-400",
  },
  rose: {
    bg: "bg-rose-400/10",
    text: "text-rose-400",
    badge: "bg-rose-400/10 text-rose-400",
  },
};

const filters = [
  { key: "all", label: "All" },
  { key: "personal", label: "Personal" },
  { key: "professional", label: "Professional" },
];

function Portfolio() {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all"
    ? projects
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
        <div className="mt-10 grid md:grid-cols-2 gap-5">
          {filtered.map((project, i) => {
            const colors = colorMap[project.color];
            return (
              <motion.div
                key={project.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                className="group p-6 rounded-xl border border-slate-800/60 bg-slate-900/30 hover:bg-slate-800/30 hover:border-slate-700 transition-all duration-300"
              >
                {/* Icon + title */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <project.icon size={20} className={colors.text} />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-slate-100">
                        {project.title}
                      </h3>
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
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Portfolio;
