// Shared GitHub API helpers for the sync-* build scripts.

// Pure — the token is sent only to the real GitHub API origin, never to an
// env-overridden API base (which may be plain http or a foreign host).
export function githubHeaders(url, token) {
  const headers = {
    "User-Agent": "portfolio-sync",
    Accept: "application/vnd.github+json",
  };
  let origin = null;
  try {
    origin = new URL(url).origin;
  } catch { /* invalid URL: no token */ }
  if (token && origin === "https://api.github.com") {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}
