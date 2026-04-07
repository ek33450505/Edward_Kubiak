import { useState, useEffect } from "react";
import { HashRouter as Router, Route, Routes, Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Github, Menu, X } from "lucide-react";
import ScrollProgress from "./Components/Effects/ScrollProgress";
import "./App.css";

import Home from "./Components/Home";
import About from "./Components/About";
import Portfolio from "./Components/Portfolio";
import Resume from "./Components/Resume";
import Contact from "./Components/Contact";
import BrandingImage from "./Images/Brand.svg";

const navLinks = [
  { to: "/about", label: "About" },
  { to: "/projects", label: "Projects" },
  { to: "/resume", label: "Resume" },
  { to: "/contact", label: "Contact" },
];

function NavBar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

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
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group" onClick={() => setOpen(false)}>
          <img
            src={BrandingImage}
            alt="EK"
            className="w-11 h-11 rounded-full ring-2 ring-slate-700 group-hover:ring-amber-400 transition-all duration-300"
          />
          <span className="font-display text-sm tracking-wider text-slate-300 group-hover:text-amber-400 transition-colors hidden sm:block">
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
              className={`relative px-4 py-2 font-display text-xs tracking-widest uppercase transition-colors duration-300 ${
                location.pathname === to
                  ? "text-amber-400"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              {label}
              {location.pathname === to && (
                <motion.div
                  layoutId="nav-underline"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-amber-400 rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          ))}
          <a
            href="https://github.com/ek33450505"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub profile (opens in new tab)"
            className="ml-4 p-2 text-slate-400 hover:text-amber-400 transition-colors"
          >
            <Github size={20} aria-hidden="true" />
          </a>
          <a
            href="https://dev.to/edwardkubiak"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="DEV.to profile (opens in new tab)"
            className="p-2 text-slate-400 hover:text-amber-400 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M7.42 10.05c-.18-.16-.46-.23-.84-.23H6v4.36h.58c.37 0 .67-.08.84-.23.18-.16.27-.45.27-.85v-2.2c0-.4-.09-.69-.27-.85zm13.37-6.41H3.21C1.99 3.64 1 4.63 1 5.85v12.3c0 1.22.99 2.21 2.21 2.21h17.58c1.22 0 2.21-.99 2.21-2.21V5.85c0-1.22-.99-2.21-2.21-2.21zM8.85 14.4c-.37.38-.85.56-1.43.56H5.18V9.04h2.24c.58 0 1.06.19 1.43.56.37.38.56.85.56 1.43v1.94c0 .58-.19 1.06-.56 1.43zm4.75-4.25H11.5v1.64h1.28v1.11H11.5v1.64h2.1v1.11H11c-.65 0-1.11-.47-1.11-1.11v-4.16c0-.65.47-1.11 1.11-1.11h2.6v1.11zm5.04 4.73c-.4.6-.97.85-1.64.54-.52-.23-.82-.73-.97-1.5l-.63-3.12-.63 3.12c-.15.77-.45 1.27-.97 1.5-.67.31-1.24.06-1.64-.54l-1.78-5.73h1.23l1.26 4.57 1.26-4.57h.7l1.26 4.57 1.26-4.57h1.23l-1.78 5.73z"/>
            </svg>
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-slate-400 hover:text-amber-400 transition-colors"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
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
                  className={`font-display text-sm tracking-widest uppercase py-3 border-b border-slate-800/40 transition-colors ${
                    location.pathname === to
                      ? "text-amber-400"
                      : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  {label}
                </Link>
              ))}
              <a
                href="https://github.com/ek33450505"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 py-3 text-slate-400 hover:text-amber-400 font-display text-sm tracking-widest uppercase transition-colors"
              >
                <Github size={18} aria-hidden="true" /> GITHUB
              </a>
              <a
                href="https://dev.to/edwardkubiak"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 py-3 text-slate-400 hover:text-amber-400 font-display text-sm tracking-widest uppercase transition-colors"
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
    const titles = {
      "/": "Edward Kubiak — Full Stack Developer & AI Engineer",
      "/about": "About — Edward Kubiak",
      "/projects": "Projects — Edward Kubiak",
      "/resume": "Resume — Edward Kubiak",
      "/contact": "Contact — Edward Kubiak",
    };
    document.title = titles[location.pathname] || "Edward Kubiak";
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
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/projects" element={<Portfolio />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <div className="noise-bg gradient-mesh min-h-screen">
        <ScrollProgress />
        <NavBar />
        <main className="pt-20">
          <AnimatedRoutes />
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/60 py-8 px-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-sm">
            <p className="font-display text-xs tracking-wider">
              &copy; {new Date().getFullYear()} EDWARD KUBIAK
            </p>
            <div className="flex items-center gap-4">
              <Link
                to="/contact"
                className="font-display text-xs tracking-wider uppercase hover:text-amber-400 transition-colors"
              >
                Contact
              </Link>
              <a
                href="https://github.com/ek33450505"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub profile (opens in new tab)"
                className="hover:text-amber-400 transition-colors"
              >
                <Github size={16} aria-hidden="true" />
              </a>
              <a
                href="https://dev.to/edwardkubiak"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="DEV.to profile (opens in new tab)"
                className="hover:text-amber-400 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M7.42 10.05c-.18-.16-.46-.23-.84-.23H6v4.36h.58c.37 0 .67-.08.84-.23.18-.16.27-.45.27-.85v-2.2c0-.4-.09-.69-.27-.85zm13.37-6.41H3.21C1.99 3.64 1 4.63 1 5.85v12.3c0 1.22.99 2.21 2.21 2.21h17.58c1.22 0 2.21-.99 2.21-2.21V5.85c0-1.22-.99-2.21-2.21-2.21zM8.85 14.4c-.37.38-.85.56-1.43.56H5.18V9.04h2.24c.58 0 1.06.19 1.43.56.37.38.56.85.56 1.43v1.94c0 .58-.19 1.06-.56 1.43zm4.75-4.25H11.5v1.64h1.28v1.11H11.5v1.64h2.1v1.11H11c-.65 0-1.11-.47-1.11-1.11v-4.16c0-.65.47-1.11 1.11-1.11h2.6v1.11zm5.04 4.73c-.4.6-.97.85-1.64.54-.52-.23-.82-.73-.97-1.5l-.63-3.12-.63 3.12c-.15.77-.45 1.27-.97 1.5-.67.31-1.24.06-1.64-.54l-1.78-5.73h1.23l1.26 4.57 1.26-4.57h.7l1.26 4.57 1.26-4.57h1.23l-1.78 5.73z"/>
                </svg>
              </a>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
