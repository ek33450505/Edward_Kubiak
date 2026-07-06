import { useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import HeroStats from "../HeroStats";
import { CAST_STATS, CAST_ECOSYSTEM } from "../../data/castStats";
import { fadeUp, slideInLeft } from "../../utils/motion";

// Frontispiece coordinate — Columbus, OH. Rendered as a survey overline.
const COORDINATE = "39.96°N 82.99°W · COLUMBUS, OHIO · EDITION 2026";

// Fade the graticule plate at every edge so it reads as a reference grid
// beneath the type, never as a hard-edged box.
const GRATICULE_MASK =
  "radial-gradient(ellipse 85% 78% at 32% 42%, #000 28%, transparent 82%)";

function ScrollCue() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      <motion.a
        href="#core-competencies"
        aria-label="Scroll to core competencies"
        className="mt-14 flex w-fit items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-primary"
        initial={{ opacity: 1 }}
        animate={shouldReduceMotion ? { opacity: 1 } : { y: [0, 6, 0], opacity: 1 }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown size={14} aria-hidden="true" />
        South
      </motion.a>
    </AnimatePresence>
  );
}

export default function HeroSection() {
  const heroRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  // Subtle parallax: the frontispiece plate drifts up as the reader scrolls.
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, shouldReduceMotion ? 0 : -40]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section
      ref={heroRef}
      className="relative mx-auto w-full max-w-6xl px-6 py-24 md:py-36"
      style={{ position: "relative" }}
    >
      {/* Graticule plate — the surveyor's reference grid, masked to fade at edges */}
      <div
        aria-hidden="true"
        className="graticule pointer-events-none absolute inset-0"
        style={{ maskImage: GRATICULE_MASK, WebkitMaskImage: GRATICULE_MASK }}
      />

      <motion.div className="relative" style={{ y: heroY, opacity: heroOpacity }}>
        {/* Coordinate overline */}
        <motion.p
          variants={slideInLeft}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.6, delay: 0 }}
          className="mb-6 font-mono text-xs uppercase tracking-[0.28em] text-primary"
        >
          {COORDINATE}
        </motion.p>

        {/* Frontispiece headline — engraved serif */}
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display max-w-3xl text-4xl font-semibold leading-[1.06] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
        >
          Production software by day,
          <br />
          open-source AI infrastructure by night.
        </motion.h1>

        {/* Body intro */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground"
        >
          By day, I build production education technology for Ohio school
          districts at META Solutions. By night, I build open-source
          infrastructure for AI-native development — including CAST, a{" "}
          {CAST_STATS.agents}-agent framework for Claude Code distributed as{" "}
          {CAST_ECOSYSTEM.tapsPlusUmbrella}.
        </motion.p>

        {/* CTAs — primary neatline button + underlined secondary */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-9 flex flex-wrap items-center gap-6"
        >
          <Link
            to="/projects"
            className="group inline-flex items-center gap-2 rounded border border-primary px-6 py-3 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            View Projects
            <ArrowRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="mailto:edward.kubiak.dev@gmail.com"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-primary"
          >
            Get in touch
          </a>
        </motion.div>

        {/* Availability — survey marker, no pulse */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
        >
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="h-2 w-2 bg-primary" />
            Open to new opportunities
          </span>
          <a
            href="https://www.linkedin.com/in/edward-kubiak/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Connect on LinkedIn (opens in new tab)"
            className="text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
          >
            LinkedIn →
          </a>
        </motion.div>

        <HeroStats />

        <ScrollCue />
      </motion.div>
    </section>
  );
}
