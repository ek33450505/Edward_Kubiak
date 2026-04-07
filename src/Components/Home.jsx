import { useRef, lazy, Suspense, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowRight, Code2, Layers, RefreshCw, Brain, GitCommit, ExternalLink } from "lucide-react";

// Lazy-load Three.js scene so it code-splits into its own chunk
const StarField = lazy(() => import("./Effects/StarField"));

const competencies = [
  {
    icon: Code2,
    title: "Full Stack JavaScript",
    description:
      "Production apps with React 19, Express 5, Node.js, and multiple database backends",
  },
  {
    icon: Layers,
    title: "React Specialist",
    description:
      "5+ production React apps, from greenfield React 19 builds to AngularJS-to-React migrations",
  },
  {
    icon: RefreshCw,
    title: "Legacy Modernization",
    description:
      "Migrated CrossCheck from AngularJS to React, serving 4,200+ users across 900+ Ohio school districts",
  },
  {
    icon: Brain,
    title: "AI / LLM Integration",
    description:
      "Architect of the CAST ecosystem — 17 specialist agents, 9 modular Homebrew packages, and a real-time observability dashboard for Claude Code. Building Forge, a native macOS terminal designed around Claude Code.",
  },
];

function timeAgo(dateString) {
  const now = new Date();
  const then = new Date(dateString);
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffDay > 30) return `${Math.floor(diffDay / 30)}mo ago`;
  if (diffDay > 0) return `${diffDay}d ago`;
  if (diffHr > 0) return `${diffHr}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return "just now";
}

function CurrentlyBuilding() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadActivity() {
      // Try pre-built static file first (generated at deploy time, no rate limit)
      try {
        const staticRes = await fetch("/Edward_Kubiak/github-activity.json");
        if (staticRes.ok) {
          const staticData = await staticRes.json();
          if (Array.isArray(staticData) && staticData.length > 0) {
            if (!cancelled) {
              setEvents(staticData);
              setLoading(false);
            }
            return;
          }
        }
      } catch {
        // static file unavailable — fall through to live API
      }

      // Fallback: live GitHub API
      try {
        const res = await fetch("https://api.github.com/users/ek33450505/events?per_page=30");
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (cancelled) return;
        const pushEvents = data
          .filter((e) => e.type === "PushEvent" && e.payload?.commits?.length > 0)
          .slice(0, 5)
          .map((e) => ({
            id: e.id,
            repo: e.repo.name.replace("ek33450505/", ""),
            repoFull: e.repo.name,
            message: e.payload.commits[0].message.split("\n")[0],
            time: e.created_at,
          }));
        if (!cancelled) {
          setEvents(pushEvents);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    }

    loadActivity();
    return () => {
      cancelled = true;
    };
  }, []);

  const showFallback = !loading && (error || events.length === 0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto px-6 pb-20 w-full relative z-[2]"
    >
      {/* Section heading */}
      <div className="mb-6 flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xs tracking-[0.3em] text-slate-500 uppercase">
              Currently Building
            </h2>
            {!loading && !showFallback && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-display tracking-[0.15em] uppercase bg-emerald-400/15 text-emerald-400 border border-emerald-400/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            )}
          </div>
          <div className="mt-2 w-16 h-0.5 bg-amber-400/60" />
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-slate-800/60 bg-slate-900/30 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-slate-700/60 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-700/60 rounded w-1/4" />
                  <div className="h-3 bg-slate-700/40 rounded w-3/4" />
                </div>
                <div className="h-3 bg-slate-700/40 rounded w-12 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fallback card when API fails or no events */}
      {showFallback && (
        <div className="p-4 rounded-xl border border-slate-800/60 bg-slate-900/30">
          <a
            href="https://github.com/ek33450505"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-amber-400 transition-colors"
          >
            View my latest activity on GitHub
            <ExternalLink size={13} />
          </a>
        </div>
      )}

      {/* Activity feed */}
      {!loading && events.length > 0 && (
        <div className="space-y-2" aria-live="polite">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              className="group flex items-start gap-3 p-4 rounded-xl border border-slate-800/60 bg-slate-900/30 hover:border-slate-700 hover:bg-slate-800/30 transition-all duration-200"
            >
              <GitCommit
                size={14}
                className="text-amber-400/60 shrink-0 mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <a
                  href={`https://github.com/ek33450505/${event.repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-display text-[11px] tracking-wider text-amber-400/80 hover:text-amber-400 transition-colors uppercase inline-flex items-center gap-1"
                >
                  {event.repo}
                  <ExternalLink size={9} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                <p className="text-sm text-slate-400 leading-snug mt-0.5 truncate">
                  {event.message}
                </p>
              </div>
              <span className="font-display text-[10px] tracking-wider text-slate-600 shrink-0 pt-0.5">
                {timeAgo(event.time)}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.section>
  );
}

