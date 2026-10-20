import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { CAST_STATS } from "./data/castStats";
import { ATLAS_STATS } from "./data/atlasStats";
import { useDocumentMeta } from "./hooks/useDocumentMeta";
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { Menu, X, Rss } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "./Components/BrandIcons";
import IconButton from "./Components/ui/IconButton";
import { SponsorButton } from "./Components/ui/SponsorDialog";
import ScrollProgress from "./Components/Effects/ScrollProgress";
import ErrorBoundary from "./Components/ErrorBoundary";
import RouteLoader from "./Components/ui/RouteLoader";
import NotFound from "./Components/ui/NotFound";
import ScrollToTop from "./Components/ScrollToTop";
import { ROUTE_META } from "./data/routeMeta.js";
import { normalizePath } from "./lib/paths.js";
import Home from "./Components/Home";
import { CommandPaletteProvider, useCommandPalette } from "./Components/CommandPaletteContext";
import "./App.css";

const About = lazy(() => import("./Components/About"));
const Portfolio = lazy(() => import("./Components/Portfolio"));
const ProjectDetail = lazy(() => import("./Components/ProjectDetail"));
const Resume = lazy(() => import("./Components/Resume"));
const Now = lazy(() => import("./Components/Now"));
const Practice = lazy(() => import("./Components/Practice"));
const Contact = lazy(() => import("./Components/Contact"));
const Accessibility = lazy(() => import("./Components/Accessibility"));
const CommandPalette = lazy(() => import("./Components/CommandPalette"));
const navLinks = [
  { to: "/projects", label: "Work" },
  { to: "/practice", label: "Practice" },
  { to: "/about", label: "About" },
  { to: "/resume", label: "Resume" },
  { to: "/contact", label: "Contact" },
];

