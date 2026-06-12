import { useRef, lazy, Suspense, useEffect, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import HeroStats from "../HeroStats";
import { CAST_STATS, CAST_ECOSYSTEM } from "../../data/castStats";
import { fadeUp, staggerItem, slideInLeft } from "../../utils/motion";

// Lazy-load Three.js scene so it code-splits into its own chunk
const StarField = lazy(() => import("../Effects/StarField"));

function ScrollCue() {
  const shouldReduceMotion = useReducedMotion();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) setHidden(true);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.a
          href="#core-competencies"
          aria-label="Scroll to core competencies"
          className="mt-12 mx-auto block w-fit text-slate-400 hover:text-amber-400 transition-colors"
          initial={{ opacity: 1 }}
          animate={
            shouldReduceMotion
              ? { opacity: 1 }
              : { y: [0, 8, 0], opacity: 1 }
          }
          exit={{ opacity: 0 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={24} aria-hidden="true" />
        </motion.a>
      )}
    </AnimatePresence>
  );
}

export default function HeroSection() {
  const heroRef = useRef(null);
  const reducedMotion = useReducedMotion();

  // Parallax: hero content scrolls slower, decoration floats differently
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroTextY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const decorY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const decorRotate = useTransform(scrollYProgress, [0, 1], [0, 15]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <>
      {/* 3D Galactic starfield background — lazy-loaded */}
      <Suspense fallback={null}>
        <StarField />
      </Suspense>

      {/* Decorative grid lines */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-[1]">
        <div className="absolute top-0 left-1/4 w-px h-full bg-slate-100" />
        <div className="absolute top-0 left-2/4 w-px h-full bg-slate-100" />
        <div className="absolute top-0 left-3/4 w-px h-full bg-slate-100" />
      </div>

      {/* Hero section */}
      <section ref={heroRef} className="max-w-6xl mx-auto px-6 py-20 md:py-32 w-full relative z-[2]">
        <div className="grid md:grid-cols-12 gap-8 items-start">
          {/* Left column - main headline with parallax */}
          <motion.div className="md:col-span-7" style={{ y: heroTextY, opacity: heroOpacity }}>
            <motion.div
              variants={slideInLeft}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.6 }}
            >
              <p className="font-display text-xs tracking-[0.3em] text-amber-400 uppercase mb-4">
                Full Stack Developer & AI Engineer &mdash; Columbus, OH
              </p>
            </motion.div>

            <motion.h1
              variants={staggerItem}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.6, delay: 0.1 }}
              aria-label="Full Stack Developer & AI Systems Engineer"
              className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-tight tracking-tight"
            >
              <span aria-hidden="true">
                {reducedMotion
                  ? "Full Stack"
                  : "Full Stack".split("").map((char, i) => (
                      <motion.span
                        key={`fs-${i}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.15 + i * 0.03 }}
                      >
                        {char}
                      </motion.span>
                    ))}
              </span>
              <br aria-hidden="true" />
              <span aria-hidden="true" className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-sky-400">
                {reducedMotion
                  ? "Developer"
                  : "Developer".split("").map((char, i) => (
                      <motion.span
                        key={`dev-${i}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.45 + i * 0.04 }}
                        className="inline-block"
                      >
                        {char}
                      </motion.span>
                    ))}
              </span>
              <br aria-hidden="true" />
              <span aria-hidden="true" className="text-slate-400 text-3xl sm:text-4xl lg:text-5xl">
                & AI Systems Engineer
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-6 text-lg text-slate-400 max-w-lg leading-relaxed"
            >
              By day, I build production education technology for Ohio school
              districts at META Solutions. By night, I build open-source
              infrastructure for AI-native development — including CAST, a{" "}
              {CAST_STATS.agents}-agent framework for Claude Code distributed as{" "}
              {CAST_ECOSYSTEM.tapsPlusUmbrella}.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.6, delay: 0.95 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <Link
                to="/projects"
                className="group inline-flex items-center gap-2 px-6 py-3 bg-amber-400 text-slate-950 font-display text-sm tracking-wider uppercase font-bold rounded-lg hover:bg-amber-300 hover:shadow-[0_0_30px_rgba(0,255,194,0.3)] transition-all duration-300"
              >
                See What I&apos;ve Built
                <ArrowRight size={16} aria-hidden="true" className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="mailto:edward.kubiak.dev@gmail.com"
                className="inline-flex items-center gap-2 px-6 py-3 border border-slate-700 text-slate-300 font-display text-sm tracking-wider uppercase rounded-lg hover:border-amber-400 hover:text-amber-400 hover:shadow-[0_0_20px_rgba(0,255,194,0.1)] transition-all duration-300"
              >
                Let&apos;s Build Something
              </a>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.6, delay: 1.1 }}
              className="mt-4 flex items-center gap-2"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-display tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                Open to new opportunities
              </span>
              <a
                href="https://www.linkedin.com/in/edward-kubiak/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Connect on LinkedIn (opens in new tab)"
                className="text-xs text-slate-400 hover:text-sky-400 font-display tracking-wider transition-colors"
              >
                LinkedIn →
              </a>
            </motion.div>

            <HeroStats />

            {/* Scroll cue */}
            <ScrollCue />
          </motion.div>

          {/* Right column - decorative element with parallax */}
          <div className="md:col-span-5 hidden md:flex items-center justify-center">
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              style={{ y: decorY, rotate: decorRotate }}
              className="relative"
            >
              {/* Geometric decoration with glow */}
              <div className="w-64 h-64 lg:w-80 lg:h-80 relative">
                <div className="absolute inset-0 border border-slate-700/50 rounded-2xl rotate-6" />
                <div className="absolute inset-4 border border-amber-400/20 rounded-2xl -rotate-3" />
                <div className="absolute inset-8 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl backdrop-blur-sm flex items-center justify-center shadow-[0_0_80px_rgba(0,255,194,0.06)]">
                  <div className="text-center">
                    <motion.p
                      className="font-display text-6xl lg:text-7xl font-bold text-amber-400"
                      animate={{
                        textShadow: [
                          "0 0 20px rgba(0,255,194,0.3)",
                          "0 0 40px rgba(0,255,194,0.5)",
                          "0 0 20px rgba(0,255,194,0.3)",
                        ],
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      EK
                    </motion.p>
                    <div className="mt-2 w-12 h-0.5 bg-amber-400/40 mx-auto" />
                    <p className="mt-2 font-display text-[10px] tracking-[0.3em] text-slate-400 uppercase">
                      Since 2022
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
