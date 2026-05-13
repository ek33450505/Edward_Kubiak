import { motion, useReducedMotion } from "motion/react";
import { MapPin, Briefcase, Heart, Mountain, GitBranch, Mail, Github, Linkedin, ArrowUpRight } from "lucide-react";
import UltraMap from "./UltraMap";

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
                  created CAST v7.0 — a 22-agent framework that embeds
                  specialist teams into Claude Code via hook architecture. The
                  full CAST ecosystem ships as 12 modular Homebrew packages,
                  plus a React 19 observability dashboard. 2,500+ cloners at
                  castframework.dev.
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
                  13 open-source repositories with 12 standalone Homebrew
                  packages — from agent definitions to security policy gates to
                  terminal dashboards to autonomous routines. Every component
                  works independently or together. Zero cloud, zero lock-in.
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
                    Proud father of two. I met my wife Jayne at Ohio University
                    in 2006 — twenty years later, we&apos;re still exploring
                    together.
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
                    I&apos;ve finished six 100-mile ultramarathons along with a
                    handful of 50K to 100K races over the years. Long days on
                    singletrack are where I think best. Mohican 100 is coming
                    up in late May 2026 — training is locked in. Rim to River
                    100 in October 2025 is in the books.
                  </p>
                  <UltraMap />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Get in touch */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-6 sm:p-8 rounded-xl border border-slate-800/60 bg-slate-900/30"
          >
            <div className="text-center">
              <h2 className="font-display text-xs tracking-[0.3em] text-slate-500 uppercase mb-2">
                Get in Touch
              </h2>
              <p className="text-sm text-slate-400 mb-6">
                Open to new opportunities, collaborations, and conversations about developer tooling.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <a
                href="mailto:edward.kubiak.dev@gmail.com"
                aria-label="Email Edward at edward.kubiak.dev@gmail.com"
                className="group flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-800/60 bg-slate-900/40 hover:border-amber-400/40 hover:bg-slate-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 transition-all"
              >
                <Mail size={20} className="text-amber-400 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <span className="font-display text-[10px] tracking-[0.2em] text-slate-400 group-hover:text-slate-200 uppercase">
                  Email
                </span>
              </a>

              <a
                href="https://www.linkedin.com/in/edward-kubiak/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Connect on LinkedIn (opens in new tab)"
                className="group flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-800/60 bg-slate-900/40 hover:border-sky-400/40 hover:bg-slate-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 transition-all"
              >
                <Linkedin size={20} className="text-sky-400 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <span className="font-display text-[10px] tracking-[0.2em] text-slate-400 group-hover:text-slate-200 uppercase">
                  LinkedIn
                </span>
              </a>

              <a
                href="https://github.com/ek33450505"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View Edward's GitHub profile (opens in new tab)"
                className="group flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-800/60 bg-slate-900/40 hover:border-slate-400/40 hover:bg-slate-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60 transition-all"
              >
                <Github size={20} className="text-slate-200 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <span className="font-display text-[10px] tracking-[0.2em] text-slate-400 group-hover:text-slate-200 uppercase">
                  GitHub
                </span>
              </a>

              <a
                href="https://github.com/sponsors/ek33450505"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Sponsor Edward's open source work on GitHub (opens in new tab)"
                className="group flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-800/60 bg-slate-900/40 hover:border-rose-400/40 hover:bg-slate-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 transition-all"
              >
                <Heart size={20} className="text-rose-400 group-hover:scale-110 transition-transform" aria-hidden="true" />
                <span className="font-display text-[10px] tracking-[0.2em] text-slate-400 group-hover:text-slate-200 uppercase">
                  Sponsor
                </span>
              </a>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800/60 text-center">
              <a
                href="mailto:edward.kubiak.dev@gmail.com"
                className="inline-flex items-center gap-2 font-display text-sm sm:text-base text-amber-400 hover:text-amber-300 transition-colors group"
              >
                edward.kubiak.dev@gmail.com
                <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" aria-hidden="true" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default About;
