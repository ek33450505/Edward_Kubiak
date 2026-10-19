import { Suspense, lazy, useEffect, useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import HeroStats from "../HeroStats";
import { ATLAS_STATS } from "../../data/atlasStats";
import { ATLAS_POINTS } from "../../data/atlasPoints";
import { STATUS_STYLE, statusLabel } from "../../lib/facilityField";
import { fadeUp } from "../../utils/motion";

// Static dot-grid stand-in shown until the facility-field canvas draws its first frame.
const DOT_GRID = {
  backgroundImage:
    "radial-gradient(circle, color-mix(in oklab, var(--color-border-strong) 55%, transparent) 1px, transparent 1.5px)",
  backgroundSize: "20px 20px",
};

// Code-split: the canvas stays out of the entry chunk. A failed chunk load (e.g. a stale tab
// after a deploy) degrades to the dot grid instead of reaching the route ErrorBoundary.
export const loadFacilityField = () => import("./FacilityField").catch(() => ({ default: () => null }));
const FacilityField = lazy(loadFacilityField);

const STATUSES = Object.keys(STATUS_STYLE);

function FacilityFieldSlot() {
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);

  // Mount the canvas only after first paint, so it never delays the hero text's LCP.
  useEffect(() => {
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setMounted(true));
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(id);
  }, []);

  const count = ATLAS_POINTS.count.toLocaleString("en-US");

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="show"
      transition={{ duration: 0.6, delay: 0.3 }}
      className="panel overflow-hidden"
    >
      <div className="panel-head min-w-0 gap-x-3">
        <span>Compute Atlas · Live registry</span>
        <span className="whitespace-nowrap tabular-nums text-foreground">{count} sites</span>
      </div>
      {/* Aspect ratio comes from the bundled summary: the canvas mounts without layout shift. */}
      <div
        data-slot="facility-field"
        aria-hidden="true"
        className="relative w-full"
        style={{ aspectRatio: `${ATLAS_POINTS.w} / ${ATLAS_POINTS.h}` }}
      >
        <div
          className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${ready ? "opacity-0" : "opacity-100"}`}
          style={DOT_GRID}
        />
        {mounted && (
          <Suspense fallback={null}>
            <FacilityField onReady={() => setReady(true)} />
          </Suspense>
        )}
      </div>
      <p className="sr-only">
        Map of {count} Compute Atlas facilities, colored by status as listed below.
      </p>
      {/* role="list" restores list semantics that Safari/VoiceOver drops for list-none. */}
      {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
      <ul role="list" aria-label="Facility status legend" className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 border-t border-border px-4 py-3 font-mono text-[11px] text-muted-foreground">
        {STATUSES.map((name) => (
          <li key={name} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="inline-block size-2"
              style={{ backgroundColor: STATUS_STYLE[name].color, opacity: STATUS_STYLE[name].alpha }}
            />
            <span>{statusLabel(name)}</span>
            <span className="tabular-nums text-foreground">
              {(ATLAS_POINTS.byStatus[name] ?? 0).toLocaleString("en-US")}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-x-4 border-t border-border px-4 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <span>{ATLAS_STATS.coverage}</span>
        <a
          href="https://www.compute-atlas.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Explore the live map (opens in new tab)"
          className="inline-flex min-h-11 items-center underline decoration-border-strong underline-offset-4 transition-colors hover:text-primary hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Explore the live map
          <ArrowUpRight size={12} aria-hidden="true" className="ml-1" />
        </a>
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

          {/* The h1 and both paragraphs render opaque on the first frame so LCP is not delayed by a fade. */}
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
            initial={false}
            animate="show"
            className="mt-5 max-w-xl text-xl leading-snug text-foreground/90 sm:text-2xl"
          >
            Full-stack engineer. I build data products, and the agent architecture that ships them.
          </motion.p>

          <motion.p
            variants={fadeUp}
            initial={false}
            animate="show"
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
