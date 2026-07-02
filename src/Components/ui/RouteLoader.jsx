import { useReducedMotion } from "motion/react";

/**
 * RouteLoader — lightweight Suspense fallback shown while a lazy route chunk
 * is loading. Respects prefers-reduced-motion: spin animation is skipped when
 * the user has opted into reduced motion.
 *
 * Accessibility:
 *   role="status" aria-live="polite" aria-busy="true" — announced to screen
 *   readers as a live region update without interrupting the current reading.
 *   sr-only span carries the visible text equivalent.
 */
export default function RouteLoader() {
  const prefersReduced = useReducedMotion();

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="min-h-[60vh] flex items-center justify-center"
    >
      <span className="sr-only">Loading…</span>
      {/* Outer pulsing ring */}
      <div
        aria-hidden="true"
        className={`relative w-10 h-10 ${prefersReduced ? "" : "animate-pulse"}`}
      >
        {/* Static ring */}
        <div className="absolute inset-0 rounded-full border-2 border-accent-400/20" />
        {/* Spinning arc (skipped for reduced-motion) */}
        {!prefersReduced && (
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent-400 animate-spin" />
        )}
        {/* Centre dot */}
        <div className="absolute inset-[10px] rounded-full bg-accent-400/40" />
      </div>
    </div>
  );
}
