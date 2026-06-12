import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Bot, Package, TestTube2, Terminal, Hash } from "lucide-react";
import { fadeUp } from "../utils/motion";
import { CAST_STATS } from "../data/castStats";
import SectionHeader from "./ui/SectionHeader";

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
        if (cancelled) return;
        if (data && typeof data === "object") {
          setStats(data);
        } else {
          setStats(CAST_STATS);
        }
      })
      .catch(() => {
        if (!cancelled) setStats(CAST_STATS);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const displayStats = stats ?? CAST_STATS;

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      className="max-w-6xl mx-auto px-6 pb-20 w-full relative z-[2]"
    >
      <div className="mb-6">
        <SectionHeader title="CAST Ecosystem — Live Stats" />
      </div>

      <div className="flex flex-wrap gap-3">
        {PILLS.map(({ key, label, icon: Icon }) => {
          const value = displayStats[key];
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
              <Icon size={14} className="text-amber-400 shrink-0" aria-hidden="true" />
              <span className="font-display text-base font-bold text-amber-400">
                {value}
              </span>
              <span className="font-display text-[10px] tracking-[0.2em] text-slate-400 uppercase">
                {label}
              </span>
            </motion.div>
          );
        })}
        {displayStats.updated && (
          <div className="flex items-center self-center ml-1">
            <span className="font-display text-[10px] tracking-wider text-slate-600">
              updated {new Date(displayStats.updated).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </motion.section>
  );
}

export default CastStats;
