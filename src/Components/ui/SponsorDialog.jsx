import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Heart, Coffee, ArrowUpRight, X } from "lucide-react";
import IconButton from "./IconButton";
import { SPONSOR_LINKS } from "../../data/sponsor";

const ICONS = {
  github: <Heart size={20} className="text-terra" aria-hidden="true" />,
  kofi: <Coffee size={20} className="text-sepia" aria-hidden="true" />,
};

/**
 * SponsorDialog — modal chooser between GitHub Sponsors and Ko-fi.
 *
 * Native <dialog> opened with showModal(), so the browser supplies focus
 * containment, Esc and an inert page. Portalled to <body> so ancestor
 * transforms cannot affect it. Controlled: `open` + `onClose`.
 */
function SponsorDialog({ open, onClose }) {
  const ref = useRef(null);
  const pressTarget = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Backdrop click is a pointer convenience; Esc and the Close button are the keyboard paths.
  return createPortal(
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={() => {
        // Ignore a stale close from a previous cycle once the dialog is re-opened.
        if (!ref.current?.open) onClose();
      }}
      onPointerDown={(e) => {
        pressTarget.current = e.target;
      }}
      onClick={(e) => {
        // Close only on a press AND release both on the backdrop (not a drag-select either way).
        const dialog = ref.current;
        const r = dialog.getBoundingClientRect();
        const outside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
        const pressed = pressTarget.current;
        pressTarget.current = null;
        if (e.target === dialog && pressed === dialog && outside) dialog.close();
      }}
      className="panel bg-card text-foreground border border-border-strong rounded p-0 m-auto w-[calc(100%-2rem)] max-w-md backdrop:bg-background/80"
    >
      <div className="panel-head flex items-center justify-between">
        <h2
          id={titleId}
          className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground"
        >
          Support my work
        </h2>
        <IconButton label="Close" onClick={() => ref.current?.close()}>
          <X size={16} aria-hidden="true" />
        </IconButton>
      </div>
      <div className="p-6 flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">Open source, built in the open.</p>
        {SPONSOR_LINKS.map(({ id, label, href, note }) => (
          <a
            key={id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${label}: ${note.charAt(0).toLowerCase()}${note.slice(1)} (opens in new tab)`}
            onClick={() => ref.current?.close()}
            className="group flex items-center gap-4 p-4 card-interactive min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {ICONS[id]}
            <span className="flex flex-col flex-1 min-w-0">
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-foreground">
                {label}
              </span>
              <span className="text-sm text-muted-foreground">{note}</span>
            </span>
            <ArrowUpRight size={14} className="opacity-60 group-hover:opacity-100" aria-hidden="true" />
          </a>
        ))}
      </div>
    </dialog>,
    document.body,
  );
}

/**
 * SponsorButton — the shared trigger. Owns open state, the trigger ref and the
 * dialog. Callers pass className, aria-label and children for the trigger.
 */
export function SponsorButton({ className, children, "aria-label": ariaLabel }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  const handleClose = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-label={ariaLabel}
        className={className}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>
      <SponsorDialog open={open} onClose={handleClose} />
    </>
  );
}

export default SponsorDialog;
