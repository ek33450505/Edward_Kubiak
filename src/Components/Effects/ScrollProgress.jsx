import { motion, useScroll, useSpring } from "motion/react";

/**
 * A thin amber progress bar fixed at the top of the viewport
 * that fills left-to-right as the user scrolls down the page.
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-amber-400 z-[60] origin-left"
      style={{ scaleX }}
    />
  );
}
