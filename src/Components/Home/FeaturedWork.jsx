import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import projects from "../../data/projects";
import { CAST_STATS } from "../../data/castStats";
import { staggerItem } from "../../utils/motion";
import SectionHeader from "../ui/SectionHeader";
import PageWrapper from "../ui/PageWrapper";
import Reveal from "../ui/Reveal";

const TRIO_SLUGS = ["looptrip", "misfire", "attest"];

// Mono index label — the "plate number" on each survey card.
const idx = (n) => String(n).padStart(3, "0");

export default function FeaturedWork() {
  const reducedMotion = useReducedMotion();
  const flagship = projects.find((p) => p.slug === "cast-claude-agent-team");
  const trio = TRIO_SLUGS.map((s) => projects.find((p) => p.slug === s)).filter(Boolean);

  const flagshipTech = flagship ? (flagship.tech || []).slice(0, 4) : [];

  return (
    <PageWrapper width="6xl" className="pb-20 w-full relative z-[2]">
    <Reveal as="section" aria-labelledby="featured-work-heading">
      <div className="mb-8">
        <SectionHeader id="featured-work-heading" title="Featured Work">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Selected Plates
          </span>
        </SectionHeader>
      </div>

      {/* CAST flagship — full-width plate */}
      {flagship && (
        <motion.article
          variants={staggerItem}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0 }}
          whileHover={reducedMotion ? {} : { y: -4, transition: { duration: 0.2 } }}
          className="neatline group mb-4 flex flex-col bg-card p-6 transition-colors duration-300 hover:border-primary/50 md:p-8"
        >
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[11px] tracking-[0.25em] text-muted-foreground tabular-nums">
              {idx(1)}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
              Flagship
            </span>
          </div>

          <h3 className="font-display mt-3 text-2xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
            {flagship.title}
          </h3>

          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {flagship.description}
          </p>

          <div
            className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground"
            aria-label="CAST stats"
          >
            <span className="text-primary tabular-nums">{CAST_STATS.version}</span>
            <span className="tabular-nums">{CAST_STATS.agents} Agents</span>
            <span className="tabular-nums">{CAST_STATS.tests} Tests</span>
            <span aria-hidden="true" className="text-border">·</span>
            {flagshipTech.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <Link
              to={`/projects/${flagship.slug}`}
              className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-primary transition-colors hover:text-foreground"
            >
              View plate →
            </Link>
          </div>
        </motion.article>
      )}

      {/* looptrip / misfire / attest — equal-height index cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {trio.map((project, i) => {
          const techChips = (project.tech || []).slice(0, 3);

          return (
            <motion.article
              key={project.slug}
              variants={staggerItem}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i + 1) * 0.1 }}
              whileHover={reducedMotion ? {} : { y: -4, transition: { duration: 0.2 } }}
              className="neatline group flex h-full flex-col bg-card p-6 transition-colors duration-300 hover:border-primary/50"
            >
              <span className="font-mono text-[11px] tracking-[0.25em] text-muted-foreground tabular-nums">
                {idx(i + 2)}
              </span>

              <h3 className="font-display mt-3 text-xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                {project.title}
              </h3>

              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-4">
                {project.description}
              </p>

              <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                {techChips.join(" · ")}
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
                <Link
                  to={`/projects/${project.slug}`}
                  className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-primary transition-colors hover:text-foreground"
                >
                  View plate →
                </Link>
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Live demo of ${project.title} (opens in new tab)`}
                    className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Demo
                    <ExternalLink size={10} aria-hidden="true" />
                  </a>
                )}
              </div>
            </motion.article>
          );
        })}
      </div>

      <div className="mt-6 text-right">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-primary"
        >
          See all projects →
        </Link>
      </div>
    </Reveal>
    </PageWrapper>
  );
}
