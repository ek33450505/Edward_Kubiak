import { useState, useEffect } from "react";

/**
 * 3-tier GitHub activity fetch hook.
 *
 * Resolution order (mirrors static-first pattern from useGitHubStars):
 *  1. /github-activity.json  — static JSON baked at deploy time, no rate limit
 *  2. Live GitHub Events API  — api.github.com/users/ek33450505/events
 *  3. /last-known-commits.json — last-resort fallback from previous deploy
 *
 * Uses a cancelled flag for cleanup on unmount (same pattern as useGitHubStars).
 *
 * @returns {{
 *   events: Array,
 *   lastKnownCommits: Array,
 *   lastKnownCachedAt: string,
 *   loading: boolean,
 *   error: boolean,
 * }}
 */
export function useGitHubActivity() {
  const [events, setEvents] = useState([]);
  const [lastKnownCommits, setLastKnownCommits] = useState([]);
  const [lastKnownCachedAt, setLastKnownCachedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadActivity() {
      // Tier 1: pre-built static file (generated at deploy time, no rate limit)
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

      // Tier 2: live GitHub Events API
      try {
        const res = await fetch(
          "https://api.github.com/users/ek33450505/events?per_page=30"
        );
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
        // Tier 3: last-known-commits fallback
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

  return { events, lastKnownCommits, lastKnownCachedAt, loading, error };
}
