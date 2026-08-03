import { useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Home, User, FolderOpen, FileText, Mail, Clock, ExternalLink, Hash } from "lucide-react";
import { GithubIcon } from "./BrandIcons";
import { useCommandPalette } from "./CommandPaletteContext";

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

// --- Commands ---
const navigateCommands = [
  { id: "home", label: "Home", icon: Home, to: "/" },
  { id: "about", label: "About", icon: User, to: "/about" },
  { id: "projects", label: "Projects", icon: FolderOpen, to: "/projects" },
  { id: "resume", label: "Resume", icon: FileText, to: "/resume" },
  { id: "now", label: "Now", icon: Clock, to: "/now" },
];

// Jump-to-section commands — navigate to /projects with a hash anchor
// matching each real SECTION group key defined in Portfolio.jsx.
const jumpCommands = [
  { id: "jump-flagship",     label: "Jump to Flagship",              hash: "section-flagship" },
  { id: "jump-tools",        label: "Jump to AI & Claude Code Tools", hash: "section-tools" },
  { id: "jump-ecosystem",    label: "Jump to CAST Ecosystem",         hash: "section-ecosystem" },
  { id: "jump-professional", label: "Jump to Professional",           hash: "section-professional" },
];

const externalCommands = [
  { id: "github", label: "GitHub", href: "https://github.com/ek33450505", icon: GithubIcon },
  { id: "email", label: "Email", href: "mailto:edward.kubiak.dev@gmail.com", icon: Mail },
];

const CommandPalette = () => {
  const { open, setOpen } = useCommandPalette();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  // Capture focus target before opening; restore it on close
  useEffect(() => {
    if (open) {
      previousActiveElementRef.current = document.activeElement;
    } else {
      previousActiveElementRef.current?.focus();
    }
  }, [open]);

  // Autofocus the search input whenever the palette opens
  useEffect(() => {
    if (open && inputRef.current) {
      // Small rAF to let the animation mount before focusing
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  // Focus trap: cycle Tab/Shift+Tab within the dialog
  useEffect(() => {
    if (!open || !dialogRef.current) return;

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;
      const focusableElements = [
        ...dialogRef.current.querySelectorAll(FOCUSABLE_SELECTORS),
      ];
      if (focusableElements.length === 0) return;
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [open]);

  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  }, [setOpen]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleNavigate = (to) => {
    navigate(to);
    setOpen(false);
  };

  const handleJump = (hash) => {
    navigate(`/projects#${hash}`);
    setOpen(false);
  };

  const handleExternal = (href) => {
    window.open(href, "_blank", "noopener noreferrer");
    setOpen(false);
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[70] bg-foreground/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[71] flex items-start justify-center pt-[20vh] px-4 pointer-events-none"
          >
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label="Command menu"
              className="w-full max-w-lg pointer-events-auto"
            >
              <Command
                className="rounded border border-border bg-card shadow-xl overflow-hidden"
                label="Command palette"
              >
                <Command.Input
                  ref={inputRef}
                  placeholder="Type a command or search..."
                  aria-label="Search commands"
                  className="w-full px-4 py-3.5 bg-transparent border-b border-border text-foreground placeholder-muted-foreground text-sm outline-none font-mono tracking-wide"
                />
                <Command.List className="max-h-80 overflow-y-auto p-2">
                  <Command.Empty className="py-6 text-center text-sm text-muted-foreground font-mono tracking-wider">
                    No results found.
                  </Command.Empty>

                  <Command.Group
                    heading="Navigate"
                    className="[&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:tracking-[0.3em] [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
                  >
                    {navigateCommands.map(({ id, label, icon: Icon, to }) => (
                      <Command.Item
                        key={id}
                        value={label}
                        onSelect={() => handleNavigate(to)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-muted-foreground cursor-pointer data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary transition-colors"
                      >
                        <Icon size={14} aria-hidden="true" />
                        {label}
                      </Command.Item>
                    ))}
                  </Command.Group>

                  <Command.Separator className="my-1 h-px bg-border" />

                  <Command.Group
                    heading="Jump to Section"
                    className="[&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:tracking-[0.3em] [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
                  >
                    {jumpCommands.map(({ id, label, hash }) => (
                      <Command.Item
                        key={id}
                        value={label}
                        onSelect={() => handleJump(hash)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-muted-foreground cursor-pointer data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary transition-colors"
                      >
                        <Hash size={14} aria-hidden="true" />
                        {label}
                      </Command.Item>
                    ))}
                  </Command.Group>

                  <Command.Separator className="my-1 h-px bg-border" />

                  <Command.Group
                    heading="External"
                    className="[&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:tracking-[0.3em] [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
                  >
                    {externalCommands.map(({ id, label, href, icon: Icon }) => (
                      <Command.Item
                        key={id}
                        value={label}
                        onSelect={() => handleExternal(href)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded text-sm text-muted-foreground cursor-pointer data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary transition-colors"
                      >
                        <Icon size={14} aria-hidden="true" />
                        {label}
                        <ExternalLink size={11} aria-hidden="true" className="ml-auto opacity-40" />
                      </Command.Item>
                    ))}
                  </Command.Group>
                </Command.List>
              </Command>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default CommandPalette;
