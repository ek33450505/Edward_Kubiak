import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { Menu, X, Rss } from "lucide-react";
import { GithubIcon } from "./Components/BrandIcons";
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
const Talks = lazy(() => import("./Components/Talks"));
const Uses = lazy(() => import("./Components/Uses"));
import CommandPalette, { CommandPaletteProvider, useCommandPalette } from "./Components/CommandPalette";
const navLinks = [
  { to: "/about", label: "About" },
  { to: "/projects", label: "Projects" },
  { to: "/resume", label: "Resume" },
  { to: "/now", label: "Now" },
];

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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M7.42 10.05c-.18-.16-.46-.23-.84-.23H6v4.36h.58c.37 0 .67-.08.84-.23.18-.16.27-.45.27-.85v-2.2c0-.4-.09-.69-.27-.85zm13.37-6.41H3.21C1.99 3.64 1 4.63 1 5.85v12.3c0 1.22.99 2.21 2.21 2.21h17.58c1.22 0 2.21-.99 2.21-2.21V5.85c0-1.22-.99-2.21-2.21-2.21zM8.85 14.4c-.37.38-.85.56-1.43.56H5.18V9.04h2.24c.58 0 1.06.19 1.43.56.37.38.56.85.56 1.43v1.94c0 .58-.19 1.06-.56 1.43zm4.75-4.25H11.5v1.64h1.28v1.11H11.5v1.64h2.1v1.11H11c-.65 0-1.11-.47-1.11-1.11v-4.16c0-.65.47-1.11 1.11-1.11h2.6v1.11zm5.04 4.73c-.4.6-.97.85-1.64.54-.52-.23-.82-.73-.97-1.5l-.63-3.12-.63 3.12c-.15.77-.45 1.27-.97 1.5-.67.31-1.24.06-1.64-.54l-1.78-5.73h1.23l1.26 4.57 1.26-4.57h.7l1.26 4.57 1.26-4.57h1.23l-1.78 5.73z"/>
            </svg>
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M7.42 10.05c-.18-.16-.46-.23-.84-.23H6v4.36h.58c.37 0 .67-.08.84-.23.18-.16.27-.45.27-.85v-2.2c0-.4-.09-.69-.27-.85zm13.37-6.41H3.21C1.99 3.64 1 4.63 1 5.85v12.3c0 1.22.99 2.21 2.21 2.21h17.58c1.22 0 2.21-.99 2.21-2.21V5.85c0-1.22-.99-2.21-2.21-2.21zM8.85 14.4c-.37.38-.85.56-1.43.56H5.18V9.04h2.24c.58 0 1.06.19 1.43.56.37.38.56.85.56 1.43v1.94c0 .58-.19 1.06-.56 1.43zm4.75-4.25H11.5v1.64h1.28v1.11H11.5v1.64h2.1v1.11H11c-.65 0-1.11-.47-1.11-1.11v-4.16c0-.65.47-1.11 1.11-1.11h2.6v1.11zm5.04 4.73c-.4.6-.97.85-1.64.54-.52-.23-.82-.73-.97-1.5l-.63-3.12-.63 3.12c-.15.77-.45 1.27-.97 1.5-.67.31-1.24.06-1.64-.54l-1.78-5.73h1.23l1.26 4.57 1.26-4.57h.7l1.26 4.57 1.26-4.57h1.23l-1.78 5.73z"/>
                </svg>
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

  useEffect(() => {
    if (location.pathname.startsWith("/projects/")) {
      document.title = "Project — Edward Kubiak";
    } else {
      const titles = {
        "/": "Edward Kubiak — Full Stack Developer & AI Engineer",
        "/about": "About — Edward Kubiak",
        "/projects": "Projects — Edward Kubiak",
        "/resume": "Resume — Edward Kubiak",
        "/now": "Now — Edward Kubiak",
        "/talks": "Talks — Edward Kubiak",
        "/uses": "Uses — Edward Kubiak",
      };
      document.title = titles[location.pathname] || "Edward Kubiak";
    }
    // Fire a Plausible SPA pageview on every client-side navigation.
    // Plausible's default script only tracks hard navigations; this covers
    // the rest. Guard for undefined to be safe in local dev without the script.
    window.plausible?.("pageview");
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
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
            <Route path="/talks" element={<Talks />} />
            <Route path="/uses" element={<Uses />} />
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
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </IconButton>
                <IconButton
                  href="https://dev.to/edwardkubiak"
                  target="_blank"
                  rel="noopener noreferrer"
                  label="DEV.to profile (opens in new tab)"
                  title="DEV.to"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M7.42 10.05c-.18-.16-.46-.23-.84-.23H6v4.36h.58c.37 0 .67-.08.84-.23.18-.16.27-.45.27-.85v-2.2c0-.4-.09-.69-.27-.85zm13.37-6.41H3.21C1.99 3.64 1 4.63 1 5.85v12.3c0 1.22.99 2.21 2.21 2.21h17.58c1.22 0 2.21-.99 2.21-2.21V5.85c0-1.22-.99-2.21-2.21-2.21zM8.85 14.4c-.37.38-.85.56-1.43.56H5.18V9.04h2.24c.58 0 1.06.19 1.43.56.37.38.56.85.56 1.43v1.94c0 .58-.19 1.06-.56 1.43zm4.75-4.25H11.5v1.64h1.28v1.11H11.5v1.64h2.1v1.11H11c-.65 0-1.11-.47-1.11-1.11v-4.16c0-.65.47-1.11 1.11-1.11h2.6v1.11zm5.04 4.73c-.4.6-.97.85-1.64.54-.52-.23-.82-.73-.97-1.5l-.63-3.12-.63 3.12c-.15.77-.45 1.27-.97 1.5-.67.31-1.24.06-1.64-.54l-1.78-5.73h1.23l1.26 4.57 1.26-4.57h.7l1.26 4.57 1.26-4.57h1.23l-1.78 5.73z"/>
                  </svg>
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
