/**
 * IconButton — icon-only interactive control with 44×44px minimum hit target.
 *
 * Renders as <a> when `href` is supplied, <button type="button"> otherwise.
 * The `label` prop is required and maps to aria-label.
 * Relies on the global *:focus-visible ring defined in index.css — no
 * per-element focus-visible overrides are added here.
 *
 * @param {string} label      - Required. Becomes aria-label.
 * @param {string} [href]     - When provided, renders an <a> tag.
 * @param {string} [target]   - Forwarded to <a> (e.g. "_blank").
 * @param {string} [rel]      - Forwarded to <a> (e.g. "noopener noreferrer").
 * @param {string} [title]    - Tooltip text.
 * @param {string} [className] - Additional classes merged after the base set.
 * @param {Function} [onClick] - Click handler (forwarded to button or anchor).
 * @param {React.ReactNode} children - The icon element (caller is responsible
 *                                    for aria-hidden on decorative icons).
 */
export default function IconButton({
  label,
  href,
  target,
  rel,
  title,
  className,
  onClick,
  children,
  ...rest
}) {
  const base =
    "inline-flex items-center justify-center min-w-11 min-h-11 text-slate-400 hover:text-accent-400 transition-colors rounded-md";
  const combined = className ? `${base} ${className}` : base;

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        aria-label={label}
        title={title}
        onClick={onClick}
        className={combined}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      title={title}
      onClick={onClick}
      className={combined}
      {...rest}
    >
      {children}
    </button>
  );
}
