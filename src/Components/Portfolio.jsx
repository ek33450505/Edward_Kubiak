import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ExternalLink, Github, Star } from "lucide-react";
import Tilt from "react-parallax-tilt";
import CardSpotlight from "./Effects/CardSpotlight";
import projects from "../data/projects";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};


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
                  <Link
                    to={`/projects/${project.slug}`}
                    className="font-display text-lg font-bold text-slate-100 hover:text-amber-400 transition-colors"
                  >
                    {project.title}
                  </Link>
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
