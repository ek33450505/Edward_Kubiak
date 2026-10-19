import { CAST_STATS } from "../data/castStats";
import { useStaticJson } from "../hooks/useStaticJson";
import SectionHead from "./Home/SectionHead";
import PageWrapper from "./ui/PageWrapper";
import Reveal from "./ui/Reveal";

const PILLS = [
  { key: "version", label: "Version" },
  { key: "agents", label: "Agents" },
  { key: "tests", label: "Tests" },
  { key: "packages", label: "Packages" },
  { key: "tables", label: "Tables" },
  { key: "commands", label: "Commands" },
];

function CastStats() {
  const { data } = useStaticJson("/cast-stats.json", { fallback: CAST_STATS });

  // Guard: if JSON parsed to a non-object type, fall back to bundled stats.
  const displayStats = data && typeof data === "object" ? data : CAST_STATS;
  const cells = PILLS.filter(({ key }) => displayStats[key] !== undefined && displayStats[key] !== null);

  return (
    <Reveal as="section" aria-labelledby="cast-stats-heading" className="w-full">
      <PageWrapper width="6xl" className="pb-20 md:pb-24">
        <SectionHead index="04" title="CAST ecosystem — live stats" id="cast-stats-heading">
          {displayStats.updated && (
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Updated {new Date(displayStats.updated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
            </span>
          )}
        </SectionHead>

        {/* Console readout — mono tabular figures over tiny tracked labels */}
        <div className="flex flex-wrap gap-px overflow-hidden rounded border border-border bg-border">
          {cells.map(({ key, label }) => (
            <div key={key} className="flex min-w-[8rem] flex-1 flex-col gap-2 bg-card px-5 py-4">
              <span className="font-mono text-2xl font-medium tabular-nums leading-none text-foreground">
                {typeof displayStats[key] === "number" ? displayStats[key].toLocaleString("en-US") : displayStats[key]}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {label}
              </span>
            </div>
          ))}
        </div>
      </PageWrapper>
    </Reveal>
  );
}

export default CastStats;
