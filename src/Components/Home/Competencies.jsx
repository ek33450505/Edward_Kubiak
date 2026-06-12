import { motion } from "motion/react";
import { Code2, Layers, RefreshCw, Brain } from "lucide-react";
import { fadeUp, staggerItem } from "../../utils/motion";
import { CAST_STATS, CAST_ECOSYSTEM } from "../../data/castStats";
import SectionHeader from "../ui/SectionHeader";

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
      `Architect of CAST ${CAST_STATS.version} — ${CAST_STATS.agents} specialist agents, ${CAST_ECOSYSTEM.tapsPlusUmbrella}, and a real-time observability dashboard for Claude Code. castframework.dev`,
  },
];

export default function Competencies() {
  return (
    <section
      id="core-competencies"
      aria-labelledby="core-competencies-heading"
      className="max-w-6xl mx-auto px-6 pb-20 w-full relative z-[2]"
    >
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="mb-8"
      >
        <SectionHeader id="core-competencies-heading" title="Core Competencies" />
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {competencies.map((item, i) => (
          <motion.div
            key={item.title}
            variants={staggerItem}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group p-6 rounded-xl border border-slate-800/60 bg-slate-900/40 backdrop-blur-sm hover:border-accent-400/30 hover:bg-slate-800/40 hover:shadow-[0_0_30px_rgba(0,255,194,0.06)] transition-all duration-300"
          >
            <item.icon
              size={24}
              aria-hidden="true"
              className="text-accent-400 mb-4 group-hover:scale-110 transition-transform duration-300"
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
  );
}
