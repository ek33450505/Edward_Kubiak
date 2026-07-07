import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Link, useLocation } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { GithubIcon } from "./BrandIcons";
import SectionHeader from "./ui/SectionHeader";
import IconButton from "./ui/IconButton";
import PageWrapper from "./ui/PageWrapper";
import Reveal from "./ui/Reveal";
import StarBadge from "./ui/StarBadge";
import projects from "../data/projects";
import { fadeUp, staggerContainer, staggerItem } from "../utils/motion";

const SECTIONS = [
  { key: "flagship",     title: "Flagship" },
  { key: "tools",        title: "AI & Claude Code Tools" },
  { key: "ecosystem",    title: "CAST Ecosystem" },
  { key: "professional", title: "Professional" },
];

// Continuous plate number across all rendered sections.
const ORDERED = SECTIONS.flatMap(({ key }) => projects.filter((p) => p.group === key));
const plateOf = (slug) => String(ORDERED.findIndex((p) => p.slug === slug) + 1).padStart(3, "0");

function ProjectCard({ project }) {
  const reducedMotion = useReducedMotion();
  const categoryLabel = `${project.category}${
    project.castEcosystem ? " · CAST Ecosystem" : project.aiEngineering ? " · AI Engineering" : ""
  }`;

  return (
    <motion.article
      variants={staggerItem}
      whileHover={reducedMotion ? {} : { y: -4, transition: { duration: 0.2 } }}
      className="neatline group flex h-full flex-col bg-card p-6 transition-colors duration-300 hover:border-primary/50"
    >
      {/* Plate number + status marks + out-links */}
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-[11px] tracking-[0.25em] text-muted-foreground tabular-nums">
          {plateOf(project.slug)}
        </span>
        <div className="flex items-center gap-3">
          {project.featured && (
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary">Featured</span>
          )}
          {project.castEcosystem && (
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-sepia">CAST</span>
          )}
          <div className="flex gap-1 opacity-60 transition-opacity group-hover:opacity-100">
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
      </div>

      {/* Title + star badge */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <Link
          to={`/projects/${project.slug}`}
          className="font-display text-xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary"
        >
          {project.title}
        </Link>
        {project.githubRepo && <StarBadge owner={project.githubRepo.owner} repo={project.githubRepo.repo} />}
      </div>
      <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {categoryLabel}
      </span>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
        {project.description}
      </p>

      {/* Metric stats — mono figures */}
      {project.stats && project.stats.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.15em] text-primary">
          {project.stats.map((stat) => (
            <span key={stat}>{stat}</span>
          ))}
        </div>
      )}

      {/* Tech — mono legend */}
      <div className="mt-4 border-t border-border pt-4 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
        {project.tech.join(" · ")}
      </div>
    </motion.article>
  );
}

function Portfolio() {
  const location = useLocation();

  // Scroll to hashed section when the hash changes (e.g. /projects#section-flagship)
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash]);

  return (
    <div className="min-h-[calc(100vh-80px)] py-20">
      <PageWrapper width="6xl">
        {/* Frontispiece header */}
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.28em] text-primary">
            Project Index · {ORDERED.length} Entries
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Projects
          </h1>
          <div className="mt-4 h-px w-full bg-border" />
        </motion.div>

        {/* Grouped sections */}
        <div className="mt-10 space-y-16">
          {SECTIONS.map(({ key, title }) => {
            const sectionProjects = projects.filter((p) => p.group === key);
            if (sectionProjects.length === 0) return null;
            const sectionId = `section-${key}`;
            const headingId = `heading-${key}`;
            const isFlagship = key === "flagship";

            return (
              <section id={sectionId} key={key} aria-labelledby={headingId} className="scroll-mt-24">
                <Reveal className="mb-6">
                  <SectionHeader id={headingId} as="h2" title={title} />
                </Reveal>

                <motion.div
                  className={isFlagship ? "" : "grid gap-5 md:grid-cols-2"}
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
