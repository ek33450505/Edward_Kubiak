import { staggerItem } from "../../utils/motion";
import { CAST_STATS, CAST_ECOSYSTEM } from "../../data/castStats";
import SectionHead from "../ui/SectionHead";
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
      "Production React apps, from greenfield React 19 builds to replacing end-of-life AngularJS",
  },
  {
    title: "Legacy Rewrites",
    description:
      "Rebuilt CrossCheck as a React app, replacing an end-of-life AngularJS 1.x system used by Ohio school districts",
  },
  {
    title: "AI / LLM Integration",
    description:
      `Architect of CAST ${CAST_STATS.version} — ${CAST_STATS.agents} specialist agents, ${CAST_ECOSYSTEM.tapsPlusUmbrella}, and a real-time observability dashboard for Claude Code. castframework.dev`,
  },
];

export default function Competencies() {
  return (
    <PageWrapper width="6xl" className="w-full pb-20 md:pb-24">
      <section id="core-competencies" aria-labelledby="core-competencies-heading">
        <Reveal margin="-60px">
          <SectionHead index="03" title="Core competencies" id="core-competencies-heading" />
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {competencies.map((item, i) => (
            <Reveal
              key={item.title}
              variants={staggerItem}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="card p-5"
            >
              <h3 className="font-mono text-xs uppercase tracking-[0.15em] text-primary">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </Reveal>
          ))}
        </div>
      </section>
    </PageWrapper>
  );
}
