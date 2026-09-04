import { motion } from "motion/react";
import { Link } from "react-router-dom";
import practice from "../data/practice";
import { fadeUp, fadeIn } from "../utils/motion";
import PageWrapper from "./ui/PageWrapper";
import Reveal from "./ui/Reveal";
import Label from "./ui/Label";

// Mono plate index — survey card numbering
const idx = (n) => String(n).padStart(2, "0");

const Practice = () => {
  return (
    <div className="min-h-[calc(100vh-80px)] py-20">
      <PageWrapper>

        {/* ── Frontispiece header ─────────────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          {/* Coordinate overline — survey date stamp */}
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.28em] text-primary">
            As of {practice.updated} · 39.96°N 82.99°W
          </p>

          {/* Engraved serif H1 */}
          <h1 className="font-display text-4xl font-semibold leading-[1.06] tracking-tight text-foreground sm:text-5xl">
            How I Work With Agents
          </h1>

          {/* Lede */}
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {practice.lede}
          </p>

          {/* Hairline rule */}
          <div className="mt-5 h-px w-full bg-border" />
        </motion.div>

        {/* ── The loop ────────────────────────────────────────────────────── */}
        <div className="mt-10 space-y-4">
          {practice.loop.map((step, i) => (
            <Reveal
              key={step.id}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="neatline group bg-card p-6 transition-colors duration-300 hover:border-primary/50"
            >
              {/* Mono plate index */}
              <span
                aria-hidden="true"
                className="font-mono text-[11px] tracking-[0.25em] text-muted-foreground tabular-nums"
              >
                {idx(i + 1)}
              </span>

              {/* Step title — engraved serif */}
              <h2 className="font-display mt-2 text-xl font-semibold tracking-tight text-foreground">
                {step.title}
              </h2>

              {/* Hairline between title and body */}
              <div className="mt-4 mb-4 h-px w-full bg-border" />

              <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>

              {/* Artifact footnote — mono, visually distinct from body prose */}
              <p className="mt-4 border-t border-border pt-3 font-mono text-[11px] leading-relaxed tracking-wide text-muted-foreground">
                {step.artifact}
              </p>
            </Reveal>
          ))}
        </div>

        {/* ── Review budget ───────────────────────────────────────────────── */}
        <Reveal
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 neatline bg-card p-8"
        >
          <Label as="h2" className="mb-4">Review Budget</Label>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            {practice.reviewBudget.map((stat, i) => (
              <div key={stat.label} className="border-t border-border pt-3">
                <dt className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span className="mr-2 text-primary">{idx(i + 1)}</span>{stat.label}
                </dt>
                <dd className="font-mono text-2xl tabular-nums text-foreground">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        {/* ── Plausible is not correct — case studies ─────────────────────── */}
        <div className="mt-14">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Plausible Is Not Correct
          </h2>
          <div className="mt-4 mb-8 h-px w-full bg-border" />

          <div className="space-y-10">
            {practice.cases.map((c, i) => (
              <Reveal
                key={c.id}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="card p-8"
              >
                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                  Plate {idx(i + 1)}
                </p>
                <h3 className="mb-4 font-display text-2xl font-semibold tracking-tight text-foreground">
                  {c.title}
                </h3>

                <dl className="space-y-4">
                  <div>
                    <dt className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Symptom
                    </dt>
                    <dd className="text-sm leading-relaxed text-foreground">{c.symptom}</dd>
                  </div>
                  <div>
                    <dt className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Looked right
                    </dt>
                    <dd className="text-sm leading-relaxed text-foreground">{c.lookedRight}</dd>
                  </div>
                  <div>
                    <dt className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Actually was
                    </dt>
                    <dd className="text-sm leading-relaxed text-foreground">{c.actuallyWas}</dd>
                  </div>
                  <div>
                    <dt className="mb-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Caught by
                    </dt>
                    <dd className="text-sm leading-relaxed text-foreground">{c.caughtBy}</dd>
                  </div>
                </dl>

                <div className="mt-4 mb-4 h-px w-full bg-border" />

                <p className="text-sm leading-relaxed text-muted-foreground">{c.fix}</p>

                {/* Lesson — the payload of each case, visually emphasized */}
                <p className="mt-5 border-l-2 border-primary pl-4 font-display text-lg leading-relaxed text-foreground">
                  {c.lesson}
                </p>

                {/* Provenance footnote */}
                <p className="mt-5 font-mono text-[11px] tracking-wide text-muted-foreground">
                  {c.provenance}
                </p>
              </Reveal>
            ))}
          </div>
        </div>

        {/* ── Principles ──────────────────────────────────────────────────── */}
        <div className="mt-14">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Principles
          </h2>
          <div className="mt-4 h-px w-full bg-border" />

          <ul className="divide-y divide-border">
            {practice.principles.map((p) => (
              <li key={p.title} className="py-5">
                <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* ── See also ────────────────────────────────────────────────────── */}
        <Reveal
          as="nav"
          aria-label="See also"
          variants={fadeIn}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs tracking-wider text-muted-foreground"
        >
          <span className="uppercase tracking-[0.28em]">See also</span>
          <Link
            to="/projects"
            className="underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
          >
            Projects
          </Link>
          <Link
            to="/resume"
            className="underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
          >
            Resume
          </Link>
          <Link
            to="/about"
            className="underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
          >
            About
          </Link>
        </Reveal>

      </PageWrapper>
    </div>
  );
};

export default Practice;
