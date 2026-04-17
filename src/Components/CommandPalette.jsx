import { useEffect, useState, useCallback, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Home, User, FolderOpen, FileText, Mail, Clock, Github, ExternalLink, Filter } from "lucide-react";

// --- Context ---
const CommandPaletteContext = createContext(null);

export function CommandPaletteProvider({ children }) {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((prev) => !prev), []);
  return (
    <CommandPaletteContext.Provider value={{ open, setOpen, toggle }}>
      {children}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be used within CommandPaletteProvider");
  return ctx;
}

// --- Commands ---
const navigateCommands = [
  { id: "home", label: "Home", icon: Home, to: "/" },
  { id: "about", label: "About", icon: User, to: "/about" },
  { id: "projects", label: "Projects", icon: FolderOpen, to: "/projects" },
  { id: "resume", label: "Resume", icon: FileText, to: "/resume" },
  { id: "now", label: "Now", icon: Clock, to: "/now" },
];

const filterCommands = [
  { id: "filter-all", label: "All Projects", filter: "" },
  { id: "filter-featured", label: "Featured Projects", filter: "featured" },
  { id: "filter-ai", label: "AI Engineering", filter: "ai-engineering" },
  { id: "filter-cast", label: "CAST Ecosystem", filter: "cast-ecosystem" },
  { id: "filter-professional", label: "Professional", filter: "professional" },
  { id: "filter-personal", label: "Personal", filter: "personal" },
];

const externalCommands = [
  { id: "github", label: "GitHub", href: "https://github.com/ek33450505", icon: Github },
  { id: "devto", label: "DEV.to", href: "https://dev.to/edwardkubiak", icon: ExternalLink },
  { id: "email", label: "Email", href: "mailto:edward.kubiak.dev@gmail.com", icon: Mail },
];

const CommandPalette = () => {
  const { open, setOpen } = useCommandPalette();
  const navigate = useNavigate();

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

  const handleFilter = (filter) => {
    navigate(filter ? `/projects?filter=${filter}` : "/projects");
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
            className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[71] flex items-start justify-center pt-[20vh] px-4 pointer-events-none"
          >
            <div className="w-full max-w-lg pointer-events-auto">
              <Command
                className="rounded-xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden"
                label="Command palette"
              >
                <Command.Input
                  placeholder="Type a command or search..."
                  className="w-full px-4 py-3.5 bg-transparent border-b border-slate-800 text-slate-100 placeholder-slate-600 text-sm outline-none font-display tracking-wide"
                />
                <Command.List className="max-h-80 overflow-y-auto p-2">
                  <Command.Empty className="py-6 text-center text-sm text-slate-600 font-display tracking-wider">
                    No results found.
                  </Command.Empty>

                  <Command.Group
                    heading="Navigate"
                    className="[&_[cmdk-group-heading]]:font-display [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:tracking-[0.3em] [&_[cmdk-group-heading]]:text-slate-600 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
                  >
                    {navigateCommands.map(({ id, label, icon: Icon, to }) => (
                      <Command.Item
                        key={id}
                        value={label}
                        onSelect={() => handleNavigate(to)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 cursor-pointer data-[selected=true]:bg-amber-400/10 data-[selected=true]:text-amber-400 transition-colors"
                      >
                        <Icon size={14} />
                        {label}
                      </Command.Item>
                    ))}
                  </Command.Group>

                  <Command.Separator className="my-1 h-px bg-slate-800/60" />

                  <Command.Group
                    heading="Filter Projects"
                    className="[&_[cmdk-group-heading]]:font-display [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:tracking-[0.3em] [&_[cmdk-group-heading]]:text-slate-600 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
                  >
                    {filterCommands.map(({ id, label, filter }) => (
                      <Command.Item
                        key={id}
                        value={label}
                        onSelect={() => handleFilter(filter)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 cursor-pointer data-[selected=true]:bg-amber-400/10 data-[selected=true]:text-amber-400 transition-colors"
                      >
                        <Filter size={14} />
                        {label}
                      </Command.Item>
                    ))}
                  </Command.Group>

                  <Command.Separator className="my-1 h-px bg-slate-800/60" />

                  <Command.Group
                    heading="External"
                    className="[&_[cmdk-group-heading]]:font-display [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:tracking-[0.3em] [&_[cmdk-group-heading]]:text-slate-600 [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
                  >
                    {externalCommands.map(({ id, label, href, icon: Icon }) => (
                      <Command.Item
                        key={id}
                        value={label}
                        onSelect={() => handleExternal(href)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 cursor-pointer data-[selected=true]:bg-amber-400/10 data-[selected=true]:text-amber-400 transition-colors"
                      >
                        <Icon size={14} />
                        {label}
                        <ExternalLink size={11} className="ml-auto opacity-40" />
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
