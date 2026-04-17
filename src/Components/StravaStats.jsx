import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { TrendingUp, Mountain, Infinity, Flame } from "lucide-react";

function timeAgo(dateString) {
  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffDay > 30) return `${Math.floor(diffDay / 30)}mo ago`;
  if (diffDay > 0) return `${diffDay}d ago`;
  if (diffHr > 0) return `${diffHr}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return "just now";
}

function metersToMiles(m) {
  const miles = m * 0.000621371;
  return miles >= 100 ? Math.round(miles).toLocaleString("en-US") : miles.toFixed(1);
}

function metersToFeet(m) {
  return Math.round(m * 3.28084).toLocaleString("en-US");
}

const StravaStats = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      try {
        const res = await fetch("/strava-stats.json");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.available === true) {
          setStats(data);
        }
      } catch {
        // fetch failed or JSON missing — return null silently
      }
    }

    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats) return null;

  const pills = [
    {
      icon: TrendingUp,
      label: "YTD Miles",
      value: metersToMiles(stats.ytdRunDistance),
      unit: "mi",
    },
    {
      icon: Mountain,
      label: "YTD Climb",
      value: metersToFeet(stats.ytdRunElevation),
      unit: "ft",
    },
    {
      icon: Infinity,
      label: "Lifetime Miles",
      value: metersToMiles(stats.allTimeRunDistance),
      unit: "mi",
    },
    {
      icon: Flame,
      label: "Longest Run",
      value: metersToMiles(stats.biggestRunDistance),
      unit: "mi",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
    >
      <h4 className="font-display text-[10px] tracking-[0.3em] text-slate-500 uppercase mt-4 mb-3">
        Trail Stats
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {pills.map(({ icon: Icon, label, value, unit }) => (
          <div
            key={label}
            className="p-4 rounded-xl border border-slate-800/60 bg-slate-900/30"
          >
            <Icon size={16} className="text-amber-400/60 mb-2" />
            <div className="text-2xl font-display font-bold text-amber-400">
              {value}
            </div>
            <div className="font-display text-[10px] tracking-widest text-slate-500 mt-1 uppercase">
              {label}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] tracking-wider font-display text-slate-500">
        Live from{" "}
        <span style={{ color: "#fc4c02" }}>Strava</span>
        {" · updated "}
        {timeAgo(stats.updated)}
      </p>
    </motion.div>
  );
};

export default StravaStats;
