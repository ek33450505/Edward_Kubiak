import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import { ExternalLink, Star } from "lucide-react";
import { GithubIcon } from "./BrandIcons";
import SectionHeader from "./ui/SectionHeader";
import IconButton from "./ui/IconButton";
import PageWrapper from "./ui/PageWrapper";
import Tilt from "react-parallax-tilt";
import CardSpotlight from "./Effects/CardSpotlight";
import projects from "../data/projects";
import { fadeUp, staggerContainer, staggerItem } from "../utils/motion";
import { colorMap } from "../utils/colors";
import { useGitHubStars } from "../hooks/useGitHubStars";
import { ACCENT } from "../lib/tokens";

function StarBadge({ owner, repo }) {
  const { stars, loading } = useGitHubStars(owner, repo);
  if (loading || stars === null) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-display tracking-wider bg-accent-400/10 text-accent-400 border border-accent-400/20">
      <Star size={10} aria-hidden="true" className="fill-accent-400" />
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
        glareColor={ACCENT}
        glarePosition="all"
        glareBorderRadius="12px"
        scale={reducedMotion ? 1 : 1.02}
        transitionSpeed={400}
      >
        <CardSpotlight
          className={`p-6 transition-all duration-300 ${
            project.featured
              ? "rounded-xl border border-accent-400/25 bg-slate-900/30 hover:border-accent-400/50 shadow-[0_0_30px_rgba(0,255,194,0.06)]"
              : "card hover:border-slate-700"
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
                    className="font-display text-lg font-bold text-slate-100 hover:text-accent-400 transition-colors"
                  >
                    {project.title}
                  </Link>
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
                <IconButton
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  label="View source code on GitHub (opens in new tab)"
                >
                  <GithubIcon size={16} aria-hidden="true" />
                </IconButton>
              )}
              {project.link && (
                <IconButton
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  label="View live site (opens in new tab)"
                >
                  <ExternalLink size={16} aria-hidden="true" />
                </IconButton>
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

const SECTIONS = [
  { key: "flagship",     title: "Flagship" },
  { key: "tools",        title: "AI & Claude Code Tools" },
  { key: "ecosystem",    title: "CAST Ecosystem" },
  { key: "professional", title: "Professional" },
];

function Portfolio() {
  return (
    <div className="min-h-[calc(100vh-80px)] py-20">
      <PageWrapper width="6xl">
        {/* Page header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <SectionHeader
            as="h1"
            headingClassName="font-display text-3xl sm:text-4xl font-bold tracking-tight"
            underlineClassName="mt-3"
            title="Projects"
          />
        </motion.div>

        {/* Grouped sections */}
        <div className="mt-10 space-y-16">
          {SECTIONS.map(({ key, title }) => {
            const sectionProjects = projects.filter((p) => p.group === key);
            if (sectionProjects.length === 0) return null;
            const headingId = `section-${key}`;
            const isFlagship = key === "flagship";

            return (
              <section key={key} aria-labelledby={headingId}>
                <motion.div
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-60px" }}
                  className="mb-6"
                >
                  <SectionHeader id={headingId} as="h2" title={title} />
                </motion.div>

                <motion.div
                  className={isFlagship ? "" : "grid md:grid-cols-2 gap-5"}
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-60px" }}
                >
                  {sectionProjects.map((project) => (
                    <ProjectCard key={project.title} project={project} />
                  ))}
                </motion.div>
              </section>
            );
          })}
        </div>
      </PageWrapper>
    </div>
  );
}

export default Portfolio;
