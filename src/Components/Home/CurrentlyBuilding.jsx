import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ExternalLink, GitCommit } from "lucide-react";
import { fadeUp } from "../../utils/motion";
import { timeAgo } from "../../utils/timeAgo";
import SectionHeader from "../ui/SectionHeader";

export default function CurrentlyBuilding() {
  const [events, setEvents] = useState([]);
  const [lastKnownCommits, setLastKnownCommits] = useState([]);
  const [lastKnownCachedAt, setLastKnownCachedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadActivity() {
      // Try pre-built static file first (generated at deploy time, no rate limit)
      try {
        const staticRes = await fetch("/github-activity.json");
        if (staticRes.ok) {
          const staticData = await staticRes.json();
          if (Array.isArray(staticData) && staticData.length > 0) {
            if (!cancelled) {
              setEvents(staticData);
              setLoading(false);
            }
            return;
          }
        }
      } catch {
        // static file unavailable — fall through to live API
      }

      // Fallback: live GitHub API
      try {
        const res = await fetch("https://api.github.com/users/ek33450505/events?per_page=30");
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (cancelled) return;
        const pushEvents = data
          .filter((e) => e.type === "PushEvent" && e.payload?.commits?.length > 0)
          .flatMap((e) =>
            e.payload.commits.map((c, idx) => ({
              id: `${e.id}-${idx}`,
              repo: e.repo.name.replace("ek33450505/", ""),
              repoFull: e.repo.name,
              sha: c.sha,
              message: c.message.split("\n")[0],
              time: e.created_at,
            }))
          )
          .slice(0, 10);
        if (!cancelled) {
          setEvents(pushEvents);
          setLoading(false);
        }
      } catch {
        // Live API failed; try fetching last-known-commits
        try {
          const lastKnownRes = await fetch("/last-known-commits.json");
          if (lastKnownRes.ok) {
            const lastKnownData = await lastKnownRes.json();
            if (!cancelled) {
              if (lastKnownData.commits && lastKnownData.commits.length > 0) {
                setLastKnownCommits(lastKnownData.commits);
                setLastKnownCachedAt(lastKnownData.cachedAt || "");
              }
              setError(true);
              setLoading(false);
            }
            return;
          }
        } catch {
          // last-known-commits fetch also failed
        }

        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    loadActivity();
    return () => {
      cancelled = true;
    };
  }, []);

  const showFallback = !loading && (error || (events.length === 0 && lastKnownCommits.length === 0));

  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      className="max-w-6xl mx-auto px-6 pb-20 w-full relative z-[2]"
      aria-labelledby="currently-building-heading"
    >
      {/* Section heading */}
      <div className="mb-6 flex items-center gap-3">
        <SectionHeader id="currently-building-heading" title="Currently Building">
          {!loading && !showFallback && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-display tracking-[0.15em] uppercase bg-emerald-400/15 text-emerald-400 border border-emerald-400/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          )}
        </SectionHeader>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-slate-800/60 bg-slate-900/30 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-slate-700/60 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-700/60 rounded w-1/4" />
                  <div className="h-3 bg-slate-700/40 rounded w-3/4" />
                </div>
                <div className="h-3 bg-slate-700/40 rounded w-12 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fallback card when API fails or no events */}
      {showFallback && (
        <div className="p-4 rounded-xl border border-slate-800/60 bg-slate-900/30">
          <a
            href="https://github.com/ek33450505"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-amber-400 transition-colors"
          >
            View my latest activity on GitHub
            <ExternalLink size={13} aria-hidden="true" />
          </a>
        </div>
      )}

      {/* Activity feed — live data */}
      {!loading && events.length > 0 && (
        <div className="space-y-2" aria-live="polite">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="group flex items-start gap-3 p-4 rounded-xl border border-slate-800/60 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-800/30 transition-all duration-200"
            >
              <GitCommit
                size={14}
                aria-hidden="true"
                className="text-amber-400/60 shrink-0 mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <a
                  href={
                    event.sha
                      ? `https://github.com/ek33450505/${event.repo}/commit/${event.sha}`
                      : `https://github.com/ek33450505/${event.repo}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-display text-[11px] tracking-wider text-amber-400/80 hover:text-amber-400 transition-colors uppercase inline-flex items-center gap-1"
                >
                  {event.repo}
                  {event.sha && (
                    <span className="text-slate-600 normal-case tracking-normal lowercase">
                      · {event.sha.slice(0, 7)}
                    </span>
                  )}
                  <ExternalLink size={9} aria-hidden="true" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                <p className="text-sm text-slate-400 leading-snug mt-0.5 truncate">
                  {event.message}
                </p>
              </div>
              <span className="font-display text-[10px] tracking-wider text-slate-600 shrink-0 pt-0.5">
                {timeAgo(event.time)}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Activity feed — from last deploy fallback */}
      {!loading && events.length === 0 && lastKnownCommits.length > 0 && (
        <div className="space-y-2" aria-live="polite">
          {lastKnownCommits.map((event, i) => {
            const formattedDate = lastKnownCachedAt
              ? new Date(lastKnownCachedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "unknown date";
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="group flex items-start gap-3 p-4 rounded-xl border border-slate-800/60 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-800/30 transition-all duration-200"
              >
                <GitCommit
                  size={14}
                  aria-hidden="true"
                  className="text-amber-400/60 shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <a
                    href={
                      event.sha
                        ? `https://github.com/ek33450505/${event.repo}/commit/${event.sha}`
                        : `https://github.com/ek33450505/${event.repo}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-display text-[11px] tracking-wider text-amber-400/80 hover:text-amber-400 transition-colors uppercase inline-flex items-center gap-1"
                  >
                    {event.repo}
                    {event.sha && (
                      <span className="text-slate-600 normal-case tracking-normal lowercase">
                        · {event.sha.slice(0, 7)}
                      </span>
                    )}
                    <ExternalLink size={9} aria-hidden="true" className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                  <p className="text-sm text-slate-400 leading-snug mt-0.5 truncate">
                    {event.message}
                  </p>
                </div>
                <span className="font-display text-[10px] tracking-wider text-slate-600 shrink-0 pt-0.5">
                  from last deploy · {formattedDate}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.section>
  );
}
