import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { fadeUp, fadeIn } from "../utils/motion";
import { ExternalLink, ArrowLeft, Lock } from "lucide-react";
import { GithubIcon } from "./BrandIcons";
import projects from "../data/projects";
import PageWrapper from "./ui/PageWrapper";
import NotFound from "./ui/NotFound";
import SectionHead from "./ui/SectionHead";
import StarBadge from "./ui/StarBadge";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

const backLinkClass =
  "inline-flex min-h-11 items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-primary";

const outLinkClass =
  "inline-flex min-h-11 items-center gap-2 rounded border border-border-strong px-4 font-mono text-xs uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary hover:text-primary";

const GROUP_LABELS = {
  flagship: "Flagship",
  tools: "AI & Claude Code Tools",
  ecosystem: "CAST Ecosystem",
  professional: "Professional",
};

// A titled console panel: mono head strip carrying the section h2, body below.
function Panel({ title, delay = 0, children }) {
  const headingId = `panel-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ delay }}
      aria-labelledby={headingId}
      className="panel mt-6"
    >
      <div className="panel-head">
        <h2 id={headingId} className="font-mono text-[11px] font-normal uppercase tracking-[0.18em]">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </motion.section>
  );
}

// Professional work is internal by default: private source, no shareable URL. Without
// this, such a project renders a detail page with no out-links and no explanation for
// their absence, which reads as an unfinished page rather than a deliberate one.
const DEFAULT_ACCESS_NOTE =
  "Internal work — the source is private and there is no public URL. The architecture and decisions are described above, and I'm glad to go deeper in conversation.";

function ProjectDetail() {
  const { slug } = useParams();
  const project = projects.find((p) => p.slug === slug);

  useDocumentMeta({
    title: project
      ? `${project.title} — Edward Kubiak`
      : "Project Not Found — Edward Kubiak",
    description: project?.summary ?? project?.description,
    canonical: project ? `/projects/${slug}/` : undefined,
    // Per-slug OG images (/og/<slug>.png) aren't generated yet — generate-og-image.mjs
    // is not wired into prebuild. Use the site OG image so cards never 404. Restore
    // `/og/${slug}.png` once per-slug OG generation is wired in.
    ogImage: project ? "/og-image.png" : undefined,
  });

  if (!project) {
    return (
      <NotFound
        heading="404"
        title="Project not found"
        message="The project you're looking for doesn't exist."
        linkLabel="Back to Projects"
        linkHref="/projects"
      />
    );
  }

  const groupLabel = GROUP_LABELS[project.group] ?? project.category;
  const hasOutLinks = Boolean(project.github || project.link);
  // Hero assets are 1600x1000 (compute-atlas is the only one today); revisit if another is added.
  const heroAlt = `${project.title} interface — interactive map view`;

  return (
    <div className="min-h-page py-20">
      <PageWrapper>
        <motion.div variants={fadeIn} initial="hidden" animate="show" className="mb-4">
          <Link to="/projects" className={backLinkClass}>
            <ArrowLeft size={14} aria-hidden="true" />
            Back to Projects
          </Link>
        </motion.div>

        {/* Header panel */}
        <motion.header variants={fadeUp} initial="hidden" animate="show" className="panel">
          <div className="panel-head">
            <span>{groupLabel}</span>
            <span className="inline-flex items-center gap-2">
              {hasOutLinks ? (
                <>
                  <span aria-hidden="true" className="status-dot text-primary" />
                  Public
                </>
              ) : (
                <>
                  <Lock size={12} aria-hidden="true" />
                  Internal — no public repo
                </>
              )}
            </span>
          </div>
          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-foreground sm:text-4xl">
                {project.title}
              </h1>
              {project.githubRepo && (
                <StarBadge owner={project.githubRepo.owner} repo={project.githubRepo.repo} />
              )}
            </div>
            {project.summary && (
              <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{project.summary}</p>
            )}

            {project.tech && project.tech.length > 0 && (
              <ul aria-label="Tech stack" className="mt-5 flex flex-wrap gap-2">
                {project.tech.map((t) => (
                  <li
                    key={t}
                    className="rounded border border-border px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            )}

            {project.stats && project.stats.length > 0 && (
              <ul
                aria-label="Stats"
                className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.12em] tabular-nums text-primary"
              >
                {project.stats.map((stat) => (
                  <li key={stat}>{stat}</li>
                ))}
              </ul>
            )}

            {hasOutLinks && (
              <div className="mt-6 flex flex-wrap gap-3">
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Source on GitHub (opens in new tab)"
                    className={outLinkClass}
                  >
                    <GithubIcon size={14} aria-hidden="true" />
                    Source
                  </a>
                )}
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Live site (opens in new tab)"
                    className={outLinkClass}
                  >
                    <ExternalLink size={14} aria-hidden="true" />
                    Live site
                  </a>
                )}
              </div>
            )}
          </div>
        </motion.header>

        {/* Hero image — showcase-only */}
        {project.heroImage && (
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.05 }} className="mt-6">
            <figure className="overflow-hidden rounded border border-border bg-card">
              <picture>
                {project.heroImageWebp && <source srcSet={project.heroImageWebp} type="image/webp" />}
                <img
                  src={project.heroImage}
                  alt={heroAlt}
                  className="block h-auto w-full"
                  loading="lazy"
                  decoding="async"
                  width="1600"
                  height="1000"
                />
              </picture>
            </figure>
          </motion.div>
        )}

        {/* Highlights — console readout (showcase-only) */}
        {project.highlights && project.highlights.length > 0 && (
          <Panel title="Readout" delay={0.1}>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-3">
              {project.highlights.map((h) => (
                // dt-first DOM order (valid <dl> semantics); flex-col-reverse keeps the value on top visually
                <div key={h.label} className="flex flex-col-reverse justify-end bg-card p-4">
                  <dt className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {h.label}
                  </dt>
                  <dd className="font-mono text-2xl tabular-nums text-foreground">{h.value}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        )}

        <Panel title="About" delay={0.1}>
          <p className="leading-relaxed text-foreground">{project.description}</p>
        </Panel>

        {/* Case study — numbered sections (showcase-only) */}
        {project.sections && project.sections.length > 0 && (
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }} className="mt-12">
            {project.sections.map((s, i) => (
              <section key={s.title} aria-labelledby={`case-${i + 1}`} className="mb-10">
                <SectionHead index={String(i + 1).padStart(2, "0")} id={`case-${i + 1}`} title={s.title} />
                <p className="max-w-3xl leading-relaxed text-foreground">{s.body}</p>
              </section>
            ))}
          </motion.div>
        )}

        {/* Cited by — external projects that use this one's data (showcase-only) */}
        {project.citedBy && project.citedBy.length > 0 && (
          <Panel title="Cited by" delay={0.2}>
            <ul className="space-y-5">
              {project.citedBy.map((c) => (
                <li key={c.url} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${c.name} (opens in new tab)`}
                    className="inline-flex min-h-11 items-center gap-2 font-display text-lg font-semibold text-foreground transition-colors hover:text-primary"
                  >
                    {c.name}
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                  <p className="leading-relaxed text-muted-foreground">{c.detail}</p>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {/* Access — stands in for the Links panel on internal work */}
        {!hasOutLinks && (
          <Panel title="Access" delay={0.3}>
            <p className="flex items-start gap-3 leading-relaxed text-muted-foreground">
              <Lock size={16} aria-hidden="true" className="mt-1 shrink-0 text-primary" />
              <span>{project.accessNote ?? DEFAULT_ACCESS_NOTE}</span>
            </p>
          </Panel>
        )}

        <motion.div variants={fadeIn} initial="hidden" animate="show" transition={{ delay: 0.4 }} className="mt-8">
          <Link to="/projects" className={backLinkClass}>
            <ArrowLeft size={14} aria-hidden="true" />
            Back to Projects
          </Link>
        </motion.div>
      </PageWrapper>
    </div>
  );
}

export default ProjectDetail;
