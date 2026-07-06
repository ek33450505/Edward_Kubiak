/**
 * SectionHeader — renders a section/page heading + accent underline.
 *
 * Props:
 *   title            ReactNode          heading text (may contain JSX spans for colour)
 *   id               string?            id attribute on the heading element (for aria-labelledby)
 *   as               string?            heading element tag (default "h2")
 *   tone             'muted' | 'accent' heading colour tone when headingClassName is not set
 *                                       (default 'muted' → text-muted-foreground; 'accent' → text-primary)
 *   headingClassName string?            fully overrides heading element className (tone ignored when set)
 *   underlineClassName string?          spacing class before the underline div (default "mt-2")
 *   children         ReactNode?         optional badge / inline element rendered after title text
 */

const TONE_COLOR = {
  muted: "text-muted-foreground",
  accent: "text-primary",
};

export default function SectionHeader({
  title,
  id,
  as: Tag = "h2",
  tone = "muted",
  headingClassName,
  underlineClassName = "mt-2",
  children,
}) {
  const toneColor = TONE_COLOR[tone] ?? TONE_COLOR.muted;
  const defaultClass = `font-mono text-xs tracking-[0.3em] ${toneColor} uppercase`;
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
      <div className={`${underlineClassName} h-px w-full bg-border`} />
    </div>
  );
}
