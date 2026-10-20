import { motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import projects from "../../data/projects";
import { CAST_STATS } from "../../data/castStats";
import { staggerItem } from "../../utils/motion";
import SectionHead from "../ui/SectionHead";
import PageWrapper from "../ui/PageWrapper";
import Reveal from "../ui/Reveal";

const TOOL_SLUGS = ["looptrip", "misfire", "attest", "tin-can"];

// Mono index label on each work card.
const idx = (n) => String(n).padStart(2, "0");

const viewport = { once: true, margin: "-60px" };
const monoLink =
  "inline-flex min-h-11 items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors";

export default function FeaturedWork() {
  const reducedMotion = useReducedMotion();
  const hover = reducedMotion ? {} : { y: -3, transition: { duration: 0.2 } };

  const flagship = projects.find((p) => p.slug === "cast-claude-agent-team");
  const tools = TOOL_SLUGS.map((s) => projects.find((p) => p.slug === s)).filter(Boolean);
  const flagshipTech = flagship ? (flagship.tech || []).slice(0, 4) : [];

  const atlas = projects.find((p) => p.slug === "compute-atlas");
  const atlasStats = atlas ? (atlas.stats || []).slice(0, 3) : [];
  const atlasTech = atlas ? (atlas.tech || []).slice(0, 5) : [];
  const citedBy = atlas ? atlas.citedBy || [] : [];

  return (
    <PageWrapper width="6xl" className="w-full pb-20 pt-4 md:pb-24">
      <Reveal as="section" aria-labelledby="featured-work-heading">
        <SectionHead index="01" title="Featured work" id="featured-work-heading" />

        {/* Compute Atlas — hero card */}
        {atlas && (
          <motion.article
            variants={staggerItem}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            transition={{ duration: 0.5, delay: 0 }}
            whileHover={hover}
            className="panel group mb-4 transition-colors duration-300 hover:border-primary/50"
          >
            <div className="panel-head">
              <span>01 · Live product</span>
              <span className="text-primary">Compute Atlas</span>
            </div>

            <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-5">
              <div className="flex flex-col lg:col-span-2">
                <h3 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground transition-colors group-hover:text-primary">
                  {atlas.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {atlas.summary}
                </p>

                <ul
                  aria-label="Compute Atlas tech"
                  className="mt-5 flex flex-wrap gap-2"
                >
                  {atlasTech.map((tag) => (
                    <li
                      key={tag}
                      className="rounded border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>

                <div
                  className="mt-5 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground"
                  role="group"
                  aria-label="Compute Atlas stats"
                >
                  {atlasStats.map((stat, i) => (
                    <span key={stat} className={i === 0 ? "text-primary tabular-nums" : "tabular-nums"}>
                      {stat}
                    </span>
                  ))}
                </div>

                {citedBy.length > 0 && (
                  <p className="mt-5 text-sm text-muted-foreground">
                    <span className="font-mono text-[11px] uppercase tracking-[0.18em]">Cited by </span>
                    {citedBy.map((c, i) => (
                      <span key={c.url}>
                        {i > 0 && <span aria-hidden="true"> · </span>}
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${c.name} (opens in new tab)`}
                          className="text-foreground underline decoration-border-strong underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
                        >
                          {c.name}
                        </a>
                      </span>
                    ))}
                  </p>
                )}

                <div className="mt-auto flex items-center gap-5 pt-6">
                  <Link
                    to={`/projects/${atlas.slug}`}
                    aria-label={`Case study: ${atlas.title}`}
                    className={`${monoLink} text-primary hover:text-foreground`}
                  >
                    Case study →
                  </Link>
                  {atlas.link && (
                    <a
                      href={atlas.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Live: ${atlas.title} site (opens in new tab)`}
                      className={`${monoLink} text-muted-foreground hover:text-foreground`}
                    >
                      Live
                      <ExternalLink size={10} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>

              <div className="lg:col-span-3">
                <picture>
                  <source srcSet="/media/compute-atlas.webp" type="image/webp" />
                  <img
                    src="/media/compute-atlas.png"
                    alt="Compute Atlas homepage: a map of U.S. data centers colored by build status"
                    width="1600"
                    height="1000"
                    loading="lazy"
                    decoding="async"
                    className="h-auto w-full rounded border border-border"
                  />
                </picture>
              </div>
            </div>
          </motion.article>
        )}

        {/* CAST — development architecture */}
        {flagship && (
          <motion.article
            variants={staggerItem}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={hover}
            className="panel group mb-4 transition-colors duration-300 hover:border-primary/50"
          >
            <div className="panel-head">
              <span>02 · Development architecture</span>
              <span className="text-primary tabular-nums">{CAST_STATS.version}</span>
            </div>

            <div className="p-6 md:p-8">
              <h3 className="font-display text-2xl font-semibold tracking-[-0.02em] text-foreground transition-colors group-hover:text-primary">
                {flagship.title}
              </h3>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {flagship.summary || flagship.description}
              </p>

              <div
                className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground"
                role="group"
                aria-label="CAST stats"
              >
                <span className="tabular-nums">{CAST_STATS.agents} Agents</span>
                <span className="tabular-nums">{CAST_STATS.tests.toLocaleString("en-US")} Tests</span>
                <span aria-hidden="true" className="text-border-strong">·</span>
                {flagshipTech.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>

              <div className="mt-6">
                <Link
                  to={`/projects/${flagship.slug}`}
                  aria-label={`View project: ${flagship.title}`}
                  className={`${monoLink} text-primary hover:text-foreground`}
                >
                  View project →
                </Link>
              </div>
            </div>
          </motion.article>
        )}

        {/* looptrip / misfire / attest / tin-can — equal-height index cards, 2×2 from md */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {tools.map((project, i) => {
            const techChips = (project.tech || []).slice(0, 3);

            return (
              <motion.article
                key={project.slug}
                variants={staggerItem}
                initial="hidden"
                whileInView="show"
                viewport={viewport}
                transition={{ duration: 0.5, delay: (i + 2) * 0.1 }}
                whileHover={hover}
                className="card-interactive group flex h-full flex-col p-6"
              >
                <span className="font-mono text-[11px] tabular-nums tracking-[0.18em] text-muted-foreground">
                  {idx(i + 3)}
                </span>

                <h3 className="font-display mt-3 text-xl font-semibold tracking-[-0.02em] text-foreground transition-colors group-hover:text-primary">
                  {project.title}
                </h3>

                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-4">
                  {project.description}
                </p>

                <div className="mt-4 font-mono text-[11px] text-muted-foreground">
                  {techChips.join(" · ")}
                </div>

                <div className="hairline mt-4" />
                <div className="mt-4 flex items-center justify-between gap-3">
                  <Link
                    to={`/projects/${project.slug}`}
                    aria-label={`View project: ${project.title}`}
                    className={`${monoLink} text-primary hover:text-foreground`}
                  >
                    View project →
                  </Link>
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Demo: ${project.title} (opens in new tab)`}
                      className={`${monoLink} text-muted-foreground hover:text-foreground`}
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
            className="inline-flex min-h-11 items-center gap-1 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-primary"
          >
            See all projects →
          </Link>
        </div>
      </Reveal>
    </PageWrapper>
  );
}
