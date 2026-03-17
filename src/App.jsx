import { useState } from "react";
import { BrowserRouter as Router, Route, Routes, Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Github, Menu, X } from "lucide-react";
import "./App.css";

import Home from "./Components/Home";
import About from "./Components/About";
import Portfolio from "./Components/Portfolio";
import Resume from "./Components/Resume";
import Contact from "./Components/Contact";
import BrandingImage from "./Images/Brand.webp";

const navLinks = [
  { to: "/about", label: "About" },
  { to: "/projects", label: "Projects" },
  { to: "/resume", label: "Resume" },
  { to: "/contact", label: "Contact" },
];

function NavBar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

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
            className="ml-4 p-2 text-slate-400 hover:text-amber-400 transition-colors"
            title="GitHub"
          >
            <Github size={20} />
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-slate-400 hover:text-amber-400 transition-colors"
          aria-label="Toggle menu"
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
                <Github size={18} /> GITHUB
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
    <Router basename="/Kubiak-Portfolio">
      <div className="noise-bg gradient-mesh min-h-screen">
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
              <a
                href="https://github.com/ek33450505"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-amber-400 transition-colors"
              >
                <Github size={16} />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
