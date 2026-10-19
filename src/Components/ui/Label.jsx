/**
 * Label — tiny uppercase eyebrow / caption.
 *
 * Renders the repeated `font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase`
 * pattern used for card sub-labels and section eyebrows. Replaces ~9 hand-inlined
 * instances across Resume, ProjectDetail, GetInTouch, etc.
 *
 * Props:
 *   as        string?     element tag to render (default 'span')
 *   variant   string?     "default" | "panel" (panel-head sizing/tracking)
 *   className string?     additional classes appended after the base styles
 *   children  ReactNode   label text
 *   ...props              forwarded to the rendered element (e.g. id, aria-*)
 */
const VARIANTS = {
  default: "font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase",
  panel: "font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase",
};

export default function Label({ as: Tag = "span", variant = "default", className, children, ...props }) {
  const base = Object.hasOwn(VARIANTS, variant) ? VARIANTS[variant] : VARIANTS.default;
  const cls = className ? `${base} ${className}` : base;
  return (
    <Tag className={cls} {...props}>
      {children}
    </Tag>
  );
}
