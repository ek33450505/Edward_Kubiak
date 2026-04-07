import { motion, useReducedMotion } from "motion/react";
import { MapPin, Briefcase, Heart, Mountain, GitBranch } from "lucide-react";

const About = () => {
  const reducedMotion = useReducedMotion();
  return (
    <div className="min-h-[calc(100vh-80px)] py-20">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            About <span className="text-amber-400">Me</span>
          </h1>
          <div className="mt-3 w-16 h-0.5 bg-amber-400/60" />
        </motion.div>

        {/* Bio cards — scroll-triggered */}
        <div className="mt-12 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={reducedMotion ? {} : { x: 4, transition: { duration: 0.2 } }}
            className="p-6 sm:p-8 rounded-xl border border-slate-800/60 bg-slate-900/30 hover:border-slate-700/80 transition-colors duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-amber-400/10 text-amber-400 shrink-0 mt-1">
                <Briefcase size={20} />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-slate-100 mb-3">
                  The Developer
                </h2>
                <p className="text-slate-300 leading-relaxed">
                  I&apos;m a full stack developer and AI systems engineer who
                  builds developer tooling and production applications. I
                  created CAST v4.6 — a 17-agent framework that embeds
                  specialist teams into Claude Code via hook architecture — and
                  Forge, a native macOS terminal built around Claude Code with
                  Tauri. The full CAST ecosystem ships as 9 modular Homebrew
                  packages, plus a React 19 observability dashboard.
                </p>
                <p className="mt-4 text-slate-300 leading-relaxed">
                  At{" "}
                  <a
                    href="https://www.metasolutions.net/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:text-amber-300 underline underline-offset-4 decoration-amber-400/30 hover:decoration-amber-400 transition-colors"
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.15 }}
            whileHover={reducedMotion ? {} : { x: 4, transition: { duration: 0.2 } }}
            className="p-6 sm:p-8 rounded-xl border border-slate-800/60 bg-slate-900/30 hover:border-slate-700/80 transition-colors duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-sky-400/10 text-sky-400 shrink-0 mt-1">
                <MapPin size={20} />
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.15 }}
            whileHover={reducedMotion ? {} : { x: 4, transition: { duration: 0.2 } }}
            className="p-6 sm:p-8 rounded-xl border border-slate-800/60 bg-slate-900/30 hover:border-slate-700/80 transition-colors duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-violet-400/10 text-violet-400 shrink-0 mt-1">
                <GitBranch size={20} />
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-slate-100 mb-3">
                  Open Source Builder
                </h2>
                <p className="text-slate-300 leading-relaxed">
                  I believe developer tools should be transparent, composable,
                  and owned by the people who use them. The CAST ecosystem is
                  10+ open-source repositories with 9 standalone Homebrew
                  packages — from agent definitions to security policy gates to
                  terminal dashboards. Every component works independently or
                  together. Zero cloud, zero lock-in.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5 }}
              whileHover={reducedMotion ? {} : { y: -4, transition: { duration: 0.2 } }}
              className="p-6 sm:p-8 rounded-xl border border-slate-800/60 bg-slate-900/30 hover:border-slate-700/80 transition-colors duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-rose-400/10 text-rose-400 shrink-0 mt-1">
                  <Heart size={20} />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-100 mb-3">
                    Family
                  </h2>
                  <p className="text-slate-300 leading-relaxed text-sm">
                    Proud father of two. When I&apos;m not at a keyboard, I&apos;m
                    exploring the outdoors with my kids and creating memories that
                    remind me why I do what I do.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={reducedMotion ? {} : { y: -4, transition: { duration: 0.2 } }}
              className="p-6 sm:p-8 rounded-xl border border-slate-800/60 bg-slate-900/30 hover:border-slate-700/80 transition-colors duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-emerald-400/10 text-emerald-400 shrink-0 mt-1">
                  <Mountain size={20} />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-100 mb-3">
                    Trail Runner
                  </h2>
                  <p className="text-slate-300 leading-relaxed text-sm">
                    Ultramarathon and trail runner. There&apos;s nothing like 30
                    miles of singletrack to put a stubborn bug in perspective.
                    The patience and endurance these runs demand translate
                    directly into how I approach complex problems at work.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
