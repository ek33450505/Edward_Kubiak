import ultras from "../data/ultras";

function UltraMap() {
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

        {/* Race pins */}
        {ultras.map((race, i) => (
          <circle
            key={`${race.name}-${race.year}-${i}`}
            cx={race.x}
            cy={race.y}
            r="1.4"
            fill={race.finished ? "#fbbf24" : "#64748b"}
            opacity={race.finished ? 0.9 : 0.6}
          >
            <title>{race.name} · {race.year} · {race.location}{race.finished ? " · Finished" : " · Planned"}</title>
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
          <span className="font-display text-[9px] tracking-wider text-slate-500 uppercase">Planned</span>
        </div>
      </div>
    </div>
  );
}

export default UltraMap;
