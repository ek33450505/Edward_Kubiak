import { motion } from "motion/react";
import { ExternalLink, GitCommit } from "lucide-react";
import { timeAgo } from "../../utils/timeAgo";
import SectionHeader from "../ui/SectionHeader";
import PageWrapper from "../ui/PageWrapper";
import Reveal from "../ui/Reveal";
import { useGitHubActivity } from "../../hooks/useGitHubActivity";

/**
 * CommitRow — renders a single commit/event entry in the activity feed.
 *
 * Used in both the live-data branch and the last-known-commits fallback branch,
 * removing ~40 lines of duplicated markup. The only difference between the two
 * branches is the `timeLabel` string passed by the parent.
 *
 * @param {{ event: object, timeLabel: string, index: number }} props
 */
function CommitRow({ event, timeLabel, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="group flex items-start gap-3 p-4 card-interactive"
    >
      <GitCommit
        size={14}
        aria-hidden="true"
        className="text-accent-400/60 shrink-0 mt-0.5"
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
          className="font-display text-[11px] tracking-wider text-accent-400/80 hover:text-accent-400 transition-colors uppercase inline-flex items-center gap-1"
        >
          {event.repo}
          {event.sha && (
            <span className="text-slate-400 normal-case tracking-normal lowercase">
              · {event.sha.slice(0, 7)}
            </span>
          )}
          <ExternalLink size={9} aria-hidden="true" className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
        <p className="text-sm text-slate-400 leading-snug mt-0.5 truncate">
          {event.message}
        </p>
      </div>
      <span className="font-display text-[11px] tracking-wider text-slate-400 shrink-0 pt-0.5">
        {timeLabel}
      </span>
    </motion.div>
  );
}

export default function CurrentlyBuilding() {
  const { events, lastKnownCommits, lastKnownCachedAt, loading, error } =
    useGitHubActivity();

  const showFallback =
    !loading &&
    (error || (events.length === 0 && lastKnownCommits.length === 0));

  const lastKnownTimeLabel = lastKnownCachedAt
    ? `from last deploy · ${new Date(lastKnownCachedAt).toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric", year: "numeric" }
      )}`
    : "from last deploy · unknown date";

  return (
    <PageWrapper width="6xl" className="pb-20 w-full relative z-[2]">
      <Reveal as="section" aria-labelledby="currently-building-heading">
        {/* Section heading */}
        <div className="mb-6 flex items-center gap-3">
          <SectionHeader id="currently-building-heading" title="Currently Building">
            {!loading && !showFallback && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-display tracking-[0.15em] uppercase bg-emerald-400/15 text-emerald-400 border border-emerald-400/20">
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
              <div key={i} className="p-4 card animate-pulse">
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
          <div className="p-4 card">
            <a
              href="https://github.com/ek33450505"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-accent-400 transition-colors"
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
              <CommitRow
                key={event.id}
                event={event}
                timeLabel={timeAgo(event.time)}
                index={i}
              />
            ))}
          </div>
        )}

        {/* Activity feed — from last deploy fallback */}
        {!loading && events.length === 0 && lastKnownCommits.length > 0 && (
          <div className="space-y-2" aria-live="polite">
            {lastKnownCommits.map((event, i) => (
              <CommitRow
                key={event.id}
                event={event}
                timeLabel={lastKnownTimeLabel}
                index={i}
              />
            ))}
          </div>
        )}
      </Reveal>
    </PageWrapper>
  );
}
