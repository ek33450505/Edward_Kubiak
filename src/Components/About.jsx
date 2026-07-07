import { motion, useReducedMotion } from "motion/react";
import { fadeUp, slideInLeft, staggerItem } from "../utils/motion";
import { MapPin, Briefcase, Heart, Mountain, GitBranch } from "lucide-react";
import GetInTouch from "./ui/GetInTouch";
import PageWrapper from "./ui/PageWrapper";
import Reveal from "./ui/Reveal";
import RadarChart from "./ui/RadarChart";
import { aggregateTech } from "../utils/aggregateTech";
import { Link } from "react-router-dom";
import { CAST_STATS, CAST_DESKTOP_STATS } from "../data/castStats";

// Static — computed once at module load, never changes at runtime
const TECH_DATA = aggregateTech();

// Coordinate overline — survey marker for the about page frontispiece
const OVERLINE = "39.96°N 82.99°W · COLUMBUS, OHIO · EDITION 2026";

const About = () => {
  const reducedMotion = useReducedMotion();
  return (
    <div className="min-h-[calc(100vh-80px)] py-20">
      <PageWrapper>
        {/* Frontispiece header — coord overline + engraved display h1 + hairline */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.28em] text-muted-foreground">
            {OVERLINE}
          </p>
          <h1 className="font-display text-4xl font-semibold leading-[1.06] tracking-tight text-foreground sm:text-5xl">
            About <span className="text-primary">Me</span>
          </h1>
          <div className="mt-4 h-px w-full bg-border" />
        </motion.div>

        {/* Bio cards — scroll-triggered */}
        <div className="mt-12 space-y-6">
          <Reveal
            as="div"
            variants={slideInLeft}
            margin="-60px"
            transition={{ delay: 0.1 }}
            whileHover={reducedMotion ? {} : { x: 4, transition: { duration: 0.2 } }}
            className="neatline bg-card p-6 sm:p-8 hover:border-primary/50 transition-colors duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded bg-primary/10 text-primary shrink-0 mt-1">
                <Briefcase size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground mb-3">
                  The Developer
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  I&apos;m a full stack developer and AI systems engineer who
                  builds developer tooling and production applications. My
                  flagship work is CAST {CAST_STATS.version} — a local-first,
                  open-source multi-agent framework for Claude Code where every
                  agent run lands in a tamper-evident record the system acts on:
                  full-text search with{" "}
                  <code className="text-primary font-mono text-[0.92em]">cast ask</code>,
                  signed SHA-256 audit receipts with{" "}
                  <code className="text-primary font-mono text-[0.92em]">cast ledger --verify</code>,
                  pre-flight cost prediction with{" "}
                  <code className="text-primary font-mono text-[0.92em]">cast predict</code>.
                </p>

                {/* Survey stats strip — hairline-divided tabular figures */}
                <div className="mt-5 mx-auto flex w-fit flex-wrap items-stretch divide-x divide-border border-y border-border">
                  <div className="flex flex-col gap-1 px-4 py-2">
                    <span className="font-mono text-xl font-semibold tabular-nums leading-none text-foreground">
                      {CAST_STATS.tests.toLocaleString("en-US")}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                      Tests
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 px-4 py-2">
                    <span className="font-mono text-xl font-semibold tabular-nums leading-none text-foreground">
                      {CAST_STATS.tables}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                      Tables
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 px-4 py-2">
                    <span className="font-mono text-xl font-semibold tabular-nums leading-none text-foreground">
                      {CAST_STATS.packages}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                      Packages
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 px-4 py-2">
                    <span className="font-mono text-xl font-semibold tabular-nums leading-none text-foreground">
                      {CAST_STATS.agents}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                      Agents
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-muted-foreground leading-relaxed">
                  At{" "}
                  <a
                    href="https://www.metasolutions.net/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-foreground underline underline-offset-4 decoration-border hover:decoration-primary transition-colors"
                  >
                    META Solutions
                  </a>
                  , I architect and maintain five production applications serving
                  4,200+ users across 900+ Ohio school districts — from the
                  CrossCheck data validation platform to E-Rate dashboards, EMIS
                  scenario tools, and PowerSchool customizations.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal
            as="div"
            variants={slideInLeft}
            margin="-60px"
            transition={{ delay: 0.15 }}
            whileHover={reducedMotion ? {} : { x: 4, transition: { duration: 0.2 } }}
            className="neatline bg-card p-6 sm:p-8 hover:border-primary/50 transition-colors duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded bg-water/10 text-water shrink-0 mt-1">
                <MapPin size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground mb-3">
                  Columbus, Ohio
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Based in Columbus, I gravitate toward teams that value craft,
                  ship iteratively, and never stop learning. I believe the best
                  software emerges from understanding the humans who depend on
                  it — not just the stack behind it.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal
            as="div"
            variants={slideInLeft}
            margin="-60px"
            transition={{ delay: 0.15 }}
            whileHover={reducedMotion ? {} : { x: 4, transition: { duration: 0.2 } }}
            className="neatline bg-card p-6 sm:p-8 hover:border-primary/50 transition-colors duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded bg-primary/10 text-primary shrink-0 mt-1">
                <GitBranch size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground mb-3">
                  Open Source Builder
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  I believe developer tools should be transparent, composable,
                  and owned by the people who use them. The CAST ecosystem ships
                  as {CAST_STATS.packages} Homebrew packages — the flagship
                  framework, cast-desktop ({CAST_DESKTOP_STATS.version}, a native Tauri 2 +
                  React 19 app with {CAST_DESKTOP_STATS.dashboardViews} dashboard views), the
                  Claude Code Dashboard, and standalone packages for agent
                  memory, health checks, journaling, MCP access, signed
                  receipts, and cost prediction. Alongside CAST I build
                  deterministic, zero-LLM reliability tools for agent systems:
                  misfire asks which of your rules agents actually ignore; attest
                  checks whether a claimed DONE actually landed on disk; looptrip
                  trips coordination loops at iteration 2, not on the invoice.
                  Every component works standalone. Zero cloud, zero lock-in.
                </p>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  I write about these patterns at{" "}
                  <a
                    href="https://dev.to/edwardkubiak"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-foreground underline underline-offset-4 decoration-border hover:decoration-primary transition-colors"
                    aria-label="DEV.to profile (opens in new tab)"
                  >
                    dev.to/edwardkubiak
                  </a>
                  , and keep a running log of what I&apos;m building on the{" "}
                  <Link
                    to="/now"
                    className="text-primary hover:text-foreground underline underline-offset-4 decoration-border hover:decoration-primary transition-colors"
                  >
                    now page
                  </Link>
                  .
                </p>
              </div>
            </div>
          </Reveal>

          {/* Tech Radar */}
          {TECH_DATA.length > 0 && (
            <Reveal
              variants={staggerItem}
              transition={{ duration: 0.5 }}
              className="card p-6 sm:p-8"
            >
              <h2 className="font-display text-xl font-semibold text-foreground mb-6">
                Tech Radar
              </h2>
              <RadarChart data={TECH_DATA} />
            </Reveal>
          )}

          <div className="grid sm:grid-cols-2 gap-6">
            <Reveal
              variants={staggerItem}
              transition={{ duration: 0.5 }}
              whileHover={reducedMotion ? {} : { y: -4, transition: { duration: 0.2 } }}
              className="neatline bg-card p-6 sm:p-8 hover:border-primary/50 transition-colors duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded bg-terra/10 text-terra shrink-0 mt-1">
                  <Heart size={20} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground mb-3">
                    Family
                  </h2>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    Proud father of two. I met my wife Jayne at Ohio University
                    in 2006 — twenty years later, we&apos;re still exploring
                    together.
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal
              variants={staggerItem}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={reducedMotion ? {} : { y: -4, transition: { duration: 0.2 } }}
              className="neatline bg-card p-6 sm:p-8 hover:border-primary/50 transition-colors duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded bg-primary/10 text-primary shrink-0 mt-1">
                  <Mountain size={20} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground mb-3">
                    Trail Runner
                  </h2>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    I&apos;ve finished six 100-mile ultramarathons along with a
                    handful of 50K to 100K races over the years. Long days on
                    singletrack are where I think best. Mohican 100 just ran
                    May 23-24 2026 — recap pending. Rim to River 100 in
                    October 2024 is in the books.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Get in touch */}
          <GetInTouch />
        </div>
      </PageWrapper>
    </div>
  );
};

export default About;
