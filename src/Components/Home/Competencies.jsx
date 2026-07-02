import { staggerItem } from "../../utils/motion";
import { CAST_STATS, CAST_ECOSYSTEM } from "../../data/castStats";
import SectionHeader from "../ui/SectionHeader";
import PageWrapper from "../ui/PageWrapper";
import Reveal from "../ui/Reveal";

const competencies = [
  {
    title: "Full Stack JavaScript",
    description:
      "Production apps with React 19, Express 5, Node.js, and multiple database backends",
  },
  {
    title: "React Specialist",
    description:
      "5+ production React apps, from greenfield React 19 builds to AngularJS-to-React migrations",
  },
  {
    title: "Legacy Modernization",
    description:
      "Migrated CrossCheck from AngularJS to React, serving 4,200+ users across 900+ Ohio school districts",
  },
  {
    title: "AI / LLM Integration",
    description:
      `Architect of CAST ${CAST_STATS.version} — ${CAST_STATS.agents} specialist agents, ${CAST_ECOSYSTEM.tapsPlusUmbrella}, and a real-time observability dashboard for Claude Code. castframework.dev`,
  },
];

export default function Competencies() {
  return (
    <PageWrapper width="6xl" className="pb-20 w-full relative z-[2]">
    <section
      id="core-competencies"
      aria-labelledby="core-competencies-heading"
    >
      <Reveal margin="-60px" className="mb-8">
        <SectionHeader id="core-competencies-heading" title="Core Competencies" />
      </Reveal>

      <div className="flex flex-col sm:flex-row sm:divide-x sm:divide-slate-700/40 gap-6 sm:gap-0">
        {competencies.map((item, i) => (
          <Reveal
            key={item.title}
            variants={staggerItem}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="sm:px-6 first:sm:pl-0 last:sm:pr-0 flex-1"
          >
            <h3 className="font-display text-xs tracking-[0.2em] uppercase text-accent-400 mb-1">
              {item.title}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              {item.description}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
    </PageWrapper>
  );
}
