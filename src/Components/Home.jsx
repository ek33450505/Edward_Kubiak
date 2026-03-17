import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { ArrowRight, Code2, Layers, RefreshCw, Palette } from "lucide-react";

const competencies = [
  {
    icon: Code2,
    title: "Full Stack MERN",
    description: "End-to-end development with MongoDB, Express, React & Node.js",
  },
  {
    icon: Layers,
    title: "React Specialist",
    description: "Modern React 19 with Vite, hooks, and component architecture",
  },
  {
    icon: RefreshCw,
    title: "Legacy Modernization",
    description: "Transforming Angular, PHP & jQuery systems into modern stacks",
  },
  {
    icon: Palette,
    title: "UI/UX Design",
    description: "Crafting intuitive, accessible, and visually engaging interfaces",
  },
];

const Home = () => {
  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center relative overflow-hidden">
      {/* Decorative grid lines */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute top-0 left-1/4 w-px h-full bg-slate-100" />
        <div className="absolute top-0 left-2/4 w-px h-full bg-slate-100" />
        <div className="absolute top-0 left-3/4 w-px h-full bg-slate-100" />
      </div>

      {/* Hero section */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-32 w-full">
        <div className="grid md:grid-cols-12 gap-8 items-start">
          {/* Left column - main headline */}
          <div className="md:col-span-7">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="font-display text-xs tracking-[0.3em] text-amber-400 uppercase mb-4">
                Application Developer &mdash; Columbus, OH
              </p>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-tight tracking-tight"
            >
              Full Stack
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-sky-400">
                Developer
              </span>
              <br />
              <span className="text-slate-400 text-3xl sm:text-4xl lg:text-5xl">
                & App Specialist
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-6 text-lg text-slate-400 max-w-lg leading-relaxed"
            >
              Crafting responsive, scalable web applications with a focus on
              front-end excellence and legacy system modernization.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <Link
                to="/projects"
                className="group inline-flex items-center gap-2 px-6 py-3 bg-amber-400 text-slate-950 font-display text-sm tracking-wider uppercase font-bold rounded-lg hover:bg-amber-300 transition-all duration-300"
              >
                View Projects
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 border border-slate-700 text-slate-300 font-display text-sm tracking-wider uppercase rounded-lg hover:border-amber-400 hover:text-amber-400 transition-all duration-300"
              >
                Get in Touch
              </Link>
            </motion.div>
          </div>

          {/* Right column - decorative element */}
          <div className="md:col-span-5 hidden md:flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              {/* Geometric decoration */}
              <div className="w-64 h-64 lg:w-80 lg:h-80 relative">
                <div className="absolute inset-0 border border-slate-700/50 rounded-2xl rotate-6" />
                <div className="absolute inset-4 border border-amber-400/20 rounded-2xl -rotate-3" />
                <div className="absolute inset-8 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center">
                    <p className="font-display text-6xl lg:text-7xl font-bold text-amber-400">EK</p>
                    <div className="mt-2 w-12 h-0.5 bg-amber-400/40 mx-auto" />
                    <p className="mt-2 font-display text-[10px] tracking-[0.3em] text-slate-500 uppercase">
                      Est. 2022
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Competencies */}
      <section className="max-w-6xl mx-auto px-6 pb-20 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
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
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
              className="group p-6 rounded-xl border border-slate-800/60 bg-slate-900/30 hover:border-amber-400/30 hover:bg-slate-800/30 transition-all duration-300"
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
