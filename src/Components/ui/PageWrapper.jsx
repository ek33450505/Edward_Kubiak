/**
 * PageWrapper — standard page content container.
 *
 * Wraps children in the repeated `max-w-4xl mx-auto px-6` container.
 *
 * Props:
 *   children  ReactNode    content
 *   className string?      additional classes merged onto the wrapper div
 */
export default function PageWrapper({ children, className }) {
  const base = "max-w-4xl mx-auto px-6";
  const cls = className ? `${base} ${className}` : base;
  return <div className={cls}>{children}</div>;
}
