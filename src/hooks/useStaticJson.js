import { useState, useEffect } from "react";

/**
 * useStaticJson — generic hook for fetching a static public JSON file.
 *
 * Fires a single fetch on mount with a cancelled-flag cleanup so stale
 * responses from unmounted components are discarded.  On a non-ok
 * response or a network error the hook resolves to `fallback` instead
 * of throwing, matching the fail-silent behaviour expected by portfolio
 * components that rely on static assets.
 *
 * Mirror of the fetch/cleanup pattern in useGitHubStars.js — no
 * module-level cache because static JSON files are served from the CDN
 * edge and a per-request round-trip is cheap.
 *
 * @param {string} path               - URL path to the JSON file (e.g. "/cast-stats.json").
 * @param {object} [options]
 * @param {*}      [options.fallback=null] - Value returned as `data` when the
 *   fetch fails or the response is not ok.
 * @returns {{ data: *, loading: boolean, error: Error|null }}
 */
export function useStaticJson(path, { fallback = null } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(path)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setData(fallback);
        setError(err);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // `fallback` is stable in all call sites (module-level const or null).
    // Including it in deps causes no practical re-fetches and keeps the rule happy.
  }, [path, fallback]);

  return { data, loading, error };
}
