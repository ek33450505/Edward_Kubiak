import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Bot, Package, TestTube2, Terminal, Hash } from "lucide-react";

const PILLS = [
  { key: "version", label: "Version", icon: Hash },
  { key: "agents", label: "Agents", icon: Bot },
  { key: "tests", label: "Tests", icon: TestTube2 },
  { key: "packages", label: "Packages", icon: Package },
  { key: "commands", label: "Commands", icon: Terminal },
];

function CastStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/cast-stats.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data === "object") {
          setStats(data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto px-6 pb-20 w-full relative z-[2]"
    >
      <div className="mb-6">
        <h2 className="font-display text-xs tracking-[0.3em] text-slate-500 uppercase">
          CAST Ecosystem — Live Stats
        </h2>
        <div className="mt-2 w-16 h-0.5 bg-amber-400/60" />
      </div>

      <div className="flex flex-wrap gap-3">
        {PILLS.map(({ key, label, icon: Icon }) => {
          const value = stats[key];
          if (value === undefined || value === null) return null;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800/60 bg-slate-900/30"
            >
              <Icon size={14} className="text-amber-400 shrink-0" />
              <span className="font-display text-base font-bold text-amber-400">
                {value}
              </span>
              <span className="font-display text-[10px] tracking-[0.2em] text-slate-500 uppercase">
                {label}
              </span>
            </motion.div>
          );
        })}
        {stats.updated && (
          <div className="flex items-center self-center ml-1">
            <span className="font-display text-[10px] tracking-wider text-slate-600">
              updated {new Date(stats.updated).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </motion.section>
  );
}

export default CastStats;
