import { useRef, lazy, Suspense, useEffect, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import HeroStats from "../HeroStats";
import { CAST_STATS, CAST_ECOSYSTEM } from "../../data/castStats";
import { fadeUp, slideInLeft } from "../../utils/motion";

// Lazy-load Three.js scene so it code-splits into its own chunk.
// The module import is triggered only after an idle callback fires,
// so LCP text/CTAs get network priority over the heavy three chunk.
const CelestialScene = lazy(() => import("../Celestial/CelestialScene"));

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
          className="mt-12 mx-auto block w-fit text-slate-400 hover:text-accent-400 transition-colors"
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

  // Defer the WebGL scene mount until the browser is idle so LCP text/CTAs
  // get network and parse priority over the heavy `three` chunk.
  const [showScene, setShowScene] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && window.requestIdleCallback) {
      const id = window.requestIdleCallback(() => setShowScene(true));
      return () => window.cancelIdleCallback(id);
    } else {
      // Safari / older browsers: fall back to a short timeout
      const id = setTimeout(() => setShowScene(true), 200);
      return () => clearTimeout(id);
    }
  }, []);

  // Parallax: hero content scrolls slower when user scrolls down
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroTextY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <>
      {/* Celestial art scene background — idle-deferred; dark app background prevents flash
          until the idle callback fires, then the three chunk begins loading. */}
      {showScene && (
        <Suspense
          fallback={
            <div
              aria-hidden="true"
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 0,
                pointerEvents: "none",
                background: "#0a0f1a",
              }}
            />
          }
        >
          <CelestialScene />
        </Suspense>
      )}

      {/* Decorative grid lines */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-[1]">
        <div className="absolute top-0 left-1/4 w-px h-full bg-slate-100" />
        <div className="absolute top-0 left-2/4 w-px h-full bg-slate-100" />
        <div className="absolute top-0 left-3/4 w-px h-full bg-slate-100" />
      </div>

      {/* Hero section — position: relative explicit for motion useScroll scroll-container contract */}
      <section
        ref={heroRef}
        className="max-w-6xl mx-auto px-6 py-20 md:py-32 w-full relative z-[2]"
        style={{ position: "relative" }}
      >
        {/* Single-column fade-up group — right-column EK box removed (Direction A) */}
        <motion.div style={{ y: heroTextY, opacity: heroOpacity }}>
          {/* Kicker — delay 0s */}
          <motion.div
            variants={slideInLeft}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.6, delay: 0 }}
          >
            <p className="font-display text-xs tracking-[0.3em] text-accent-400 uppercase mb-4">
              Full Stack Developer & AI Engineer &mdash; Columbus, OH
            </p>
          </motion.div>

          {/* h1 — single fadeUp (letter-by-letter animation removed); delay 0.1s */}
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.6, delay: 0.1 }}
            aria-label="Full Stack Developer & AI Systems Engineer"
            className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-tight tracking-tight"
          >
            <span className="text-slate-100">Full Stack</span>
            <br />
            {/* text-accent-400 only — sky gradient removed (Direction A single-accent) */}
            <span className="text-accent-400">Developer</span>
            <br />
            <span className="text-slate-400 text-3xl sm:text-4xl lg:text-5xl">& AI Systems Engineer</span>
          </motion.h1>

          {/* Paragraph — delay 0.3s */}
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 text-lg text-slate-400 max-w-lg leading-relaxed"
          >
            By day, I build production education technology for Ohio school
            districts at META Solutions. By night, I build open-source
            infrastructure for AI-native development — including CAST, a{" "}
            {CAST_STATS.agents}-agent framework for Claude Code distributed as{" "}
            {CAST_ECOSYSTEM.tapsPlusUmbrella}.
          </motion.p>

          {/* CTAs — delay 0.45s */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-8 flex flex-wrap gap-4"
          >
            <Link
              to="/projects"
              className="group inline-flex items-center gap-2 px-6 py-3 bg-accent-400 text-slate-950 font-display text-sm tracking-wider uppercase font-bold rounded-lg hover:bg-accent-300 hover:shadow-[0_0_30px_rgba(0,255,194,0.3)] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/60"
            >
              See What I&apos;ve Built
              <ArrowRight size={16} aria-hidden="true" className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="mailto:edward.kubiak.dev@gmail.com"
              className="inline-flex items-center gap-2 px-6 py-3 border border-slate-700 text-slate-300 font-display text-sm tracking-wider uppercase rounded-lg hover:border-accent-400 hover:text-accent-400 hover:shadow-[0_0_20px_rgba(0,255,194,0.1)] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400/60"
            >
              Let&apos;s Build Something
            </a>
          </motion.div>

          {/* Status pill — delay 0.55s */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.6, delay: 0.55 }}
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
      </section>
    </>
  );
}
