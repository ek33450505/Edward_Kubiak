import { motion, useReducedMotion } from "motion/react";
import { fadeUp, slideInLeft, staggerItem } from "../utils/motion";
import { MapPin, Briefcase, Heart, Mountain, GitBranch } from "lucide-react";
import SectionHeader from "./ui/SectionHeader";
import GetInTouch from "./ui/GetInTouch";
import PageWrapper from "./ui/PageWrapper";
import Reveal from "./ui/Reveal";
import RadarChart from "./ui/RadarChart";
import { aggregateTech } from "../utils/aggregateTech";
import { Link } from "react-router-dom";
import { CAST_STATS, CAST_DESKTOP_STATS } from "../data/castStats";

// Static — computed once at module load, never changes at runtime
const TECH_DATA = aggregateTech();

const About = () => {
  const reducedMotion = useReducedMotion();
  return (
    <div className="min-h-[calc(100vh-80px)] py-20">
      <PageWrapper>
        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <SectionHeader
            as="h1"
            headingClassName="font-display text-3xl sm:text-4xl font-bold tracking-tight"
            underlineClassName="mt-3"
            title={<>About <span className="text-accent-400">Me</span></>}
          />
        </motion.div>

        {/* Bio cards — scroll-triggered */}
        <div className="mt-12 space-y-6">
          <Reveal
            as="div"
            variants={slideInLeft}
            margin="-60px"
            transition={{ delay: 0.1 }}
            whileHover={reducedMotion ? {} : { x: 4, transition: { duration: 0.2 } }}
            className="p-6 sm:p-8 card hover:border-slate-700/80 transition-colors duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-accent-400/10 text-accent-400 shrink-0 mt-1">
                <Briefcase size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-slate-100 mb-3">
                  The Developer
                </h2>
                <p className="text-slate-300 leading-relaxed">
                  I&apos;m a full stack developer and AI systems engineer who
                  builds developer tooling and production applications. My
                  flagship work is CAST {CAST_STATS.version} — a local-first,
                  open-source multi-agent framework for Claude Code where every
                  agent run lands in a tamper-evident record the system acts on:
                  full-text search with{" "}
                  <code className="text-accent-400/90 font-mono text-[0.92em]">cast ask</code>,
                  signed SHA-256 audit receipts with{" "}
                  <code className="text-accent-400/90 font-mono text-[0.92em]">cast ledger --verify</code>,
                  pre-flight cost prediction with{" "}
                  <code className="text-accent-400/90 font-mono text-[0.92em]">cast predict</code>.
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4">
                  <span>
                    <span className="font-display font-bold text-accent-400">{CAST_STATS.tests.toLocaleString("en-US")}</span>{" "}
                    <span className="text-slate-400 text-xs uppercase tracking-wider">tests</span>
                  </span>
                  <span>
                    <span className="font-display font-bold text-accent-400">{CAST_STATS.tables}</span>
                    <span className="text-slate-400 text-xs uppercase tracking-wider">-table record</span>
                  </span>
                  <span>
                    <span className="font-display font-bold text-accent-400">{CAST_STATS.packages}</span>{" "}
                    <span className="text-slate-400 text-xs uppercase tracking-wider">packages</span>
                  </span>
                  <span>
                    <span className="font-display font-bold text-accent-400">{CAST_STATS.agents}</span>{" "}
                    <span className="text-slate-400 text-xs uppercase tracking-wider">agents</span>
                  </span>
                </div>
                <p className="mt-4 text-slate-300 leading-relaxed">
                  At{" "}
                  <a
                    href="https://www.metasolutions.net/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-400 hover:text-accent-300 underline underline-offset-4 decoration-accent-400/30 hover:decoration-accent-400 transition-colors"
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
            className="p-6 sm:p-8 card hover:border-slate-700/80 transition-colors duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-sky-400/10 text-sky-400 shrink-0 mt-1">
                <MapPin size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-slate-100 mb-3">
                  Columbus, Ohio
                </h2>
                <p className="text-slate-300 leading-relaxed">
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
            className="p-6 sm:p-8 card hover:border-slate-700/80 transition-colors duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-violet-400/10 text-violet-400 shrink-0 mt-1">
                <GitBranch size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-slate-100 mb-3">
                  Open Source Builder
                </h2>
                <p className="text-slate-300 leading-relaxed">
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
                <p className="mt-4 text-slate-300 leading-relaxed">
                  I write about these patterns at{" "}
                  <a
                    href="https://dev.to/edwardkubiak"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-400 hover:text-accent-300 underline underline-offset-4 decoration-accent-400/30 hover:decoration-accent-400 transition-colors"
                    aria-label="DEV.to profile (opens in new tab)"
                  >
                    dev.to/edwardkubiak
                  </a>
                  , and keep a running log of what I&apos;m building on the{" "}
                  <Link
                    to="/now"
                    className="text-accent-400 hover:text-accent-300 underline underline-offset-4 decoration-accent-400/30 hover:decoration-accent-400 transition-colors"
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
              className="p-6 sm:p-8 card"
            >
              <h2 className="font-display text-lg font-bold text-slate-100 mb-6">
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
              className="p-6 sm:p-8 card hover:border-slate-700/80 transition-colors duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-rose-400/10 text-rose-400 shrink-0 mt-1">
                  <Heart size={20} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-100 mb-3">
                    Family
                  </h2>
                  <p className="text-slate-300 leading-relaxed text-sm">
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
              className="p-6 sm:p-8 card hover:border-slate-700/80 transition-colors duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-emerald-400/10 text-emerald-400 shrink-0 mt-1">
                  <Mountain size={20} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-100 mb-3">
                    Trail Runner
                  </h2>
                  <p className="text-slate-300 leading-relaxed text-sm">
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
