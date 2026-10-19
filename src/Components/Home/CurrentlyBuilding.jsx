import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ExternalLink, GitCommit } from "lucide-react";
import { timeAgo } from "../../utils/timeAgo";
import SectionHead from "../ui/SectionHead";
import PageWrapper from "../ui/PageWrapper";
import Reveal from "../ui/Reveal";
import { useGitHubActivity } from "../../hooks/useGitHubActivity";
import now from "../../data/now";

const MAX_LEN = 140;
const buildingItems = (now.sections.find((sec) => sec.title === "Building")?.items ?? []).slice(0, 3);

// Concise row text: truncated at the last whole word within MAX_LEN characters.
function brief(item) {
  if (item.length <= MAX_LEN) return item;
  return `${item.slice(0, MAX_LEN).replace(/\s+\S*$/, "")}…`;
}

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
      className="group card-interactive flex items-start gap-3 p-4"
    >
      <GitCommit
        size={14}
        aria-hidden="true"
        className="text-muted-foreground shrink-0 mt-0.5"
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
          className="font-mono text-[11px] tracking-wider text-primary hover:text-foreground transition-colors uppercase inline-flex min-h-11 items-center gap-1"
        >
          {event.repo}
          {event.sha && (
            <span className="text-muted-foreground normal-case tracking-normal lowercase">
              · {event.sha.slice(0, 7)}
            </span>
          )}
          <ExternalLink size={9} aria-hidden="true" className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" />
          <span className="sr-only">(opens in new tab)</span>
        </a>
        <p className="text-sm text-muted-foreground leading-snug mt-0.5 truncate">
          {event.message}
        </p>
      </div>
      <span className="font-mono text-[11px] tracking-wider text-muted-foreground shrink-0 pt-0.5">
        {timeLabel}
      </span>
    </motion.div>
  );
}

export default function CurrentlyBuilding() {
  const { events, lastKnownCommits, lastKnownCachedAt, loading } =
    useGitHubActivity();

  // /now fallback only when neither the live feed nor the last-deploy feed has rows.
  const showFallback =
    !loading && events.length === 0 && lastKnownCommits.length === 0;

  const lastKnownTimeLabel = lastKnownCachedAt
    ? `from last deploy · ${new Date(lastKnownCachedAt).toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric", year: "numeric" }
      )}`
    : "from last deploy · unknown date";

  return (
    <PageWrapper width="6xl" className="w-full pb-20 md:pb-24">
      <Reveal as="section" aria-labelledby="currently-building-heading">
        <SectionHead index="02" title="Currently building" id="currently-building-heading">
          {!loading && events.length > 0 && (
            <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-primary">
              <span aria-hidden="true" className="status-dot" />
              Live
            </span>
          )}
        </SectionHead>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3" aria-busy="true">
            <span className="sr-only">Loading recent activity</span>
            {[0, 1, 2].map((i) => (
              <div key={i} aria-hidden="true" className="p-4 card animate-pulse motion-reduce:animate-none">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-border/60 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-border/60 rounded w-1/4" />
                    <div className="h-3 bg-border/40 rounded w-3/4" />
                  </div>
                  <div className="h-3 bg-border/40 rounded w-12 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fallback — no live activity: the first Building items from /now */}
        {showFallback && (
          <div className="card p-4">
            <ul className="space-y-2">
              {buildingItems.map((item) => (
                <li key={item} className="text-sm leading-snug text-muted-foreground">
                  {brief(item)}
                </li>
              ))}
            </ul>
            <div className="hairline my-4" />
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <Link
                to="/now"
                className="inline-flex min-h-11 items-center font-mono text-[11px] uppercase tracking-[0.18em] text-primary transition-colors hover:text-foreground"
              >
                More on /now →
              </Link>
              <a
                href="https://github.com/ek33450505"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View my latest activity on GitHub (opens in new tab)"
                className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                View my latest activity on GitHub
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            </div>
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
