import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { fadeUp, fadeIn } from "../utils/motion";
import { ExternalLink, ArrowLeft, Star } from "lucide-react";
import { GithubIcon } from "./BrandIcons";
import projects from "../data/projects";
import { colorMap } from "../utils/colors";
import PageWrapper from "./ui/PageWrapper";
import NotFound from "./ui/NotFound";
import { useGitHubStars } from "../hooks/useGitHubStars";

function StarBadge({ owner, repo }) {
  const { stars } = useGitHubStars(owner, repo);
  if (stars === null) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-display tracking-wider bg-accent-400/10 text-accent-400 border border-accent-400/20">
      <Star size={10} aria-hidden="true" className="fill-accent-400" />
      {stars}
    </span>
  );
}

function ProjectDetail() {
  const { slug } = useParams();
  const project = projects.find((p) => p.slug === slug);

  useEffect(() => {
    let ogMeta = document.querySelector('meta[property="og:image"]');
    if (!ogMeta) {
      ogMeta = document.createElement('meta');
      ogMeta.setAttribute('property', 'og:image');
      document.head.appendChild(ogMeta);
    }
    ogMeta.setAttribute('content', `/og/${slug}.png`);
    return () => ogMeta.setAttribute('content', '');
  }, [slug]);

  if (!project) {
    return (
      <NotFound
        heading="404"
        message="Project not found"
        linkLabel="Back to Projects"
        linkHref="/projects"
      />
    );
  }

  const colors = colorMap[project.color] || colorMap.accent;
  const IconComponent = project.icon;

  return (
    <div className="min-h-[calc(100vh-80px)] py-20">
      <PageWrapper>
        {/* Hero */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <div className={`p-8 rounded-xl border ${project.featured ? "border-accent-400/25" : "border-slate-800/60"} bg-slate-900/40`}>
            {/* Icon + Title */}
            <div className="flex items-start gap-4 mb-4">
              <div className={`p-3 rounded-xl ${colors.bg} shrink-0`}>
                <IconComponent size={28} aria-hidden="true" className={colors.text} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-100">
                    {project.title}
                  </h1>
                  {project.featured && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-display tracking-[0.15em] uppercase bg-accent-400/15 text-accent-400 border border-accent-400/20">
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
                <span className="font-display text-[10px] tracking-[0.2em] text-slate-400 uppercase">
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
                    className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-accent-400 hover:border-accent-400/40 transition-all"
                  >
                    <GithubIcon size={18} aria-hidden="true" />
                  </a>
                )}
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View live site (opens in new tab)"
                    className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-accent-400 hover:border-accent-400/40 transition-all"
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
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.1 }}
          className="mt-6 p-8 rounded-xl border border-slate-800/60 bg-slate-900/30"
        >
          <h2 className="font-display text-xs tracking-[0.3em] text-slate-400 uppercase mb-4">
            About
          </h2>
          <p className="text-slate-300 leading-relaxed">{project.description}</p>
        </motion.div>

        {/* Tech stack */}
        {project.tech && project.tech.length > 0 && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.15 }}
            className="mt-6 p-8 rounded-xl border border-slate-800/60 bg-slate-900/30"
          >
            <h2 className="font-display text-xs tracking-[0.3em] text-slate-400 uppercase mb-4">
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
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.2 }}
            className="mt-6 p-8 rounded-xl border border-slate-800/60 bg-slate-900/30"
          >
            <h2 className="font-display text-xs tracking-[0.3em] text-slate-400 uppercase mb-4">
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
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.25 }}
            className="mt-6 p-8 rounded-xl border border-slate-800/60 bg-slate-900/30"
          >
            <h2 className="font-display text-xs tracking-[0.3em] text-slate-400 uppercase mb-4">
              Links
            </h2>
            <div className="flex flex-wrap gap-3">
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 font-display text-xs tracking-wider uppercase hover:border-accent-400 hover:text-accent-400 transition-all"
                >
                  <GithubIcon size={14} aria-hidden="true" />
                  GitHub
                </a>
              )}
              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 font-display text-xs tracking-wider uppercase hover:border-accent-400 hover:text-accent-400 transition-all"
                >
                  <ExternalLink size={14} aria-hidden="true" />
                  Live Site
                </a>
              )}
            </div>
          </motion.div>
        )}

        {/* Back link */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.3 }}
          className="mt-10"
        >
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-slate-400 font-display text-xs tracking-widest uppercase hover:text-accent-400 transition-colors"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to Projects
          </Link>
        </motion.div>
      </PageWrapper>
    </div>
  );
}

export default ProjectDetail;
