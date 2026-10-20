import { useState, useEffect } from "react";

/**
 * 2-tier GitHub activity fetch hook. No visitor-side api.github.com call (rate-limited
 * per IP, and the Events API no longer carries commits).
 *
 * Resolution order:
 *  1. /github-activity.json  — static JSON written at build time by
 *     scripts/sync-github-activity.mjs, no rate limit
 *  2. /last-known-commits.json — fallback from the last build that resolved commits
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
      // Tier 1: pre-built static file (generated at build time, no rate limit)
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
        // static file unavailable — fall through to last-known
      }

      // Tier 2: last-known-commits fallback
      try {
        const lastKnownRes = await fetch("/last-known-commits.json");
        if (lastKnownRes.ok) {
          const lastKnownData = await lastKnownRes.json();
          if (!cancelled) {
            if (lastKnownData.commits && lastKnownData.commits.length > 0) {
              setLastKnownCommits(lastKnownData.commits);
              setLastKnownCachedAt(lastKnownData.cachedAt || "");
            } else {
              setError(true);
            }
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

    loadActivity();
    return () => {
      cancelled = true;
    };
  }, []);

  return { events, lastKnownCommits, lastKnownCachedAt, loading, error };
}
