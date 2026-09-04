import { CAST_STATS } from "../data/castStats";
import { ATLAS_STATS } from "../data/atlasStats";
import Reveal from "./ui/Reveal";

// Survey-strip cells: a mono tabular figure over a tracked uppercase label,
// divided by sepia hairlines. Every figure is interpolated from the bundled
// stat modules — no hardcoded numbers (see CLAUDE.md Data-Point Discipline).
const CELLS = [
  { label: "Tests", value: CAST_STATS.tests.toLocaleString("en-US") },
  { label: "Facilities", value: ATLAS_STATS.facilities.toLocaleString("en-US") },
  { label: "Packages", value: `${CAST_STATS.packages}` },
  { label: "CAST", value: CAST_STATS.version },
];

function HeroStats() {
  return (
    <Reveal
      transition={{ duration: 0.5, delay: 1.3 }}
      className="mt-10 flex w-fit flex-wrap items-stretch divide-x divide-border border-y border-border"
    >
      {CELLS.map(({ label, value }) => (
        <div key={label} className="flex flex-col gap-1 px-6 py-3">
          <span className="font-mono text-xl font-semibold tabular-nums leading-none text-foreground">
            {value}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            {label}
          </span>
        </div>
      ))}
    </Reveal>
  );
}

export default HeroStats;
