import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Star, Package, Sparkles } from "lucide-react";
import { fadeUp } from "../utils/motion";
import { CAST_STATS, CAST_ECOSYSTEM } from "../data/castStats";

const CAST_REPOS = [
  "claude-agent-team",
  "cast-desktop",
  "cast-agents",
  "cast-hooks",
  "cast-observe",
  "cast-security",
  "cast-dash",
  "cast-memory",
  "cast-parallel",
  "cast-routines",
  "cast-doctor",
  "cast-time",
  "cast-website",
  "cast-claudes_journal",
  "claude-code-dashboard",
];

const STATIC_PILLS = [
  { label: "Taps", value: `${CAST_STATS.packages}`, icon: Package },
  { label: "CAST", value: CAST_STATS.version, icon: Sparkles },
];

function HeroStats() {
  const [totalStars, setTotalStars] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/github-stars.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data || typeof data !== "object") return;
        const sum = CAST_REPOS.reduce((acc, repo) => {
          const count = data[repo];
          return acc + (typeof count === "number" ? count : 0);
        }, 0);
        setTotalStars(sum);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch failed and no stars — render nothing
  if (!loading && totalStars === null) return null;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: 1.3 }}
      className="mt-6 flex flex-wrap items-center gap-2"
    >
      {loading ? (
        <>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-9 w-20 rounded-xl bg-slate-800/50 animate-pulse"
              aria-hidden="true"
            />
          ))}
        </>
      ) : (
        <>
          {/* Stars pill — live value */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-800/60 bg-slate-900/30">
            <Star size={13} className="text-amber-400 shrink-0" aria-hidden="true" />
            <span className="font-display text-sm font-bold text-amber-400">
              {totalStars.toLocaleString()}
            </span>
            <span className="font-display text-[10px] tracking-[0.2em] text-slate-400 uppercase">
              Stars
            </span>
          </div>

          {/* Static pills */}
          {STATIC_PILLS.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-800/60 bg-slate-900/30"
            >
              <Icon size={13} className="text-amber-400 shrink-0" aria-hidden="true" />
              <span className="font-display text-sm font-bold text-amber-400">
                {value}
              </span>
              <span className="font-display text-[10px] tracking-[0.2em] text-slate-400 uppercase">
                {label}
              </span>
            </div>
          ))}
        </>
      )}
    </motion.div>
  );
}

export default HeroStats;
