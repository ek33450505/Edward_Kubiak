import { motion } from "motion/react";
import { fadeUp, staggerItem } from "../utils/motion";
import { Compass, Briefcase, GitBranch } from "lucide-react";
import GetInTouch from "./ui/GetInTouch";
import PageWrapper from "./ui/PageWrapper";
import Reveal from "./ui/Reveal";
import { aggregateTech } from "../utils/aggregateTech";
import { Link } from "react-router-dom";
import projects from "../data/projects";
import { CAST_STATS, CAST_DESKTOP_STATS } from "../data/castStats";

// Static — computed once at module load, never changes at runtime
const TECH_DATA = aggregateTech();
const PROJECT_COUNT = projects.filter((p) => !p.archived).length;

const About = () => {
  return (
    <div className="min-h-page py-20">
      <PageWrapper>
        {/* Page header — mono eyebrow + Geist h1 + hairline */}
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-primary">
            About
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] text-foreground sm:text-5xl">
            About <span className="text-primary">Me</span>
          </h1>
          <div className="hairline mt-6" />
        </motion.div>

        {/* Bio cards — scroll-triggered */}
        <div className="mt-12 space-y-6">
          <Reveal as="section" aria-labelledby="about-developer" className="panel">
            <div className="panel-head">
              <span aria-hidden="true" className="tabular-nums">01 / Profile</span>
            </div>
            <div className="flex items-start gap-4 p-6 sm:p-8">
              <div className="p-2 rounded bg-primary/10 text-primary shrink-0 mt-1">
                <Briefcase size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 id="about-developer" className="font-display text-xl font-semibold tracking-[-0.02em] text-foreground mb-3">
                  The Developer
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  I&apos;m a full stack developer and AI systems engineer. Agents
                  write most of my code now. That moved the work rather than
                  removing it — the judgment, the verification and the
                  consequences all stayed put — and most of what I build is the
                  tooling that keeps that honest. There&apos;s a longer write-up
                  of the loop I actually run, and of the times the output looked
                  right and wasn&apos;t, on{" "}
                  <Link
                    to="/practice"
                    className="text-primary hover:text-foreground underline underline-offset-4 decoration-border hover:decoration-primary transition-colors"
                  >
                    How I Work With Agents
                  </Link>
                  .
                </p>

                <p className="mt-4 text-muted-foreground leading-relaxed">
                  CAST {CAST_STATS.version} is that practice made mechanical — a
                  local-first, open-source multi-agent control plane for Claude
                  Code where every agent run lands in a tamper-evident record the
                  system acts on: full-text search with{" "}
                  <code className="text-primary font-mono text-[0.92em]">cast ask</code>,
                  signed SHA-256 audit receipts with{" "}
                  <code className="text-primary font-mono text-[0.92em]">cast ledger --verify</code>,
                  pre-flight cost prediction with{" "}
                  <code className="text-primary font-mono text-[0.92em]">cast predict</code>.
                </p>

                <p className="mt-4 text-muted-foreground leading-relaxed">
                  At{" "}
                  <a
                    href="https://www.metasolutions.net/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="META Solutions (opens in new tab)"
                    className="text-primary hover:text-foreground underline underline-offset-4 decoration-border hover:decoration-primary transition-colors"
                  >
                    META Solutions
                  </a>{" "}
                  I build and own production applications serving Ohio school
                  districts: CrossCheck, the EMIS data-validation platform I was
                  hired out of a certificate program to rewrite in React and have
                  owned since; SES-Wiki, a full-stack EMIS reference built from an
                  empty directory; the public PowerSchool customization catalog;
                  and the E-Rate dashboard front end.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal as="section" aria-labelledby="about-how-i-work" className="panel">
            <div className="panel-head">
              <span aria-hidden="true" className="tabular-nums">02 / Approach</span>
            </div>
            <div className="flex items-start gap-4 p-6 sm:p-8">
              <div className="p-2 rounded bg-water/10 text-water shrink-0 mt-1">
                <Compass size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 id="about-how-i-work" className="font-display text-xl font-semibold tracking-[-0.02em] text-foreground mb-3">
                  How I Work
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  I gravitate toward teams that value craft,
                  ship iteratively, and never stop learning. I believe the best
                  software emerges from understanding the humans who depend on
                  it — not just the stack behind it.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal as="section" aria-labelledby="about-open-source" className="panel">
            <div className="panel-head">
              <span aria-hidden="true" className="tabular-nums">03 / Open source</span>
            </div>
            <div className="flex items-start gap-4 p-6 sm:p-8">
              <div className="p-2 rounded bg-primary/10 text-primary shrink-0 mt-1">
                <GitBranch size={20} aria-hidden="true" />
              </div>
              <div>
                <h2 id="about-open-source" className="font-display text-xl font-semibold tracking-[-0.02em] text-foreground mb-3">
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
                  I keep a running log of what I&apos;m building on the{" "}
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

          {/* Stack — ranked list of the most-used project tech tags */}
          {TECH_DATA.length > 0 && (
            <Reveal
              as="section"
              aria-labelledby="about-stack"
              variants={staggerItem}
              transition={{ duration: 0.5 }}
              className="panel"
            >
              <div className="panel-head">
                <span aria-hidden="true" className="tabular-nums">04 / Stack</span>
              </div>
              <div className="p-6 sm:p-8">
                <h2 id="about-stack" className="font-display text-xl font-semibold tracking-[-0.02em] text-foreground">
                  Stack
                </h2>
                <p className="mt-1 mb-6 text-sm text-muted-foreground">
                  Top <span className="tabular-nums">{TECH_DATA.length}</span> tags across <span className="tabular-nums">{PROJECT_COUNT}</span> projects, ranked by how many carry each one.
                </p>
                <ol className="space-y-3">
                  {TECH_DATA.map((t) => (
                    <li key={t.name} className="grid grid-cols-[8rem_1fr_2rem] items-center gap-4 sm:grid-cols-[12rem_1fr_2.5rem]">
                      <span className="font-mono text-sm text-foreground">{t.name}</span>
                      <span aria-hidden="true" className="h-1.5 bg-muted">
                        <span className="block h-full bg-primary" style={{ width: `${(t.count / t.fullMark) * 100}%` }} />
                      </span>
                      <span className="text-right font-mono text-sm tabular-nums text-muted-foreground">{t.count}<span className="sr-only"> projects</span></span>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>
          )}

          {/* Get in touch */}
          <GetInTouch />
        </div>
      </PageWrapper>
    </div>
  );
};

export default About;
