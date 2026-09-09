import { useState, useEffect } from "react";

/**
 * Module-level cache shared across all consumers.
 * starsCache   — settled map data (non-null once the first fetch completes)
 * starsCachePromise — in-flight promise so concurrent callers share one fetch
 */
let starsCache = null;
let starsCachePromise = null;

/**
 * Fetches /github-stars.json once and caches the result for the lifetime of
 * the module.  Subsequent calls return the cached data synchronously (wrapped
 * in a resolved promise) without making a new network request.
 *
 * On fetch failure the cache is set to {} so downstream callers fall back to
 * the live GitHub API or simply show no star count.
 *
 * @returns {Promise<Record<string, number>>}
 */
export function fetchStarsMap() {
  if (starsCache !== null) return Promise.resolve(starsCache);
  if (starsCachePromise) return starsCachePromise;
  starsCachePromise = fetch("/github-stars.json")
    .then((res) => {
      if (!res.ok) throw new Error("not found");
      return res.json();
    })
    .then((data) => {
      starsCache = data;
      return data;
    })
    .catch(() => {
      starsCache = {};
      return {};
    });
  return starsCachePromise;
}

/**
 * React hook — resolves the star count for a given GitHub repo.
 *
 * Resolution order:
 *  1. /github-stars.json cache (static JSON baked at build time)
 *  2. Live GitHub REST API fallback (api.github.com/repos/{owner}/{repo})
 *  3. null — if both fail or owner/repo are absent
 *
 * @param {string|undefined} owner - GitHub org or user
 * @param {string|undefined} repo  - repository name
 * @returns {{ stars: number|null, loading: boolean }} loading is derived, not stored
 */
export function useGitHubStars(owner, repo) {
  const target = owner && repo ? `${owner}/${repo}` : null;

  // One piece of state, tagged with the target it describes. Loading is DERIVED
  // from whether the resolved target matches the requested one, so the effect
  // never calls setState in its own body — only from async callbacks, which is
  // what effects are for. It also means a stale count is never reported while a
  // new owner/repo is still resolving.
  const [resolved, setResolved] = useState({ target: null, stars: null });

  useEffect(() => {
    if (!target) return undefined;

    let cancelled = false;
    fetchStarsMap()
      .then((map) => {
        if (cancelled) return undefined;
        if (repo in map) {
          setResolved({ target, stars: map[repo] });
          return undefined;
        }
        return fetch(`https://api.github.com/repos/${owner}/${repo}`)
          .then((res) => {
            if (!res.ok) throw new Error("API error");
            return res.json();
          })
          .then((data) => {
            if (!cancelled) {
              setResolved({ target, stars: data.stargazers_count ?? null });
            }
          });
      })
      .catch(() => {
        if (!cancelled) setResolved({ target, stars: null });
      });

    return () => {
      cancelled = true;
    };
  }, [owner, repo, target]);

  const isCurrent = resolved.target === target;
  return {
    stars: isCurrent ? resolved.stars : null,
    loading: target !== null && !isCurrent,
  };
}
