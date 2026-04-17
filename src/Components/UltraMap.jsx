import ultras from "../data/ultras";

function UltraMap() {
  // Group by name|location to dedupe overlapping pins
  const groups = ultras.reduce((acc, race) => {
    const key = `${race.name}|${race.location}`;
    if (!acc[key]) {
      acc[key] = { ...race, years: [race.year] };
    } else {
      acc[key].years.push(race.year);
      // If any entry is finished, pin is amber
      if (race.finished) acc[key].finished = true;
    }
    return acc;
  }, {});

  const pins = Object.values(groups).map((g) => ({
    ...g,
    label: `${g.name} · ${g.years.sort((a, b) => a - b).join(", ")} · ${g.location}`,
  }));

  return (
    <div className="mt-4">
      <p className="font-display text-[10px] tracking-[0.2em] text-slate-500 uppercase mb-2">
        Races
      </p>
      <svg
        viewBox="0 0 100 60"
        style={{ maxWidth: "100%", height: "auto", display: "block" }}
        aria-label="Map of ultramarathon race locations across the US"
        role="img"
      >
        {/* Simplified US outline */}
        <path
          d="M 12 22 L 18 18 L 30 16 L 50 14 L 70 14 L 85 18 L 90 22 L 88 32 L 82 38 L 75 42 L 60 44 L 42 46 L 30 42 L 20 36 L 14 30 Z"
          fill="none"
          stroke="rgba(148,163,184,0.3)"
          strokeWidth="0.5"
        />

        {/* Race pins — one per unique race+location */}
        {pins.map((pin) => (
          <circle
            key={`${pin.name}|${pin.location}`}
            cx={pin.x}
            cy={pin.y}
            r="1.4"
            fill={pin.finished ? "#fbbf24" : "#64748b"}
            opacity={pin.finished ? 0.9 : 0.6}
          >
            <title>{pin.label}</title>
          </circle>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="font-display text-[9px] tracking-wider text-slate-500 uppercase">Finished</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-slate-500" />
          <span className="font-display text-[9px] tracking-wider text-slate-500 uppercase">Planned 2026</span>
        </div>
      </div>
    </div>
  );
}

export default UltraMap;
