import { CAST_STATS } from "../data/castStats";
import { useStaticJson } from "../hooks/useStaticJson";
import SectionHeader from "./ui/SectionHeader";
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

  return (
    <Reveal as="section" className="w-full relative z-[2]">
      <PageWrapper width="6xl" className="pb-20">
        <div className="mb-6">
          <SectionHeader title="CAST Ecosystem — Live Stats">
            {displayStats.updated && (
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Rev. {new Date(displayStats.updated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
          </SectionHeader>
        </div>

        {/* Survey strip — mono tabular figures over tracked labels, sepia hairlines */}
        <div className="flex w-fit flex-wrap items-stretch divide-x divide-border border-y border-border">
          {PILLS.map(({ key, label }) => {
            const value = displayStats[key];
            if (value === undefined || value === null) return null;
            return (
              <div key={key} className="flex flex-col gap-1 px-6 py-3">
                <span className="font-mono text-xl font-semibold tabular-nums leading-none text-foreground">
                  {value}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </PageWrapper>
    </Reveal>
  );
}

export default CastStats;
