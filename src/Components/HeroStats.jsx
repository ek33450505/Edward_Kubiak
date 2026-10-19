import { CAST_STATS } from "../data/castStats";
import { ATLAS_STATS } from "../data/atlasStats";
import Reveal from "./ui/Reveal";

// Console readout cells: a mono tabular figure over a tiny tracked label,
// divided by hairlines. Every figure is interpolated from the bundled
// stat modules — no hardcoded numbers (see CLAUDE.md Data-Point Discipline).
const CELLS = [
  { label: "Tests", value: CAST_STATS.tests.toLocaleString("en-US") },
  { label: "GW operational", value: `${ATLAS_STATS.operationalGw}` },
  { label: "Packages", value: `${CAST_STATS.packages}` },
  { label: "CAST", value: CAST_STATS.version },
];

function HeroStats() {
  return (
    <Reveal
      transition={{ duration: 0.5, delay: 0.6 }}
      className="mt-14 grid rounded border border-border grid-cols-2 gap-px overflow-hidden bg-border sm:grid-cols-4"
    >
      {CELLS.map(({ label, value }) => (
        <div key={label} className="flex flex-col gap-2 bg-card px-5 py-4">
          <span className="font-mono text-2xl font-medium tabular-nums leading-none text-foreground">
            {value}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </span>
        </div>
      ))}
    </Reveal>
  );
}

export default HeroStats;
