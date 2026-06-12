/**
 * SectionHeader — renders a section/page heading + amber accent underline.
 *
 * Props:
 *   title           ReactNode   heading text (may contain JSX spans for color)
 *   id              string?     id attribute on the heading element (for aria-labelledby)
 *   as              string?     heading element tag (default "h2")
 *   headingClassName string?    override heading element className
 *                               (default: "font-display text-xs tracking-[0.3em] text-slate-400 uppercase")
 *   underlineClassName string?  spacing class before the underline div (default "mt-2")
 *   children        ReactNode?  optional badge / inline element rendered after title text
 */
export default function SectionHeader({
  title,
  id,
  as: Tag = "h2",
  headingClassName,
  underlineClassName = "mt-2",
  children,
}) {
  const defaultClass =
    "font-display text-xs tracking-[0.3em] text-slate-400 uppercase";
  const cls = headingClassName !== undefined ? headingClassName : defaultClass;

  const heading = (
    <Tag id={id} className={cls}>
      {title}
    </Tag>
  );

  return (
    <div>
      {children ? (
        <div className="flex items-center gap-2">
          {heading}
          {children}
        </div>
      ) : (
        heading
      )}
      <div className={`${underlineClassName} w-16 h-0.5 bg-amber-400/60`} />
    </div>
  );
}
