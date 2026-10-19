import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import HeroStats from "../HeroStats";
import { ATLAS_STATS } from "../../data/atlasStats";
import { fadeUp } from "../../utils/motion";

// Static dot-grid stand-in for the live facility-field canvas (mounted in a later phase).
const DOT_GRID = {
  backgroundImage:
    "radial-gradient(circle, color-mix(in oklab, var(--color-border-strong) 55%, transparent) 1px, transparent 1.5px)",
  backgroundSize: "20px 20px",
};

function FacilityFieldSlot() {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.6, delay: 0.3 }}
      className="panel overflow-hidden"
    >
      <div className="panel-head">
        <span>Compute Atlas · Live registry</span>
        <span className="tabular-nums text-foreground">
          {ATLAS_STATS.facilities.toLocaleString("en-US")} sites
        </span>
      </div>
      {/* Fixed aspect ratio: the canvas mounts here without layout shift. */}
      <div
        data-slot="facility-field"
        aria-hidden="true"
        className="aspect-[4/3] w-full"
        style={DOT_GRID}
      />
      <div className="border-t border-border px-4 py-2 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {ATLAS_STATS.coverage}
      </div>
    </motion.div>
  );
}

export default function HeroSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-20 md:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.5, delay: 0 }}
            className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground"
          >
            <span className="inline-flex items-center gap-2 text-primary">
              <span aria-hidden="true" className="status-dot" />
              Open to new opportunities
            </span>
            <a
              href="https://www.linkedin.com/in/edward-kubiak/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Connect on LinkedIn (opens in new tab)"
              className="inline-flex min-h-11 items-center underline decoration-border-strong underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
            >
              LinkedIn →
            </a>
          </motion.div>

          {/* Renders opaque on the first frame so it is a valid immediate LCP element. */}
          <motion.h1
            variants={fadeUp}
            initial={false}
            animate="show"
            className="font-display text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.035em] text-foreground sm:text-6xl lg:text-7xl"
          >
            Edward Kubiak
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 max-w-xl text-xl leading-snug text-foreground/90 sm:text-2xl"
          >
            Full-stack engineer. I build data products, and the agent architecture that ships them.
          </motion.p>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Compute Atlas is a full-stack data product I designed and shipped solo,
            cited by Erin Brockovich&apos;s data center reporting map. I build it with CAST, my Claude Code
            agent architecture, and ship production education software at META
            Solutions.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-4"
          >
            <Link
              to="/projects"
              className="group inline-flex items-center gap-2 rounded bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              View work
              <ArrowRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center rounded border border-border-strong px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Contact
            </Link>
            <Link
              to="/practice"
              className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline decoration-border-strong underline-offset-4 transition-colors hover:text-foreground hover:decoration-primary"
            >
              How I work with agents
            </Link>
          </motion.div>
        </div>

        <FacilityFieldSlot />
      </div>

      <HeroStats />
    </section>
  );
}
