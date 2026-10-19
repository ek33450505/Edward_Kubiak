/**
 * Strip trailing slashes from a pathname (root stays "/"). GitHub Pages 301s
 * `/about` to `/about/` (prerendered `about/index.html`), so the router sees the
 * slashed form while route tables and nav links use the bare one.
 */
export function normalizePath(pathname) {
  const stripped = (pathname ?? "").replace(/\/+$/, "");
  return stripped === "" ? "/" : stripped;
}
