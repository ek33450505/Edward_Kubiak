import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { Github, ExternalLink, ArrowLeft, Star } from "lucide-react";
import projects from "../data/projects";

const colorMap = {
  amber: {
    bg: "bg-amber-400/10",
    text: "text-amber-400",
    badge: "bg-amber-400/10 text-amber-400",
    stat: "bg-amber-400/8 text-amber-400/70 border-amber-400/15",
    border: "border-amber-400/30",
  },
  teal: {
    bg: "bg-teal-400/10",
    text: "text-teal-400",
    badge: "bg-teal-400/10 text-teal-400",
    stat: "bg-teal-400/8 text-teal-400/70 border-teal-400/15",
    border: "border-teal-400/30",
  },
  violet: {
    bg: "bg-violet-400/10",
    text: "text-violet-400",
    badge: "bg-violet-400/10 text-violet-400",
    stat: "bg-violet-400/8 text-violet-400/70 border-violet-400/15",
    border: "border-violet-400/30",
  },
  sky: {
    bg: "bg-sky-400/10",
    text: "text-sky-400",
    badge: "bg-sky-400/10 text-sky-400",
    stat: "bg-sky-400/8 text-sky-400/70 border-sky-400/15",
    border: "border-sky-400/30",
  },
  emerald: {
    bg: "bg-emerald-400/10",
    text: "text-emerald-400",
    badge: "bg-emerald-400/10 text-emerald-400",
    stat: "bg-emerald-400/8 text-emerald-400/70 border-emerald-400/15",
    border: "border-emerald-400/30",
  },
  rose: {
    bg: "bg-rose-400/10",
    text: "text-rose-400",
    badge: "bg-rose-400/10 text-rose-400",
    stat: "bg-rose-400/8 text-rose-400/70 border-rose-400/15",
    border: "border-rose-400/30",
  },
};

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

  useEffect(() => {
    if (!owner || !repo) return;
    let cancelled = false;
    fetchStarsMap().then((map) => {
      if (cancelled) return;
      if (repo in map) {
        setStars(map[repo]);
      } else {
        fetch(`https://api.github.com/repos/${owner}/${repo}`)
          .then((res) => res.ok ? res.json() : null)
          .then((data) => {
            if (!cancelled && data) setStars(data.stargazers_count ?? null);
          })
          .catch(() => {});
      }
    });
    return () => { cancelled = true; };
  }, [owner, repo]);

  return stars;
}

function StarBadge({ owner, repo }) {
  const stars = useGitHubStars(owner, repo);
  if (stars === null) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-display tracking-wider bg-amber-400/10 text-amber-400 border border-amber-400/20">
      <Star size={10} className="fill-amber-400" />
      {stars}
    </span>
  );
}

function ProjectDetail() {
  const { slug } = useParams();
  const project = projects.find((p) => p.slug === slug);

  if (!project) {
    return (
      <div className="min-h-[calc(100vh-80px)] py-20">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center py-20"
          >
            <p className="font-display text-4xl font-bold text-slate-600 mb-4">404</p>
            <h1 className="font-display text-xl font-bold text-slate-200 mb-6">Project not found</h1>
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-700 text-slate-300 font-display text-xs tracking-widest uppercase hover:border-amber-400 hover:text-amber-400 transition-all"
            >
              <ArrowLeft size={14} />
              Back to Projects
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  const colors = colorMap[project.color] || colorMap.amber;
  const IconComponent = project.icon;

  return (
    <div className="min-h-[calc(100vh-80px)] py-20">
      <div className="max-w-4xl mx-auto px-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={`p-8 rounded-xl border ${project.featured ? "border-amber-400/25" : "border-slate-800/60"} bg-slate-900/40`}>
            {/* Icon + Title */}
            <div className="flex items-start gap-4 mb-4">
              <div className={`p-3 rounded-xl ${colors.bg} shrink-0`}>
                <IconComponent size={28} className={colors.text} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-100">
                    {project.title}
                  </h1>
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
                  {project.aiEngineering && !project.castEcosystem && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-display tracking-[0.15em] uppercase bg-sky-400/15 text-sky-400 border border-sky-400/20">
                      AI Engineering
                    </span>
                  )}
                  {project.githubRepo && (
                    <StarBadge owner={project.githubRepo.owner} repo={project.githubRepo.repo} />
                  )}
                </div>
                <span className="font-display text-[10px] tracking-[0.2em] text-slate-500 uppercase">
                  {project.category}
                  {project.castEcosystem ? " · CAST Ecosystem" : project.aiEngineering ? " · AI Engineering" : ""}
                </span>
              </div>

              {/* Links */}
              <div className="flex gap-2 shrink-0">
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View source code on GitHub (opens in new tab)"
                    className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-amber-400 hover:border-amber-400/40 transition-all"
                  >
                    <Github size={18} aria-hidden="true" />
                  </a>
                )}
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View live site (opens in new tab)"
                    className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-amber-400 hover:border-amber-400/40 transition-all"
                  >
                    <ExternalLink size={18} aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 p-8 rounded-xl border border-slate-800/60 bg-slate-900/30"
        >
          <h2 className="font-display text-xs tracking-[0.3em] text-slate-500 uppercase mb-4">
            About
          </h2>
          <p className="text-slate-300 leading-relaxed">{project.description}</p>
        </motion.div>

        {/* Tech stack */}
        {project.tech && project.tech.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-6 p-8 rounded-xl border border-slate-800/60 bg-slate-900/30"
          >
            <h2 className="font-display text-xs tracking-[0.3em] text-slate-500 uppercase mb-4">
              Tech Stack
            </h2>
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
        )}

        {/* Stats */}
        {project.stats && project.stats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 p-8 rounded-xl border border-slate-800/60 bg-slate-900/30"
          >
            <h2 className="font-display text-xs tracking-[0.3em] text-slate-500 uppercase mb-4">
              Stats
            </h2>
            <div className="flex flex-wrap gap-2">
              {project.stats.map((stat) => (
                <span
                  key={stat}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-display tracking-wider border ${colors.stat}`}
                >
                  {stat}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Links panel */}
        {(project.github || project.link) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-6 p-8 rounded-xl border border-slate-800/60 bg-slate-900/30"
          >
            <h2 className="font-display text-xs tracking-[0.3em] text-slate-500 uppercase mb-4">
              Links
            </h2>
            <div className="flex flex-wrap gap-3">
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 font-display text-xs tracking-wider uppercase hover:border-amber-400 hover:text-amber-400 transition-all"
                >
                  <Github size={14} />
                  GitHub
                </a>
              )}
              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 font-display text-xs tracking-wider uppercase hover:border-amber-400 hover:text-amber-400 transition-all"
                >
                  <ExternalLink size={14} />
                  Live Site
                </a>
              )}
            </div>
          </motion.div>
        )}

        {/* Back link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10"
        >
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-slate-400 font-display text-xs tracking-widest uppercase hover:text-amber-400 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Projects
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

export default ProjectDetail;
