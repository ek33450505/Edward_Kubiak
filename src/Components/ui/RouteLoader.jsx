import { useReducedMotion } from "motion/react";

/**
 * RouteLoader — lightweight Suspense fallback shown while a lazy route chunk
 * is loading. Respects prefers-reduced-motion: spin animation is skipped when
 * the user has opted into reduced motion.
 *
 * Accessibility:
 *   role="status" aria-live="polite" — announced to screen
 *   readers as a live region update without interrupting the current reading.
 *   sr-only span carries the visible text equivalent.
 */
export default function RouteLoader() {
  const prefersReduced = useReducedMotion();

  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[60vh] flex items-center justify-center"
    >
      <span className="sr-only">Loading…</span>
      {/* Outer pulsing ring */}
      <div
        aria-hidden="true"
        className={`relative h-10 w-10 ${prefersReduced ? "" : "animate-pulse"}`}
      >
        {/* Static ring */}
        <div className="absolute inset-0 rounded border-2 border-border-strong" />
        {/* Spinning arc (skipped for reduced-motion) */}
        {!prefersReduced && (
          <div className="absolute inset-0 rounded border-2 border-transparent border-t-primary animate-spin" />
        )}
        {/* Centre dot */}
        <div className="absolute inset-[10px] rounded-sm bg-primary/40" />
      </div>
    </div>
  );
}
