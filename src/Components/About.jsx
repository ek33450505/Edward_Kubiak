import { motion } from "motion/react";
import { MapPin, Briefcase, Heart, Mountain } from "lucide-react";

const About = () => {
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

        {/* Bio cards */}
        <div className="mt-12 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="p-6 sm:p-8 rounded-xl border border-slate-800/60 bg-slate-900/30"
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
                  I&apos;m a full stack developer who thrives at the intersection of
                  building new things and breathing life into legacy systems. My
                  day-to-day spans React, Node.js, Python, and Flask — but what
                  gets me most excited is the integration of AI into development
                  workflows. I&apos;ve built AI assistants powered by Claude API and
                  Ollama, experimented with RAG pipelines and voice synthesis, and
                  I use AI-augmented tooling daily to write better code faster.
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
                  , I architect and maintain a portfolio of production applications
                  serving thousands of users across Ohio&apos;s K-12 education
                  system — from data validation platforms and scenario reference tools
                  to E-Rate dashboards and PowerSchool customizations.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-6 sm:p-8 rounded-xl border border-slate-800/60 bg-slate-900/30"
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
                  Based in Columbus, I&apos;m drawn to collaborative teams that
                  value craft and continuous learning. I believe the best software
                  comes from understanding the people who use it — not just the
                  technology behind it.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="p-6 sm:p-8 rounded-xl border border-slate-800/60 bg-slate-900/30"
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="p-6 sm:p-8 rounded-xl border border-slate-800/60 bg-slate-900/30"
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
                    miles of singletrack to put a stubborn bug in perspective. The
                    discipline and mental endurance these runs demand carry over into
                    every aspect of my work and life.
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
