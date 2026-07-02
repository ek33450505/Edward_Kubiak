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
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return null;
}
