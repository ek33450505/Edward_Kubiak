import { useState, useRef } from "react";

/**
 * Wraps children in a card that has a radial-gradient spotlight
 * that follows the cursor on hover. The spotlight color and size
 * can be customized via props.
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

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
