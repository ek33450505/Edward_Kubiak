import { motion } from "motion/react";
import { Link } from "react-router-dom";
import now from "../data/now";
import { fadeUp, fadeIn } from "../utils/motion";
import PageWrapper from "./ui/PageWrapper";
import Reveal from "./ui/Reveal";

// Mono panel index
const idx = (n) => String(n).padStart(2, "0");

const Now = () => {
  return (
    <div className="min-h-page py-20">
      <PageWrapper>

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-primary">
            Now · Updated <span className="tabular-nums">{now.updated}</span>
          </p>

          <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] text-foreground sm:text-5xl">
            Now
          </h1>

          <p className="mt-3 text-muted-foreground">
            What I&apos;m focused on right now.
          </p>

          <div className="hairline mt-6" />
        </motion.div>

        {/* ── Section panels ──────────────────────────────────────────────── */}
        <div className="mt-10 space-y-4">
          {now.sections.map((section, i) => {
            const headingId = `now-section-${i + 1}`;
            return (
              <Reveal
                as="section"
                key={section.title}
                aria-labelledby={headingId}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="panel"
              >
                <div className="panel-head">
                  <span aria-hidden="true" className="tabular-nums">{idx(i + 1)} /</span>
                  <h2 id={headingId} className="font-mono text-[11px] font-normal uppercase tracking-[0.18em]">
                    {section.title}
                  </h2>
                </div>

                <ul className="divide-y divide-border">
                  {section.items.map((item, j) => (
                    <li key={j} className="px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            );
          })}
        </div>

        {/* ── Footer attribution ──────────────────────────────────────────── */}
        <Reveal
          as="p"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 font-mono text-xs tracking-wider text-muted-foreground"
        >
          Inspired by{" "}
          <a
            href="https://nownownow.com/about"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="nownownow.com about page (opens in new tab)"
            className="inline-flex min-h-11 items-center underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
          >
            nownownow.com
          </a>
        </Reveal>

        {/* ── See also ────────────────────────────────────────────────────── */}
        <Reveal
          as="nav"
          aria-label="See also"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-6 flex flex-wrap items-center gap-x-5 font-mono text-xs tracking-wider text-muted-foreground"
        >
          <span className="uppercase tracking-[0.28em]">See also</span>
          <Link
            to="/resume"
            className="inline-flex min-h-11 items-center underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
          >
            Resume
          </Link>
          <Link
            to="/projects"
            className="inline-flex min-h-11 items-center underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
          >
            Projects
          </Link>
          <Link
            to="/practice"
            className="inline-flex min-h-11 items-center underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
          >
            Practice
          </Link>
        </Reveal>

      </PageWrapper>
    </div>
  );
};

export default Now;