export function NavBar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const path = normalizePath(location.pathname);
  const { toggle } = useCommandPalette();

  // Close the menu on route change — this covers back/forward navigation, where
  // no nav-link onClick fires. Adjusting state during render on a changed value
  // is React's documented alternative to an effect here; an effect calling
  // setState in its body costs an extra render pass every navigation.
  const [renderedPath, setRenderedPath] = useState(path);
  if (renderedPath !== path) {
    setRenderedPath(path);
    setOpen(false);
  }

  // Escape closes the open menu and returns focus to the toggle. Registered only
  // while open, and ignores Escape pressed inside a dialog (command palette,
  // sponsor chooser): those own that keypress and restore focus themselves.
  const toggleRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (e.target instanceof Element && e.target.closest('dialog, [role="dialog"]')) return;
      setOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // "page" on the exact route; "true" (current section) on a project detail page
  // for Work. "true" keeps the a11y gate's aria-current="page" count valid.
  const currentFor = (to) => {
    if (path === to) return "page";
    if (to === "/projects" && path.startsWith("/projects/")) return "true";
    return undefined;
  };

  return (
    <header>
      <nav aria-label="Primary" className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-(--spacing-nav)">
          {/* Masthead — mono monogram + name */}
          <Link
            to="/"
            aria-current={path === "/" ? "page" : undefined}
            className="flex items-center gap-3 group"
            onClick={() => setOpen(false)}
          >
            <span
              aria-hidden="true"
              className="inline-flex h-7 w-7 items-center justify-center border border-border-strong font-mono text-[11px] font-semibold tracking-tight text-foreground group-hover:text-primary group-hover:border-primary transition-colors"
            >
              EK
            </span>
            <span className="font-display font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
              Edward Kubiak
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => {
              const current = currentFor(to);
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={current}
                  className={`relative px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors duration-300 ${
                    current
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                  {current && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute -bottom-px left-2 right-2 h-px bg-primary"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
            {/* ⌘K affordance */}
            <IconButton
              label="Open command palette"
              title="Open command palette"
              onClick={toggle}
              className="ml-2"
            >
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded border border-border-strong text-[10px] font-mono tracking-wider text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                ⌘K
              </span>
            </IconButton>
            <IconButton
              href="https://github.com/ek33450505"
              target="_blank"
              rel="noopener noreferrer"
              label="GitHub profile (opens in new tab)"
              title="GitHub"
              className="ml-2"
            >
              <GithubIcon size={20} aria-hidden="true" />
            </IconButton>
          </div>

          {/* Mobile toggle */}
          <IconButton
            ref={toggleRef}
            label="Toggle menu"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls={open ? "mobile-menu" : undefined}
            className="md:hidden"
          >
            {open ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
          </IconButton>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              id="mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden border-t border-border bg-background/95 backdrop-blur"
            >
              <div className="px-6 py-4 flex flex-col gap-2">
                {navLinks.map(({ to, label }) => {
                  const current = currentFor(to);
                  return (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setOpen(false)}
                      aria-current={current}
                      className={`font-mono text-xs tracking-[0.18em] uppercase py-3 min-h-11 border-b border-border transition-colors ${
                        current
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {label}
                    </Link>
                  );
                })}
                {/* Search / ⌘K row */}
                <button
                  onClick={() => { setOpen(false); toggle(); }}
                  className="flex items-center gap-2 py-3 text-muted-foreground hover:text-primary font-mono text-xs tracking-[0.18em] uppercase transition-colors border-b border-border text-left min-h-11"
                >
                  Search <span className="ml-1 px-1.5 py-0.5 rounded border border-border-strong text-[10px] text-muted-foreground">⌘K</span>
                </button>
                <a
                  href="https://github.com/ek33450505"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub profile (opens in new tab)"
                  className="flex items-center gap-2 py-3 text-muted-foreground hover:text-primary font-mono text-xs tracking-[0.18em] uppercase transition-colors min-h-11"
                >
                  <GithubIcon size={18} aria-hidden="true" /> GITHUB
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  const path = normalizePath(location.pathname);

  // Project detail routes manage their own meta via useDocumentMeta —
  // pass an empty object here so we do not fight them.
  const isProjectDetail = path.startsWith("/projects/");
  const routeMeta = isProjectDetail
    ? {}
    : (ROUTE_META[path] ?? { title: "Edward Kubiak" });

  useDocumentMeta(routeMeta);

  // Fire a Plausible SPA pageview on every client-side navigation.
  // Plausible's default script only tracks hard navigations; this covers
  // the rest. Guard for undefined to be safe in local dev without the script.
  useEffect(() => {
    window.plausible?.("pageview");
  }, [path]);

  return (
    <AnimatePresence>
      <motion.div
        key={path}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="page-content"
      >
        <Suspense fallback={<RouteLoader />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/projects" element={<Portfolio />} />
            <Route path="/projects/:slug" element={<ProjectDetail />} />
            <Route path="/resume" element={<Resume />} />
            <Route path="/now" element={<Now />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/accessibility" element={<Accessibility />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

// Everything except the palette goes inert while the modal palette is open,
// so the background is out of the tab order and the accessibility tree.
export function AppShell() {
  const { open } = useCommandPalette();
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-background">
        <div inert={open}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-background focus:rounded focus:font-mono focus:text-sm focus:font-bold focus:tracking-widest focus:uppercase"
          >
            Skip to main content
          </a>
          <ScrollToTop />
          <ScrollProgress />
          <NavBar />
          <main id="main-content" className="pt-(--spacing-nav)">
            <ErrorBoundary>
              <AnimatedRoutes />
            </ErrorBoundary>
          </main>

          {/* Footer — colophon strip */}
          <footer className="border-t border-border py-8">
            <div className="max-w-6xl mx-auto px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-muted-foreground">
              <div className="flex flex-col gap-1">
                <p className="text-sm">&copy; {new Date().getFullYear()} Edward Kubiak</p>
                <p className="font-mono text-[11px] tracking-wide text-muted-foreground">
                  CAST {CAST_STATS.version} · Compute Atlas {ATLAS_STATS.version} · stats synced {CAST_STATS.updated}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/contact"
                  className="inline-flex items-center min-h-11 px-2 font-mono text-[11px] uppercase tracking-[0.18em] hover:text-primary transition-colors"
                >
                  Contact
                </Link>
                <Link
                  to="/now"
                  className="inline-flex items-center min-h-11 px-2 font-mono text-[11px] uppercase tracking-[0.18em] hover:text-primary transition-colors"
                >
                  Now
                </Link>
                <Link
                  to="/accessibility"
                  className="inline-flex items-center min-h-11 px-2 font-mono text-[11px] uppercase tracking-[0.18em] hover:text-primary transition-colors"
                >
                  Accessibility
                </Link>
                <SponsorButton
                  aria-label="Sponsor Edward's open source work: choose GitHub Sponsors or Ko-fi"
                  className="inline-flex items-center min-h-11 px-2 font-mono text-[11px] uppercase tracking-[0.18em] hover:text-primary transition-colors"
                >
                  Sponsor
                </SponsorButton>
                <IconButton
                  href="https://github.com/ek33450505"
                  target="_blank"
                  rel="noopener noreferrer"
                  label="GitHub profile (opens in new tab)"
                  title="GitHub"
                >
                  <GithubIcon size={16} aria-hidden="true" />
                </IconButton>
                <IconButton
                  href="https://www.linkedin.com/in/edward-kubiak/"
                  target="_blank"
                  rel="noopener noreferrer"
                  label="LinkedIn profile (opens in new tab)"
                  title="LinkedIn"
                >
                  <LinkedinIcon size={16} aria-hidden="true" />
                </IconButton>
                <IconButton href="/rss.xml" label="RSS feed" title="RSS Feed">
                  <Rss size={16} aria-hidden="true" />
                </IconButton>
              </div>
            </div>
          </footer>
        </div>
        <Suspense fallback={null}>
          <CommandPalette />
        </Suspense>
      </div>
    </MotionConfig>
  );
}

function App() {
  return (
    <Router>
      <CommandPaletteProvider>
        <AppShell />
      </CommandPaletteProvider>
    </Router>
  );
}

export default App;
