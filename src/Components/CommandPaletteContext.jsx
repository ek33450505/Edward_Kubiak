import { useState, useCallback, createContext, useContext } from "react";

// Context + hook only — deliberately free of the `cmdk` dependency so the
// Provider (which wraps the whole tree) and useCommandPalette (used by
// NavBar) can stay in the eager bundle while the cmdk-heavy palette UI
// itself (CommandPalette.jsx) is lazy-loaded.
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
