import { useState, useEffect, lazy, Suspense } from "react";
import { useDocumentMeta } from "./hooks/useDocumentMeta";
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { Menu, X, Rss } from "lucide-react";
import { GithubIcon, LinkedinIcon, DevToIcon } from "./Components/BrandIcons";
import IconButton from "./Components/ui/IconButton";
import ekMark from "./Images/ek-mark.svg";
import ScrollProgress from "./Components/Effects/ScrollProgress";
import ErrorBoundary from "./Components/ErrorBoundary";
import RouteLoader from "./Components/ui/RouteLoader";
import NotFound from "./Components/ui/NotFound";
import ScrollToTop from "./Components/ScrollToTop";
import "./App.css";

const Home = lazy(() => import("./Components/Home"));
const About = lazy(() => import("./Components/About"));
const Portfolio = lazy(() => import("./Components/Portfolio"));
const ProjectDetail = lazy(() => import("./Components/ProjectDetail"));
const Resume = lazy(() => import("./Components/Resume"));
const Now = lazy(() => import("./Components/Now"));
import CommandPalette, { CommandPaletteProvider, useCommandPalette } from "./Components/CommandPalette";
const navLinks = [
  { to: "/about", label: "About" },
  { to: "/projects", label: "Projects" },
  { to: "/resume", label: "Resume" },
  { to: "/now", label: "Now" },
];

// Static per-route meta. Project detail routes are excluded — ProjectDetail
// manages its own meta via useDocumentMeta.
const ROUTE_META = {
  "/":         { title: "Edward Kubiak — Full Stack Developer & AI Engineer", canonical: "/" },
  "/about":    { title: "About — Edward Kubiak",    canonical: "/about" },
  "/projects": { title: "Projects — Edward Kubiak", canonical: "/projects" },
  "/resume":   { title: "Resume — Edward Kubiak",   canonical: "/resume" },
  "/now":      { title: "Now — Edward Kubiak",      canonical: "/now" },
};

function NavBar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { toggle } = useCommandPalette();

  // Close menu on route change (back/forward nav)
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Close menu on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/60 backdrop-blur-xl bg-slate-950/80">
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-20">
        {/* Brand — EK mark + typographic wordmark */}
        <Link to="/" className="flex items-center gap-2 group" onClick={() => setOpen(false)}>
          <img
            src={ekMark}
            width="28"
            height="28"
            alt=""
            aria-hidden="true"
            className="flex-shrink-0"
          />
          <span className="font-display text-sm font-bold tracking-[0.25em] uppercase text-slate-100 group-hover:text-accent-400 transition-colors">
            EDWARD KUBIAK
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              aria-current={location.pathname === to ? "page" : undefined}
              className={`relative px-4 py-2 font-display text-xs tracking-widest uppercase transition-colors duration-300 rounded-md ${
                location.pathname === to
                  ? "text-accent-400"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              {label}
              {location.pathname === to && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-accent-400 rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          ))}
          {/* ⌘K affordance */}
          <IconButton
            label="Open command palette"
            title="Open command palette"
            onClick={toggle}
            className="ml-2"
          >
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-700 text-[10px] font-display tracking-wider text-slate-400 hover:border-accent-400/50 hover:text-accent-400 transition-all">
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
          <IconButton
            href="https://dev.to/edwardkubiak"
            target="_blank"
            rel="noopener noreferrer"
            label="DEV.to profile (opens in new tab)"
            title="DEV.to"
          >
            <DevToIcon size={20} aria-hidden="true" />
          </IconButton>
        </div>

        {/* Mobile toggle */}
        <IconButton
          label="Toggle menu"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="mobile-menu"
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
            className="md:hidden overflow-hidden border-t border-slate-800/60 bg-slate-950/95 backdrop-blur-xl"
          >
            <div className="px-6 py-4 flex flex-col gap-2">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  aria-current={location.pathname === to ? "page" : undefined}
                  className={`font-display text-sm tracking-widest uppercase py-3 border-b border-slate-800/40 transition-colors rounded-md ${
                    location.pathname === to
                      ? "text-accent-400"
                      : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  {label}
                </Link>
              ))}
              {/* Search / ⌘K row */}
              <button
                onClick={() => { setOpen(false); toggle(); }}
                className="flex items-center gap-2 py-3 text-slate-400 hover:text-accent-400 font-display text-sm tracking-widest uppercase transition-colors border-b border-slate-800/40 text-left"
              >
                Search <span className="ml-1 px-1.5 py-0.5 rounded border border-slate-700 text-[10px] text-slate-400">⌘K</span>
              </button>
              <a
                href="https://github.com/ek33450505"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub profile (opens in new tab)"
                className="flex items-center gap-2 py-3 text-slate-400 hover:text-accent-400 font-display text-sm tracking-widest uppercase transition-colors"
              >
                <GithubIcon size={18} aria-hidden="true" /> GITHUB
              </a>
              <a
                href="https://dev.to/edwardkubiak"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="DEV.to profile (opens in new tab)"
                className="flex items-center gap-2 py-3 text-slate-400 hover:text-accent-400 font-display text-sm tracking-widest uppercase transition-colors"
              >
                <DevToIcon size={18} aria-hidden="true" />
                DEV.TO
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  // Project detail routes manage their own meta via useDocumentMeta —
  // pass an empty object here so we do not fight them.
  const isProjectDetail = location.pathname.startsWith("/projects/");
  const routeMeta = isProjectDetail
    ? {}
    : (ROUTE_META[location.pathname] ?? { title: "Edward Kubiak" });

  useDocumentMeta(routeMeta);

  // Fire a Plausible SPA pageview on every client-side navigation.
  // Plausible's default script only tracks hard navigations; this covers
  // the rest. Guard for undefined to be safe in local dev without the script.
  useEffect(() => {
    window.plausible?.("pageview");
  }, [location.pathname]);

  return (
    <AnimatePresence>
      <motion.div
        key={location.pathname}
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <CommandPaletteProvider>
        <MotionConfig reducedMotion="user">
        <div className="noise-bg gradient-mesh min-h-screen">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-accent-400 focus:text-slate-950 focus:rounded-md focus:font-display focus:text-sm focus:font-bold focus:tracking-widest focus:uppercase"
          >
            Skip to main content
          </a>
          <ScrollToTop />
          <ScrollProgress />
          <NavBar />
          <CommandPalette />
          <main id="main-content" className="pt-20">
            <ErrorBoundary>
              <AnimatedRoutes />
            </ErrorBoundary>
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-800/60 py-8 px-6">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-sm">
              <p className="font-display text-xs tracking-wider">
                &copy; {new Date().getFullYear()} EDWARD KUBIAK
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="mailto:edward.kubiak.dev@gmail.com"
                  className="font-display text-xs tracking-wider uppercase hover:text-accent-400 transition-colors"
                >
                  edward.kubiak.dev@gmail.com
                </a>
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
                <IconButton
                  href="https://dev.to/edwardkubiak"
                  target="_blank"
                  rel="noopener noreferrer"
                  label="DEV.to profile (opens in new tab)"
                  title="DEV.to"
                >
                  <DevToIcon size={16} aria-hidden="true" />
                </IconButton>
                <IconButton
                  href="/rss.xml"
                  label="RSS feed"
                  title="RSS Feed"
                >
                  <Rss size={16} aria-hidden="true" />
                </IconButton>
              </div>
            </div>
          </footer>
        </div>
        </MotionConfig>
      </CommandPaletteProvider>
    </Router>
  );
}

export default App;
