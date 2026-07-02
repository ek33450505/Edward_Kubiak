/**
 * Label — tiny uppercase eyebrow / caption.
 *
 * Renders the repeated `font-display text-xs tracking-[0.3em] text-slate-400 uppercase`
 * pattern used for card sub-labels and section eyebrows. Replaces ~9 hand-inlined
 * instances across Resume, ProjectDetail, GetInTouch, etc.
 *
 * Props:
 *   as        string?     element tag to render (default 'span')
 *   className string?     additional classes appended after the base styles
 *   children  ReactNode   label text
 *   ...props              forwarded to the rendered element (e.g. id, aria-*)
 */
export default function Label({ as: Tag = "span", className, children, ...props }) {
  const base = "font-display text-xs tracking-[0.3em] text-slate-400 uppercase";
  const cls = className ? `${base} ${className}` : base;
  return (
    <Tag className={cls} {...props}>
      {children}
    </Tag>
  );
}
