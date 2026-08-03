import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { fadeUp, fadeIn } from "../utils/motion";
import { ExternalLink, ArrowLeft } from "lucide-react";
import { GithubIcon } from "./BrandIcons";
import projects from "../data/projects";
import PageWrapper from "./ui/PageWrapper";
import NotFound from "./ui/NotFound";
import Label from "./ui/Label";
import StarBadge from "./ui/StarBadge";
import { useDocumentMeta } from "../hooks/useDocumentMeta";

const backLinkClass =
  "inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary";

function ProjectDetail() {
  const { slug } = useParams();
  const project = projects.find((p) => p.slug === slug);

  useDocumentMeta({
    title: project
      ? `${project.title} — Edward Kubiak`
      : "Project Not Found — Edward Kubiak",
    description: project?.description,
    canonical: project ? `/projects/${slug}` : undefined,
    ogImage: project ? `/og/${slug}.png` : undefined,
  });

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

  const categoryLabel = `${project.category}${
    project.castEcosystem ? " · CAST Ecosystem" : project.aiEngineering ? " · AI Engineering" : ""
  }`;

  return (
    <div className="min-h-[calc(100vh-80px)] py-20">
      <PageWrapper>
        {/* Top back link */}
        <motion.div variants={fadeIn} initial="hidden" animate="show" className="mb-6">
          <Link to="/projects" className={backLinkClass}>
            <ArrowLeft size={14} aria-hidden="true" />
            Back to Projects
          </Link>
        </motion.div>

        {/* Hero plate */}
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <div className="neatline bg-card p-8">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              {categoryLabel}
            </p>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    {project.title}
                  </h1>
                  {project.featured && (
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary">Featured</span>
                  )}
                  {project.castEcosystem && (
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-sepia">CAST Ecosystem</span>
                  )}
                  {project.aiEngineering && !project.castEcosystem && (
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-water">AI Engineering</span>
                  )}
                  {project.githubRepo && (
                    <StarBadge owner={project.githubRepo.owner} repo={project.githubRepo.repo} />
                  )}
                </div>
              </div>

              {/* Out-links */}
              <div className="flex shrink-0 gap-2">
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View source code on GitHub (opens in new tab)"
                    className="rounded border border-border p-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
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
                    className="rounded border border-border p-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <ExternalLink size={18} aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Hero image — showcase-only */}
        {project.heroImage && (
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.05 }} className="mt-6">
            <figure className="neatline overflow-hidden bg-card">
              <img
                src={project.heroImage}
                alt={`${project.title} interface — interactive map view`}
                className="block w-full"
                loading="lazy"
                width="1200"
                height="707"
              />
            </figure>
          </motion.div>
        )}

        {/* Highlights — hairline survey readout (showcase-only) */}
        {project.highlights && project.highlights.length > 0 && (
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="mt-6 neatline bg-card p-8">
            <Label as="h2" className="mb-4">Survey Readout</Label>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
              {project.highlights.map((h, i) => (
                <div key={h.label} className="border-t border-border pt-3">
                  <dt className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    <span className="mr-2 text-primary">{String(i + 1).padStart(2, "0")}</span>{h.label}
                  </dt>
                  <dd className="font-mono text-2xl tabular-nums text-foreground">{h.value}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        )}

        {/* Description */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.1 }} className="mt-6 p-8 card">
          <Label as="h2" className="mb-4">About</Label>
          <p className="leading-relaxed text-foreground">{project.description}</p>
        </motion.div>

        {/* Case study — long-form plates (showcase-only) */}
        {project.sections && project.sections.length > 0 && (
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.2 }} className="mt-6 space-y-6">
            {project.sections.map((s, i) => (
              <section key={s.title} className="card p-8">
                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Plate {String(i + 1).padStart(2, "0")}</p>
                <h2 className="mb-3 font-display text-2xl font-semibold tracking-tight text-foreground">{s.title}</h2>
                <div className="mb-4 h-px w-full bg-border" />
                <p className="leading-relaxed text-foreground">{s.body}</p>
              </section>
            ))}
          </motion.div>
        )}

        {/* Tech stack */}
        {project.tech && project.tech.length > 0 && (
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.25 }} className="mt-6 p-8 card">
            <Label as="h2" className="mb-4">Tech Stack</Label>
            <div className="flex flex-wrap gap-2">
              {project.tech.map((t) => (
                <span
                  key={t}
                  className="rounded border border-border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Stats */}
        {project.stats && project.stats.length > 0 && (
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.3 }} className="mt-6 p-8 card">
            <Label as="h2" className="mb-4">Stats</Label>
            <div className="flex flex-wrap gap-2">
              {project.stats.map((stat) => (
                <span
                  key={stat}
                  className="rounded border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary"
                >
                  {stat}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Links panel */}
        {(project.github || project.link) && (
          <motion.div variants={fadeUp} initial="hidden" animate="show" transition={{ delay: 0.35 }} className="mt-6 p-8 card">
            <Label as="h2" className="mb-4">Links</Label>
            <div className="flex flex-wrap gap-3">
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded border border-primary px-4 py-2 font-mono text-xs uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
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
                  className="inline-flex items-center gap-2 rounded border border-primary px-4 py-2 font-mono text-xs uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <ExternalLink size={14} aria-hidden="true" />
                  Live Site
                </a>
              )}
            </div>
          </motion.div>
        )}

        {/* Back link */}
        <motion.div variants={fadeIn} initial="hidden" animate="show" transition={{ delay: 0.4 }} className="mt-10">
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
