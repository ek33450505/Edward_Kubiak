import { useRef, useState, useEffect } from "react";

/**
 * useFrameloopWhenVisible
 *
 * Returns a `[ref, frameloop]` tuple for use with @react-three/fiber Canvas.
 * - `ref` should be attached to the container element.
 * - `frameloop` is "always" when the container is intersecting the viewport,
 *   "demand" otherwise — pausing the render loop when off-screen.
 *
 * Reduced-motion handling: when `reducedMotion` is true, the IntersectionObserver
 * is never created (the component should render null in that case anyway). This
 * prevents the edge case where the observer is set up but then never cleaned up
 * if `reducedMotion` toggles true while the component is mounted.
 *
 * @param {boolean} reducedMotion - From useReducedMotion(); skip observer when true.
 * @returns {[React.RefObject, "always" | "demand"]}
 */
export function useFrameloopWhenVisible(reducedMotion) {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Do not set up the observer when reduced motion is active.
    // The calling component returns null in that branch, so this guard is
    // belt-and-suspenders — it also prevents a stale observer if the
    // prefers-reduced-motion media query toggles after mount.
    if (reducedMotion) return;

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const frameloop = isVisible ? "always" : "demand";
  return [containerRef, frameloop];
}
