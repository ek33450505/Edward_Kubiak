import { motion } from "motion/react";
import { Link } from "react-router-dom";
import practice from "../data/practice";
import { fadeUp, fadeIn } from "../utils/motion";
import PageWrapper from "./ui/PageWrapper";
import Reveal from "./ui/Reveal";
import SectionHead from "./ui/SectionHead";

// Mono panel index
const idx = (n) => String(n).padStart(2, "0");

const Practice = () => {
  return (
    <div className="min-h-page py-20">
      <PageWrapper>

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-primary">
            Practice · Updated <span className="tabular-nums">{practice.updated}</span>
          </p>

          <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] text-foreground sm:text-5xl">
            How I Work With Agents
          </h1>

          <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
            {practice.lede}
          </p>

          <div className="hairline mt-6" />
        </motion.div>

        {/* ── The loop ────────────────────────────────────────────────────── */}
        <div className="mt-10 space-y-4">
          {practice.loop.map((step, i) => {
            const headingId = `loop-${step.id}`;
            return (
              <Reveal
                as="section"
                key={step.id}
                aria-labelledby={headingId}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="panel"
              >
                <div className="panel-head">
                  <span aria-hidden="true" className="tabular-nums">{idx(i + 1)} /</span>
                </div>
                <div className="p-6">
                  <h2 id={headingId} className="font-display text-xl font-semibold tracking-[-0.02em] text-foreground">
                    {step.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                  <p className="mt-4 border-t border-border pt-3 font-mono text-[11px] leading-relaxed tracking-wide text-muted-foreground">
                    {step.artifact}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* ── Review budget ───────────────────────────────────────────────── */}
        <Reveal
          as="section"
          aria-labelledby="review-budget"
          transition={{ duration: 0.5, delay: 0.1 }}
          className="panel mt-6"
        >
          <div className="panel-head">
            <h2 id="review-budget" className="font-mono text-[11px] font-normal uppercase tracking-[0.18em]">
              Review Budget
            </h2>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 p-6 sm:grid-cols-4">
            {practice.reviewBudget.map((stat, i) => (
              <div key={stat.label} className="border-t border-border pt-3">
                <dt className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  <span className="mr-2 text-primary">{idx(i + 1)}</span>{stat.label}
                </dt>
                <dd className="font-mono text-2xl tabular-nums text-foreground">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        {/* ── Plausible is not correct — case studies ─────────────────────── */}
        <section aria-labelledby="plausible" className="mt-14">
          <SectionHead index="01" id="plausible" title="Plausible Is Not Correct" />

          <div className="space-y-8">
            {practice.cases.map((c, i) => (
              <Reveal
                as="article"
                key={c.id}
                aria-labelledby={`case-${c.id}`}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="panel"
              >
                <div className="panel-head">
                  <span className="tabular-nums">Case {i + 1} of {practice.cases.length}</span>
                </div>
                <div className="p-6 sm:p-8">
                  <h3 id={`case-${c.id}`} className="mb-4 font-display text-2xl font-semibold tracking-[-0.02em] text-foreground">
                    {c.title}
                  </h3>

                  <dl className="space-y-4">
                    {[
                      ["Symptom", c.symptom],
                      ["Looked right", c.lookedRight],
                      ["Actually was", c.actuallyWas],
                      ["Caught by", c.caughtBy],
                    ].map(([label, text]) => (
                      <div key={label}>
                        <dt className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          {label}
                        </dt>
                        <dd className="text-sm leading-relaxed text-foreground">{text}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="hairline mt-4 mb-4" />

                  <p className="text-sm leading-relaxed text-muted-foreground">{c.fix}</p>

                  {/* Lesson — the payload of each case, visually emphasized */}
                  <p className="mt-5 border-l-2 border-primary pl-4 text-lg leading-relaxed text-foreground">
                    {c.lesson}
                  </p>

                  <p className="mt-5 font-mono text-[11px] tracking-wide text-muted-foreground">
                    {c.provenance}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Principles ──────────────────────────────────────────────────── */}
        <section aria-labelledby="principles" className="mt-14">
          <SectionHead index="02" id="principles" title="Principles" />

          <ul className="panel divide-y divide-border">
            {practice.principles.map((p) => (
              <li key={p.title} className="px-6 py-5">
                <h3 className="font-display text-lg font-semibold tracking-[-0.02em] text-foreground">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ── See also ────────────────────────────────────────────────────── */}
        <Reveal
          as="nav"
          aria-label="See also"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 flex flex-wrap items-center gap-x-5 font-mono text-xs tracking-wider text-muted-foreground"
        >
          <span className="uppercase tracking-[0.28em]">See also</span>
          <Link
            to="/projects"
            className="inline-flex min-h-11 items-center underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
          >
            Projects
          </Link>
          <Link
            to="/resume"
            className="inline-flex min-h-11 items-center underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
          >
            Resume
          </Link>
          <Link
            to="/about"
            className="inline-flex min-h-11 items-center underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
          >
            About
          </Link>
        </Reveal>

      </PageWrapper>
    </div>
  );
};

export default Practice;
