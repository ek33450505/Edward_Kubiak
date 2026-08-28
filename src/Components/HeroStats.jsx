import { useState, useEffect } from "react";
import { CAST_STATS } from "../data/castStats";
import { ATLAS_STATS } from "../data/atlasStats";
import { fetchStarsMap } from "../hooks/useGitHubStars";
import Reveal from "./ui/Reveal";

// Public OSS repos counted in the hero star total
const STAR_REPOS = [
  "claude-agent-team",
  "cast-desktop",
  "claude-code-dashboard",
  "cast-mcp",
  "cast-ledger",
  "cast-predict",
  "cast-memory",
  "cast-doctor",
  "cast-time",
  "cast-claudes_journal",
  "misfire",
  "attest",
  "looptrip",
];

const STATIC_PILLS = [
  { label: "Facilities", value: ATLAS_STATS.facilities.toLocaleString("en-US") },
  { label: "Taps", value: `${CAST_STATS.packages}` },
  { label: "CAST", value: CAST_STATS.version },
];

function HeroStats() {
  const [totalStars, setTotalStars] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchStarsMap()
      .then((map) => {
        if (cancelled) return;
        // fetchStarsMap returns {} on error; skip rendering if no data.
        if (!map || Object.keys(map).length === 0) return;
        const sum = STAR_REPOS.reduce((acc, repo) => {
          const count = map[repo];
          return acc + (typeof count === "number" ? count : 0);
        }, 0);
        setTotalStars(sum);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch failed and no stars — render nothing
  if (!loading && totalStars === null) return null;

  // Survey-strip cells: a mono tabular figure over a tracked uppercase label,
  // divided by sepia hairlines.
  const cells = [
    { label: "Stars", value: totalStars?.toLocaleString() ?? "—" },
    ...STATIC_PILLS.map(({ label, value }) => ({ label, value })),
  ];

  return (
    <Reveal
      transition={{ duration: 0.5, delay: 1.3 }}
      className="mt-10 flex w-fit flex-wrap items-stretch divide-x divide-border border-y border-border"
    >
      {loading ? (
        <>
          {cells.map((_, i) => (
            <div key={i} className="px-6 py-3" aria-hidden="true">
              <div className="h-6 w-16 animate-pulse bg-muted" />
              <div className="mt-2 h-2 w-10 animate-pulse bg-muted" />
            </div>
          ))}
        </>
      ) : (
        cells.map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-1 px-6 py-3">
            <span className="font-mono text-xl font-semibold tabular-nums leading-none text-foreground">
              {value}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              {label}
            </span>
          </div>
        ))
      )}
    </Reveal>
  );
}

export default HeroStats;
