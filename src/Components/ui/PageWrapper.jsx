/**
 * PageWrapper — standard page content container.
 *
 * Wraps children in the repeated `max-w-{width} mx-auto px-6` container.
 *
 * Props:
 *   children  ReactNode        content
 *   className string?          additional classes merged onto the wrapper div
 *   width     '4xl' | '6xl'   max-width variant (default '4xl' → max-w-4xl)
 */

const WIDTH_MAP = {
  "4xl": "max-w-4xl",
  "6xl": "max-w-6xl",
};

export default function PageWrapper({ children, className, width = "4xl" }) {
  const maxW = WIDTH_MAP[width] ?? WIDTH_MAP["4xl"];
  const base = `${maxW} mx-auto px-6`;
  const cls = className ? `${base} ${className}` : base;
  return <div className={cls}>{children}</div>;
}
