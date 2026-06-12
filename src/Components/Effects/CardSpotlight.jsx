import { useState, useRef, useEffect } from "react";

/**
 * Wraps children in a card that has a radial-gradient spotlight
 * that follows the cursor on hover. The spotlight color and size
 * can be customized via props.
 *
 * mousemove listener uses { passive: true } and rAF throttling
 * to avoid layout-blocking and improve scroll performance.
 */
export default function CardSpotlight({
  children,
  className = "",
  spotlightColor = "rgba(0, 255, 194, 0.08)",
  spotlightSize = 250,
}) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let rafId = null;

    const handleMove = (e) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        setPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        rafId = null;
      });
    };

    const handleEnter = () => setIsHovered(true);
    const handleLeave = () => setIsHovered(false);

    el.addEventListener("mousemove", handleMove, { passive: true });
    el.addEventListener("mouseenter", handleEnter, { passive: true });
    el.addEventListener("mouseleave", handleLeave, { passive: true });

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseenter", handleEnter);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={{
        background: isHovered
          ? `radial-gradient(${spotlightSize}px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`
          : undefined,
      }}
    >
      {children}
    </div>
  );
}