const Home = () => {
  const heroRef = useRef(null);
  const reducedMotion = useReducedMotion();

  // Parallax: hero content scrolls slower, decoration floats differently
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroTextY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const decorY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const decorRotate = useTransform(scrollYProgress, [0, 1], [0, 15]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center relative overflow-hidden">
      {/* 3D Galactic starfield background — lazy-loaded */}
      <Suspense fallback={null}>
        <StarField />
      </Suspense>

      {/* Decorative grid lines */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-[1]">
        <div className="absolute top-0 left-1/4 w-px h-full bg-slate-100" />
        <div className="absolute top-0 left-2/4 w-px h-full bg-slate-100" />
        <div className="absolute top-0 left-3/4 w-px h-full bg-slate-100" />
      </div>

      {/* Hero section */}
      <section ref={heroRef} className="max-w-6xl mx-auto px-6 py-20 md:py-32 w-full relative z-[2]">
        <div className="grid md:grid-cols-12 gap-8 items-start">
          {/* Left column - main headline with parallax */}
          <motion.div className="md:col-span-7" style={{ y: heroTextY, opacity: heroOpacity }}>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="font-display text-xs tracking-[0.3em] text-amber-400 uppercase mb-4">
                Full Stack Developer & AI Engineer &mdash; Columbus, OH
              </p>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-tight tracking-tight"
            >
              {reducedMotion
                ? "Full Stack"
                : "Full Stack".split("").map((char, i) => (
                    <motion.span
                      key={`fs-${i}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.15 + i * 0.03 }}
                    >
                      {char}
                    </motion.span>
                  ))}
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-sky-400">
                {reducedMotion
                  ? "Developer"
                  : "Developer".split("").map((char, i) => (
                      <motion.span
                        key={`dev-${i}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.45 + i * 0.04 }}
                        className="inline-block"
                      >
                        {char}
                      </motion.span>
                    ))}
              </span>
              <br />
              <span className="text-slate-400 text-3xl sm:text-4xl lg:text-5xl">
                & AI Systems Engineer
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-6 text-lg text-slate-400 max-w-lg leading-relaxed"
            >
              By day, I build production education technology for Ohio school
              districts at META Solutions. By night, I build open-source
              infrastructure for AI-native development — including the CAST
              ecosystem, a modular agent framework for Claude Code, and Forge,
              a native terminal built around it.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.95 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <Link
                to="/projects"
                className="group inline-flex items-center gap-2 px-6 py-3 bg-amber-400 text-slate-950 font-display text-sm tracking-wider uppercase font-bold rounded-lg hover:bg-amber-300 hover:shadow-[0_0_30px_rgba(0,255,194,0.3)] transition-all duration-300"
              >
                See What I&apos;ve Built
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 border border-slate-700 text-slate-300 font-display text-sm tracking-wider uppercase rounded-lg hover:border-amber-400 hover:text-amber-400 hover:shadow-[0_0_20px_rgba(0,255,194,0.1)] transition-all duration-300"
              >
                Let&apos;s Build Something
              </Link>
            </motion.div>
          </motion.div>

          {/* Right column - decorative element with parallax */}
          <div className="md:col-span-5 hidden md:flex items-center justify-center">
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              style={{ y: decorY, rotate: decorRotate }}
              className="relative"
            >
              {/* Geometric decoration with glow */}
              <div className="w-64 h-64 lg:w-80 lg:h-80 relative">
                <div className="absolute inset-0 border border-slate-700/50 rounded-2xl rotate-6" />
                <div className="absolute inset-4 border border-amber-400/20 rounded-2xl -rotate-3" />
                <div className="absolute inset-8 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl backdrop-blur-sm flex items-center justify-center shadow-[0_0_80px_rgba(0,255,194,0.06)]">
                  <div className="text-center">
                    <motion.p
                      className="font-display text-6xl lg:text-7xl font-bold text-amber-400"
                      animate={{
                        textShadow: [
                          "0 0 20px rgba(0,255,194,0.3)",
                          "0 0 40px rgba(0,255,194,0.5)",
                          "0 0 20px rgba(0,255,194,0.3)",
                        ],
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      EK
                    </motion.p>
                    <div className="mt-2 w-12 h-0.5 bg-amber-400/40 mx-auto" />
                    <p className="mt-2 font-display text-[10px] tracking-[0.3em] text-slate-500 uppercase">
                      Since 2022
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Competencies — scroll-triggered */}
      <section className="max-w-6xl mx-auto px-6 pb-20 w-full relative z-[2]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="font-display text-xs tracking-[0.3em] text-slate-500 uppercase">
            Core Competencies
          </h2>
          <div className="mt-2 w-16 h-0.5 bg-amber-400/60" />
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {competencies.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group p-6 rounded-xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-sm hover:border-amber-400/30 hover:bg-slate-800/40 hover:shadow-[0_0_30px_rgba(0,255,194,0.06)] transition-all duration-300"
            >
              <item.icon
                size={24}
                className="text-amber-400 mb-4 group-hover:scale-110 transition-transform duration-300"
              />
              <h3 className="font-display text-sm font-bold tracking-wide text-slate-100 mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Currently Building — live GitHub activity feed */}
      <CurrentlyBuilding />
    </div>
  );
};

export default Home;
