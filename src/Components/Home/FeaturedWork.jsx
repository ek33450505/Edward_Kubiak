import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import projects from "../../data/projects";
import { CAST_STATS } from "../../data/castStats";
import { getColorClasses } from "../../utils/colors";
import { fadeUp, staggerItem } from "../../utils/motion";
import SectionHeader from "../ui/SectionHeader";

export default function FeaturedWork() {
  const featuredProjects = projects.filter((p) => p.featured === true).slice(0, 3);
  // Render CAST flagship first in the bento grid
  const castProject = featuredProjects.find((p) => p.slug === "cast-claude-agent-team");
  const otherProjects = featuredProjects.filter((p) => p.slug !== "cast-claude-agent-team");
  const orderedProjects = castProject ? [castProject, ...otherProjects] : featuredProjects;

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      className="max-w-6xl mx-auto px-6 pb-20 w-full relative z-[2]"
      aria-labelledby="featured-work-heading"
    >
      <div className="mb-8">
        <SectionHeader id="featured-work-heading" title="Featured Work" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {orderedProjects.map((project, i) => {
          const isCast = project.slug === "cast-claude-agent-team";
          const iconColors = getColorClasses(project.color);
          const [iconColor] = iconColors.split(" ");
          const description = isCast
            ? project.description
            : project.description.length > 80
            ? project.description.slice(0, 80).trimEnd() + "…"
            : project.description;
          const techChips = (project.tech || []).slice(0, 3);

          return (
            <motion.div
              key={project.slug}
              variants={staggerItem}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={[
                "group flex flex-col p-6 rounded-xl border border-slate-700/30 bg-slate-900/20 backdrop-blur-sm hover:border-accent-400/30 hover:bg-slate-800/40 hover:shadow-[0_0_30px_rgba(0,255,194,0.06)] transition-all duration-300",
                isCast ? "md:col-span-2" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${iconColors} shrink-0`}>
                  <project.icon size={20} aria-hidden="true" />
                </div>
                <h3 className="font-display text-sm font-bold tracking-wide text-slate-100">
                  {project.title}
                </h3>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed flex-1 mb-4">
                {description}
              </p>

              {isCast && (
                <div className="flex flex-wrap gap-2 mb-4" aria-label="CAST stats">
                  <span className="px-2 py-0.5 rounded-full border border-accent-400/20 text-accent-400/80 text-[10px] font-display tracking-wider">
                    {CAST_STATS.version}
                  </span>
                  <span className="px-2 py-0.5 rounded-full border border-accent-400/20 text-accent-400/80 text-[10px] font-display tracking-wider">
                    {CAST_STATS.agents} agents
                  </span>
                  <span className="px-2 py-0.5 rounded-full border border-accent-400/20 text-accent-400/80 text-[10px] font-display tracking-wider">
                    {CAST_STATS.tests} tests
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 mb-4">
                {techChips.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full border border-slate-700/60 text-[10px] font-display tracking-wider text-slate-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3 mt-auto">
                <Link
                  to={`/projects/${project.slug}`}
                  className={`inline-flex items-center gap-1 font-display text-[11px] tracking-wider uppercase ${iconColor} hover:opacity-80 transition-opacity`}
                >
                  View project →
                </Link>
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Live demo of ${project.title} (opens in new tab)`}
                    className="inline-flex items-center gap-1 font-display text-[11px] tracking-wider uppercase text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    Live demo
                    <ExternalLink size={10} aria-hidden="true" />
                  </a>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 text-right">
        <Link
          to="/portfolio"
          className="inline-flex items-center gap-1 font-display text-xs tracking-wider uppercase text-slate-400 hover:text-accent-400 transition-colors"
        >
          See all projects →
        </Link>
      </div>
    </motion.section>
  );
}
