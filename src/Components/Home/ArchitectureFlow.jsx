import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import projects from "../../data/projects";
import { CAST_STATS } from "../../data/castStats";
import { ATLAS_STATS } from "../../data/atlasStats";
import SectionHead from "../ui/SectionHead";
import PageWrapper from "../ui/PageWrapper";
import { stageIndex } from "./stageIndex";

const STAGE_COUNT = 4;
const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

// dt-first in the DOM; flex-col-reverse shows the figure above its label.
function Readout({ items }) {
  return (
    <dl
      className="mt-5 grid grid-cols-1 gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-3 lg:grid-cols-1"
    >
      {items.map((item) => (
        <div key={item.label} className="flex flex-col-reverse justify-end bg-card p-3">
          <dt className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {item.label}
          </dt>
          <dd className="font-mono text-lg tabular-nums text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Stage({ lit, eyebrow, children }) {
  return (
    <li className="relative flex flex-col">
      <div className="relative z-10 flex min-h-4 w-fit items-center gap-3 bg-background pr-3">
        <span
          aria-hidden="true"
          data-lit={lit}
          className={`status-dot transition-colors duration-300 motion-reduce:transition-none ${lit ? "text-primary" : "text-border-strong"}`}
        />
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </span>
      </div>
      <div className="card ml-6 mt-4 flex-1 p-5 lg:ml-0">{children}</div>
    </li>
  );
}

export default function ArchitectureFlow() {
  const sectionRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 75%", "end 55%"],
  });
  const fill = useTransform(scrollYProgress, [0, 1], [0, 1]);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (reducedMotion) return;
    setActive(stageIndex(v, STAGE_COUNT));
  });

  const scale = reducedMotion ? 1 : fill;
  const isLit = (i) => reducedMotion || i <= active;

  const atlas = projects.find((p) => p.slug === "compute-atlas");
  const cast = projects.find((p) => p.slug === "cast-claude-agent-team");
  const citedBy = atlas ? atlas.citedBy || [] : [];

  const castReadout = [
    { label: "specialist agents", value: CAST_STATS.agents },
    { label: "tests in its own suite", value: CAST_STATS.tests.toLocaleString("en-US") },
    { label: "release", value: CAST_STATS.version },
  ];
  const atlasReadout = [
    { label: "facilities", value: ATLAS_STATS.facilities.toLocaleString("en-US") },
    { label: "GW operational", value: ATLAS_STATS.operationalGw },
    { label: "release", value: ATLAS_STATS.version },
  ];

  const h3 = "font-display text-xl font-semibold tracking-[-0.02em] text-foreground";
  const line = "mt-3 text-sm leading-relaxed text-muted-foreground";
  const titleLink = `${h3} inline-flex min-h-11 items-center underline-offset-4 transition-colors hover:text-primary hover:underline ${focusRing}`;

  return (
    <PageWrapper width="6xl" className="w-full pb-20 pt-4 md:pb-24">
      <section ref={sectionRef} aria-labelledby="architecture-flow-heading">
        <SectionHead index="02" title="How it's built" id="architecture-flow-heading" />

        <div className="relative">
          {/* Signal track: vertical when stacked, horizontal at lg. Decorative. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-2 left-[3.5px] top-2 w-px bg-border lg:hidden"
          >
            <motion.div
              data-testid="flow-fill-y"
              data-fill={reducedMotion ? "full" : "scroll"}
              className="h-full w-full origin-top bg-primary"
              style={{ scaleY: scale }}
            />
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 right-0 top-2 hidden h-px bg-border lg:block"
          >
            <motion.div
              data-testid="flow-fill-x"
              data-fill={reducedMotion ? "full" : "scroll"}
              className="h-full w-full origin-left bg-primary"
              style={{ scaleX: scale }}
            />
          </div>

          {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- list semantics are kept when list-style is none (Safari/VoiceOver) */}
          <ol role="list" className="grid grid-cols-1 gap-8 lg:grid-cols-4 lg:gap-6">
            <Stage lit={isLit(0)} eyebrow="Engineer">
              <h3 className={h3}>Edward Kubiak</h3>
              <p className={line}>Sets the task, decides what ships, owns the consequences.</p>
            </Stage>

            <Stage lit={isLit(1)} eyebrow="Development architecture">
              <h3 className={cast ? undefined : h3}>
                {cast ? (
                  <Link to={`/projects/${cast.slug}`} className={titleLink}>
                    CAST
                  </Link>
                ) : (
                  "CAST"
                )}
              </h3>
              <p className={line}>
                Routes work to agents, gates code changes through review, keeps a local record of every run.
              </p>
              <Readout items={castReadout} />
            </Stage>

            <Stage lit={isLit(2)} eyebrow="Live product">
              <h3 className={atlas ? undefined : h3}>
                {atlas ? (
                  <Link to={`/projects/${atlas.slug}`} className={titleLink}>
                    Compute Atlas
                  </Link>
                ) : (
                  "Compute Atlas"
                )}
              </h3>
              <p className={line}>Open, source-cited census of U.S. grid-scale compute.</p>
              <Readout items={atlasReadout} />
            </Stage>

            <Stage lit={isLit(3)} eyebrow="Cited by">
              <h3 className={h3}>Independent projects</h3>
              {/* eslint-disable-next-line jsx-a11y/no-redundant-roles -- list semantics are kept when list-style is none (Safari/VoiceOver) */}
              <ul role="list" className="mt-3 flex flex-col">
                {citedBy.map((c) => (
                  <li key={c.url}>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${c.name} (opens in new tab)`}
                      className={`inline-flex min-h-11 items-center gap-1.5 text-sm text-foreground underline decoration-border-strong underline-offset-4 transition-colors hover:text-primary hover:decoration-primary ${focusRing}`}
                    >
                      {c.name}
                      <ArrowUpRight size={14} aria-hidden="true" className="shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>
            </Stage>
          </ol>
        </div>
      </section>
    </PageWrapper>
  );
}
