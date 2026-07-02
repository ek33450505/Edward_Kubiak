import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop — restores scroll position on every client-side navigation.
 *
 * Renders nothing (returns null). Mount once inside <Router> so useLocation
 * is available, before <NavBar> so the scroll fires before the new page
 * content is painted.
 *
 * Uses instant scroll (no smooth-scroll) which is inherently motion-safe and
 * compatible with AnimatePresence mode="wait" page transitions.
 *
 * Hash-aware: when a URL carries a hash (e.g. /projects#section-flagship),
 * the scroll-to-top is skipped so the hash anchor scroll takes precedence.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // When a hash is present, let the target component scroll to the anchor
    if (hash) return;
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname, hash]);

  return null;
}
