import { TrendingUp, Mountain, Infinity as InfinityIcon, Flame } from "lucide-react";
import { useStaticJson } from "../hooks/useStaticJson";
import { timeAgo } from "../utils/timeAgo";
import Reveal from "./ui/Reveal";

function metersToMiles(m) {
  const miles = m * 0.000621371;
  return miles >= 100 ? Math.round(miles).toLocaleString("en-US") : miles.toFixed(1);
}

function metersToFeet(m) {
  return Math.round(m * 3.28084).toLocaleString("en-US");
}

const StravaStats = () => {
  const { data: stats } = useStaticJson("/strava-stats.json");

  if (!stats || stats.available !== true) return null;

  const pills = [
    {
      icon: TrendingUp,
      label: "YTD Miles",
      value: metersToMiles(stats.ytdRunDistance),
    },
    {
      icon: Mountain,
      label: "YTD Climb",
      value: metersToFeet(stats.ytdRunElevation),
    },
    {
      icon: InfinityIcon,
      label: "Lifetime Miles",
      value: metersToMiles(stats.allTimeRunDistance),
    },
    {
      icon: Flame,
      label: "Longest Run",
      value: metersToMiles(stats.biggestRunDistance),
    },
  ];

  return (
    <Reveal transition={{ duration: 0.4 }}>
      <h4 className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground uppercase mt-4 mb-3">
        Trail Stats
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {pills.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="p-4 card"
          >
            <Icon size={16} className="text-primary/60 mb-2" aria-hidden="true" />
            <div className="text-2xl font-mono font-bold text-primary">
              {value}
            </div>
            <div className="font-mono text-[10px] tracking-widest text-muted-foreground mt-1 uppercase">
              {label}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] tracking-wider font-mono text-muted-foreground">
        Live from{" "}
        <span style={{ color: "#fc4c02" }}>Strava</span>
        {" · updated "}
        {timeAgo(stats.updated)}
      </p>
    </Reveal>
  );
};

export default StravaStats;
