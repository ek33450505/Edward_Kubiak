import { useRef, lazy, Suspense } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowRight, Code2, Layers, RefreshCw, Brain } from "lucide-react";

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
      "Migrated CrossCheck from AngularJS to React, serving 4,200+ users across 900+ districts",
  },
  {
    icon: Brain,
    title: "AI / LLM Integration",
    description:
      "Built dual-LLM assistants with Claude API & Ollama. AI-augmented development with Claude Code daily.",
  },
];

const Home = () => {
  const heroRef = useRef(null);

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
              {"Full Stack".split("").map((char, i) => (
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
                {"Developer".split("").map((char, i) => (
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
                & AI Craftsman
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-6 text-lg text-slate-400 max-w-lg leading-relaxed"
            >
              I build AI-powered web applications and modernize legacy systems
              serving 4,200+ users across 900+ Ohio school districts.
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
    </div>
  );
};

export default Home;
