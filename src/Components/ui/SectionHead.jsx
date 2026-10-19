/**
 * SectionHead — console section header: mono index + Geist title + hairline.
 *
 * Props:
 *   index     string     two-digit section index ("01")
 *   title     string     heading text (rendered as h2)
 *   id        string?    id on the heading, for aria-labelledby
 *   children  ReactNode? optional right-aligned meta (mono label, link)
 */
export default function SectionHead({ index, title, id, children }) {
  return (
    <div className="mb-8">
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <span aria-hidden="true" className="font-mono text-xs tabular-nums text-primary">
            {index} /
          </span>
          <h2 id={id} className="font-display text-2xl font-semibold tracking-[-0.02em] text-foreground">
            {title}
          </h2>
        </div>
        {children}
      </div>
      <div className="hairline mt-3" />
    </div>
  );
}
