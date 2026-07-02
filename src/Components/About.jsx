import { motion, useReducedMotion } from "motion/react";
import { fadeUp, slideInLeft, staggerItem } from "../utils/motion";
import { MapPin, Briefcase, Heart, Mountain, GitBranch } from "lucide-react";
import SectionHeader from "./ui/SectionHeader";
import GetInTouch from "./ui/GetInTouch";
import PageWrapper from "./ui/PageWrapper";
import Reveal from "./ui/Reveal";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";
import { aggregateTech } from "../utils/aggregateTech";
import { CAST_STATS, CAST_DESKTOP_STATS, CAST_ECOSYSTEM } from "../data/castStats";
import { ACCENT, SLATE_700 } from "../lib/tokens";

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
                  builds developer tooling and production applications. I
                  created CAST {CAST_STATS.version} — a {CAST_STATS.agents}-agent framework that embeds
                  specialist teams into Claude Code via hook architecture. The
                  full CAST ecosystem ships as {CAST_ECOSYSTEM.tapsPlusUmbrella}, plus cast-desktop (Tauri 2 + React
                  19) as the flagship app. castframework.dev.
                </p>
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
                  and owned by the people who use them. The CAST ecosystem is
                  14 open-source repositories distributed as {CAST_STATS.packages} modular
                  Homebrew taps plus the umbrella `cast` formula — from agent
                  definitions to security policy gates to terminal dashboards to
                  autonomous routines. That includes cast-desktop: a native
                  Tauri 2 + React 19 app ({CAST_DESKTOP_STATS.version}) that puts every CAST signal
                  in one double-click window with {CAST_DESKTOP_STATS.dashboardViews} dashboard views. Every
                  component works independently or together. Zero cloud, zero
                  lock-in.
                </p>
              </div>
            </div>
          </Reveal>

          {/* Tech Radar */}
          {(() => {
            const techData = aggregateTech();
            return techData.length > 0 ? (
              <Reveal
                variants={staggerItem}
                transition={{ duration: 0.5 }}
                className="p-6 sm:p-8 card"
              >
                <h2 className="font-display text-lg font-bold text-slate-100 mb-6">
                  Tech Radar
                </h2>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="70%"
                    data={techData}
                    aria-label="Technology radar showing most-used tech stack across projects"
                  >
                    <PolarGrid stroke={SLATE_700} />
                    <PolarAngleAxis
                      dataKey="name"
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                    />
                    <Radar
                      dataKey="count"
                      stroke={ACCENT}
                      fill={ACCENT}
                      fillOpacity={0.25}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Reveal>
            ) : null;
          })()}

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
