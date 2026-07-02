import { motion } from "motion/react";
import { Mail, MapPin, Download, FileText } from "lucide-react";
import { fadeUp } from "../utils/motion";
import { CAST_STATS } from "../data/castStats";
import { skills, skillColors, labelColors, experience, education, printStyles } from "../data/resume";
import { LinkedinIcon, DevToIcon } from "./BrandIcons";
import Reveal from "./ui/Reveal";
import SectionHeader from "./ui/SectionHeader";
import PageWrapper from "./ui/PageWrapper";
import Label from "./ui/Label";

const Resume = () => {
  return (
    <div id="resume-print" className="min-h-[calc(100vh-80px)] py-20">
      <style>{printStyles}</style>
      <PageWrapper>
        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div>
            <SectionHeader
              as="h1"
              headingClassName="font-display text-3xl sm:text-4xl font-bold tracking-tight"
              underlineClassName="mt-3"
              title={<>Edward <span className="text-accent-400">Kubiak</span></>}
            />
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
              <a
                href="mailto:edward.kubiak.dev@gmail.com"
                className="inline-flex items-center gap-1.5 hover:text-accent-400 transition-colors"
              >
                <Mail size={14} aria-hidden="true" /> edward.kubiak.dev@gmail.com
              </a>
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} aria-hidden="true" /> Columbus, Ohio
              </span>
              <a
                href="https://www.linkedin.com/in/edward-kubiak/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-accent-400 transition-colors"
                aria-label="LinkedIn profile (opens in new tab)"
              >
                <LinkedinIcon size={14} aria-hidden="true" />
                linkedin.com/in/edward-kubiak
              </a>
              <a
                href="https://dev.to/edwardkubiak"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="DEV.to profile (opens in new tab)"
                className="inline-flex items-center gap-1.5 hover:text-accent-400 transition-colors"
              >
                <DevToIcon size={14} aria-hidden="true" />
                dev.to/edwardkubiak
              </a>
            </div>
          </div>
          <div className="flex flex-col items-start sm:items-end gap-2 shrink-0" data-print-hide>
            <a
              href="/Edward_Kubiak_Resume.pdf"
              download="Edward_Kubiak_Resume.pdf"
              aria-label="Download resume PDF"
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-700 text-slate-400 font-display text-xs tracking-wider uppercase rounded-lg hover:border-accent-400 hover:text-accent-400 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              <Download size={14} aria-hidden="true" />
              Download PDF
            </a>
            <a
              href="/CAST_Portfolio_OnePager.pdf"
              download="CAST_Portfolio_OnePager.pdf"
              aria-label="Download CAST one-pager PDF"
              className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs text-slate-400 hover:text-accent-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              <FileText size={12} aria-hidden="true" />
              CAST one-pager
            </a>
          </div>
        </motion.div>

        {/* Summary */}
        <Reveal className="mt-10 p-6 card" transition={{ duration: 0.5, delay: 0.1 }}>
          <Label as="h2" className="mb-3">Summary</Label>
          <p className="text-slate-300 leading-relaxed">
            {`AI systems engineer and full stack developer who builds developer tooling and multi-agent frameworks. Creator of CAST ${CAST_STATS.version} — a local-first, open-source ${CAST_STATS.agents}-agent framework for Claude Code distributed as ${CAST_STATS.packages} Homebrew taps plus the umbrella \`cast\` formula, with a dedicated ecosystem site at castframework.dev. Ships and maintains five production web applications at META Solutions serving 4,200+ users across 900+ Ohio school districts.`}
          </p>
        </Reveal>

        {/* Skills grid */}
        <Reveal className="mt-8" transition={{ duration: 0.5, delay: 0.1 }}>
          <Label as="h2" className="mb-3">Skills</Label>
          <div className="grid sm:grid-cols-2 gap-3">
            {Object.entries(skills).map(([category, items], i) => (
              <Reveal
                key={category}
                className="skill-card p-3.5 card"
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <h3
                  className={`font-display text-[11px] font-bold tracking-wider mb-2 ${labelColors[category]}`}
                >
                  {category}
                </h3>
                <div className="flex flex-wrap gap-1">
                  {items.map((skill) => (
                    <span
                      key={skill}
                      className={`skill-chip px-1.5 py-px rounded text-[10px] font-display tracking-wide ${skillColors[category]}`}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        {/* Experience */}
        <Reveal className="mt-8">
          <Label as="h2" className="mb-4">Experience</Label>
          {experience.map((job) => (
            <div
              key={job.company}
              className="p-6 card"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-100">
                    {job.role}
                  </h3>
                  <p className="text-accent-400 text-sm font-display">
                    {job.company} &mdash; {job.location}
                  </p>
                </div>
                <span className="font-display text-xs tracking-wider text-slate-400 shrink-0">
                  {job.period}
                </span>
              </div>
              <ul className="space-y-3">
                {job.highlights.map((h, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="text-sm text-slate-300 leading-relaxed pl-4 relative"
                  >
                    <span aria-hidden="true" className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full bg-accent-400/40" />
                    {h}
                  </motion.li>
                ))}
              </ul>
            </div>
          ))}
        </Reveal>

        {/* Education */}
        <Reveal className="mt-8 mb-8">
          <Label as="h2" className="mb-4">Education</Label>
          <div className="grid sm:grid-cols-2 gap-4">
            {education.map((edu) => (
              <div
                key={edu.institution}
                className="p-5 card"
              >
                <h3 className="font-display text-sm font-bold text-slate-100">
                  {edu.degree}
                </h3>
                <p className="text-slate-400 text-sm mt-1">{edu.institution}</p>
                <p className="font-display text-xs tracking-wider text-slate-400 mt-2">
                  {edu.period}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </PageWrapper>
    </div>
  );
};

export default Resume;
