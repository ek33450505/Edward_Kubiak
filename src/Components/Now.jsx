import { motion } from "motion/react";
import { Link } from "react-router-dom";
import now from "../data/now";
import { fadeUp, fadeIn } from "../utils/motion";
import PageWrapper from "./ui/PageWrapper";
import Reveal from "./ui/Reveal";

// Mono plate index — survey card numbering
const idx = (n) => String(n).padStart(2, "0");

const Now = () => {
  return (
    <div className="min-h-[calc(100vh-80px)] py-20">
      <PageWrapper>

        {/* ── Frontispiece header ─────────────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          {/* Coordinate overline — survey date stamp */}
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.28em] text-primary">
            As of {now.updated} · 39.96°N 82.99°W
          </p>

          {/* Engraved serif H1 */}
          <h1 className="font-display text-4xl font-semibold leading-[1.06] tracking-tight text-foreground sm:text-5xl">
            Now
          </h1>

          {/* Subtitle — retained copy */}
          <p className="mt-3 text-sm text-muted-foreground">
            What I&apos;m focused on right now &middot; Last updated{" "}
            <span className="text-foreground">{now.updated}</span>
          </p>

          {/* Hairline rule */}
          <div className="mt-5 h-px w-full bg-border" />
        </motion.div>

        {/* ── Section cards ───────────────────────────────────────────────── */}
        <div className="mt-10 space-y-4">
          {now.sections.map((section, i) => (
            <Reveal
              key={section.title}
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

              {/* Section title — engraved serif */}
              <h2 className="font-display mt-2 text-xl font-semibold tracking-tight text-foreground">
                {section.title}
              </h2>

              {/* Hairline between title and items */}
              <div className="mt-4 mb-4 h-px w-full bg-border" />

              <ul className="space-y-3">
                {section.items.map((item, j) => (
                  <li
                    key={j}
                    className="relative pl-4 text-sm leading-relaxed text-muted-foreground"
                  >
                    {/* Square survey marker — no rounded-full */}
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-[0.45em] h-2 w-2 bg-primary"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
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
            className="underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
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
          className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs tracking-wider text-muted-foreground"
        >
          <span className="uppercase tracking-[0.28em]">See also</span>
          <Link
            to="/resume"
            className="underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
          >
            Resume
          </Link>
          <Link
            to="/projects"
            className="underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
          >
            Projects
          </Link>
        </Reveal>

      </PageWrapper>
    </div>
  );
};

export default Now;
