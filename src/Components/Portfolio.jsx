import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ExternalLink, Star } from "lucide-react";
import { GithubIcon } from "./BrandIcons";
import Tilt from "react-parallax-tilt";
import CardSpotlight from "./Effects/CardSpotlight";
import projects from "../data/projects";
import { staggerContainer, staggerItem } from "../utils/motion";
import { colorMap } from "../utils/colors";
import { useGitHubStars } from "../hooks/useGitHubStars";

const filters = [
  { key: "all", label: "All" },
  { key: "featured", label: "Featured" },
  { key: "ai-engineering", label: "AI Engineering" },
  { key: "cast-ecosystem", label: "CAST Ecosystem" },
  { key: "professional", label: "Professional" },
];

function StarBadge({ owner, repo }) {
  const { stars, loading } = useGitHubStars(owner, repo);
  if (loading || stars === null) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-display tracking-wider bg-amber-400/10 text-amber-400 border border-amber-400/20">
      <Star size={10} aria-hidden="true" className="fill-amber-400" />
      {stars}
    </span>
  );
}

function ProjectCard({ project }) {
  const colors = colorMap[project.color];
  const reducedMotion = useReducedMotion();
  return (
    <motion.div key={project.title} variants={staggerItem} className="group">
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
                <project.icon size={20} aria-hidden="true" className={colors.text} />
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
                <span className="font-display text-[10px] tracking-[0.2em] text-slate-400 uppercase">
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
                  <GithubIcon size={16} aria-hidden="true" />
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

const VALID_FILTERS = new Set(["all", "featured", "ai-engineering", "cast-ecosystem", "professional"]);

function Portfolio() {
  const [searchParams] = useSearchParams();
  const initialFilter = (() => {
    const param = searchParams.get("filter");
    return param && VALID_FILTERS.has(param) ? param : "all";
  })();
  const [filter, setFilter] = useState(initialFilter);
  const tablistRef = useRef(null);

  const handleTabKeyDown = useCallback((e) => {
    const tablist = tablistRef.current;
    if (!tablist) return;
    const tabs = Array.from(tablist.querySelectorAll("[role='tab']"));
    const currentIndex = tabs.indexOf(e.currentTarget);
    let nextIndex = currentIndex;

    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    tabs[nextIndex].focus();
  }, []);

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
          ref={tablistRef}
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
              onKeyDown={handleTabKeyDown}
              role="tab"
              aria-selected={filter === key}
              aria-controls="projects-panel"
              tabIndex={filter === key ? 0 : -1}
              className={`px-4 py-2 font-display text-xs tracking-widest uppercase rounded-lg border transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 ${
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
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {filtered.length === 0 && (
              <div className="col-span-2 py-20 text-center text-slate-400 font-display text-sm tracking-wider">
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
