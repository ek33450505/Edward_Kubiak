import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Link, useLocation } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { GithubIcon } from "./BrandIcons";
import SectionHead from "./ui/SectionHead";
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

// Continuous mono index across all rendered sections.
const ORDERED = SECTIONS.flatMap(({ key }) => projects.filter((p) => p.group === key));
const indexOf = (slug) => String(ORDERED.findIndex((p) => p.slug === slug) + 1).padStart(3, "0");

const monoLink =
  "inline-flex min-h-11 items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors";

const MAX_TECH = 6;

function ProjectCard({ project, groupLabel }) {
  const reducedMotion = useReducedMotion();
  const tech = project.tech || [];
  const techChips = tech.slice(0, MAX_TECH);
  const hiddenTech = tech.length - techChips.length;

  return (
    <motion.article
      variants={staggerItem}
      whileHover={reducedMotion ? {} : { y: -3, transition: { duration: 0.2 } }}
      className="card-interactive group flex h-full flex-col"
    >
      <div className="panel-head">
        <span className="tabular-nums">{indexOf(project.slug)} · {groupLabel}</span>
        {project.featured && <span className="text-primary">Featured</span>}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="font-display text-xl font-semibold tracking-[-0.02em] text-foreground transition-colors group-hover:text-primary">
            {project.title}
          </h3>
          {project.githubRepo && <StarBadge owner={project.githubRepo.owner} repo={project.githubRepo.repo} />}
        </div>

        <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
          {project.summary ?? project.description}
        </p>

        {techChips.length > 0 && (
          <ul aria-label={`${project.title} tech`} className="mt-4 flex flex-wrap gap-2">
            {techChips.map((tag) => (
              <li
                key={tag}
                className="rounded border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
              >
                {tag}
              </li>
            ))}
            {hiddenTech > 0 && (
              <li className="rounded border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                <span aria-hidden="true">+{hiddenTech}</span>
                <span className="sr-only">{hiddenTech} more technologies</span>
              </li>
            )}
          </ul>
        )}

        {project.stats && project.stats.length > 0 && (
          <ul
            aria-label={`${project.title} stats`}
            className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.12em] tabular-nums text-primary"
          >
            {project.stats.map((stat) => (
              <li key={stat}>{stat}</li>
            ))}
          </ul>
        )}

        <div className="hairline mt-4" />
        <div className="mt-2 flex flex-wrap items-center gap-x-5">
          <Link
            to={`/projects/${project.slug}`}
            aria-label={`View project: ${project.title}`}
            className={`${monoLink} text-primary hover:text-foreground`}
          >
            View project →
          </Link>
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`GitHub: ${project.title} (opens in new tab)`}
              className={`${monoLink} text-muted-foreground hover:text-foreground`}
            >
              <GithubIcon size={12} aria-hidden="true" />
              GitHub
            </a>
          )}
          {project.link && (
            <a
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Live: ${project.title} site (opens in new tab)`}
              className={`${monoLink} text-muted-foreground hover:text-foreground`}
            >
              Live
              <ExternalLink size={10} aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function Portfolio() {
  const location = useLocation();
  const reducedMotion = useReducedMotion();

  // Scroll to hashed section when the hash changes (e.g. /projects#section-flagship)
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    }
  }, [location.hash, reducedMotion]);

  return (
    <div className="min-h-page py-20">
      <PageWrapper width="6xl">
        {/* Page header */}
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-primary">
            Work · <span className="tabular-nums">{ORDERED.length}</span> entries
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] text-foreground sm:text-5xl">
            Projects
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Shipped products, tooling, and professional work, grouped by kind.
          </p>
          <div className="hairline mt-6" />
        </motion.div>

        {/* Grouped sections */}
        <div className="mt-10 space-y-16">
          {SECTIONS.map(({ key, title }, sectionIdx) => {
            const sectionProjects = projects.filter((p) => p.group === key);
            if (sectionProjects.length === 0) return null;
            const sectionId = `section-${key}`;
            const headingId = `heading-${key}`;
            const isFlagship = key === "flagship";

            return (
              <section id={sectionId} key={key} aria-labelledby={headingId} className="scroll-mt-24">
                <Reveal>
                  <SectionHead index={String(sectionIdx + 1).padStart(2, "0")} id={headingId} title={title} />
                </Reveal>

                <motion.div
                  className={isFlagship ? "" : "grid gap-5 md:grid-cols-2"}
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-60px" }}
                >
                  {sectionProjects.map((project) => (
                    <ProjectCard key={project.title} project={project} groupLabel={title} />
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
