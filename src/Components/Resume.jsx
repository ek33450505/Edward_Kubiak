import { motion } from "motion/react";
import { Mail, MapPin, Download, FileText } from "lucide-react";
import { fadeUp } from "../utils/motion";
import { skills, experience, education, printStyles, summary } from "../data/resume";
import { LinkedinIcon } from "./BrandIcons";
import Reveal from "./ui/Reveal";
import PageWrapper from "./ui/PageWrapper";
import Label from "./ui/Label";

const contactLinkClass =
  "inline-flex items-center gap-1.5 transition-colors hover:text-primary";

const Resume = () => {
  return (
    <div id="resume-print" className="min-h-[calc(100vh-80px)] py-20">
      <style>{printStyles}</style>
      <PageWrapper>
        {/* Frontispiece header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="min-w-0">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.28em] text-primary">
              Curriculum Vitae · Columbus OH
            </p>
            <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Edward Kubiak
            </h1>
            <div className="mt-4 h-px w-full bg-border" />
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <a href="mailto:edward.kubiak.dev@gmail.com" className={contactLinkClass}>
                <Mail size={14} aria-hidden="true" /> edward.kubiak.dev@gmail.com
              </a>
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} aria-hidden="true" /> Columbus, Ohio
              </span>
              <a
                href="https://www.linkedin.com/in/edward-kubiak/"
                target="_blank"
                rel="noopener noreferrer"
                className={contactLinkClass}
                aria-label="LinkedIn profile (opens in new tab)"
              >
                <LinkedinIcon size={14} aria-hidden="true" />
                linkedin.com/in/edward-kubiak
              </a>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end" data-print-hide>
            <a
              href="/Edward_Kubiak_Resume.pdf"
              download="Edward_Kubiak_Resume.pdf"
              aria-label="Download resume PDF"
              className="inline-flex items-center gap-2 rounded border border-primary px-4 py-2 font-mono text-xs uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <Download size={14} aria-hidden="true" />
              Download PDF
            </a>
            <a
              href="/CAST_Portfolio_OnePager.pdf"
              download="CAST_Portfolio_OnePager.pdf"
              aria-label="Download CAST one-pager PDF"
              className="inline-flex items-center gap-1.5 px-2 py-1.5 font-mono text-xs text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
            >
              <FileText size={12} aria-hidden="true" />
              CAST one-pager
            </a>
          </div>
        </motion.div>

        {/* Summary */}
        <Reveal className="mt-10 p-6 card" transition={{ duration: 0.5, delay: 0.1 }}>
          <Label as="h2" className="mb-3">Summary</Label>
          <p className="leading-relaxed text-foreground">{summary}</p>
        </Reveal>

        {/* Skills grid */}
        <Reveal className="mt-8" transition={{ duration: 0.5, delay: 0.1 }}>
          <Label as="h2" className="mb-3">Skills</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(skills).map(([category, items], i) => (
              <Reveal
                key={category}
                className="skill-card p-3.5 card"
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <h3 className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                  {category}
                </h3>
                <div className="flex flex-wrap gap-1">
                  {items.map((skill) => (
                    <span
                      key={skill}
                      className="skill-chip rounded border border-border px-1.5 py-px font-mono text-[10px] tracking-wide text-muted-foreground"
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
            <div key={job.company} className="p-6 card">
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">
                    {job.role}
                  </h3>
                  <p className="font-mono text-sm text-primary">
                    {job.company} &mdash; {job.location}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-xs tracking-wider text-muted-foreground">
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
                    className="relative pl-4 text-sm leading-relaxed text-foreground"
                  >
                    <span aria-hidden="true" className="absolute left-0 top-[0.5em] h-1.5 w-1.5 bg-primary" />
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
          <div className="grid gap-4 sm:grid-cols-2">
            {education.map((edu) => (
              <div key={edu.institution} className="p-5 card">
                <h3 className="font-display text-base font-semibold tracking-tight text-foreground">
                  {edu.degree}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{edu.institution}</p>
                <p className="mt-2 font-mono text-xs tracking-wider text-muted-foreground">
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
