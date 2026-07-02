/**
 * Reveal — shared scroll-reveal wrapper that encapsulates the common
 * `variants + initial="hidden" + whileInView="show" + viewport` cluster.
 *
 * Replaces ~30 hand-copied occurrences of:
 *   <motion.div
 *     variants={fadeUp}
 *     initial="hidden"
 *     whileInView="show"
 *     viewport={{ once: true, margin: "-60px" }}
 *   >
 *
 * The `variants` prop accepts any named export from `src/utils/motion.js`:
 *   fadeUp (default), fadeIn, staggerContainer, staggerItem, slideInLeft.
 *
 * Spreading `...props` lets callers pass `transition`, `style`, `aria-*`, etc.
 *
 * @param {string}  [as="div"]       - HTML element (or motion component key) to render.
 * @param {object}  [variants=fadeUp] - Motion variants object (hidden/show states).
 * @param {boolean} [once=true]      - Whether the animation fires only the first time.
 * @param {string}  [margin="-60px"] - Intersection observer root margin for trigger offset.
 * @param {string}  [className]      - Extra CSS classes forwarded to the element.
 * @param {React.ReactNode} children - Content to reveal.
 */

import { motion } from "motion/react";
import { fadeUp } from "../../utils/motion";

export default function Reveal({
  as = "div",
  variants = fadeUp,
  once = true,
  margin = "-60px",
  className,
  children,
  ...props
}) {
  const MotionTag = motion[as];

  return (
    <MotionTag
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin }}
      className={className}
      {...props}
    >
      {children}
    </MotionTag>
  );
}
