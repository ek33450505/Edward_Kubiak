import { motion } from "motion/react";
import { Bot, Database, Package, TestTube2, Terminal, Hash } from "lucide-react";
import { CAST_STATS } from "../data/castStats";
import { useStaticJson } from "../hooks/useStaticJson";
import SectionHeader from "./ui/SectionHeader";
import PageWrapper from "./ui/PageWrapper";
import Reveal from "./ui/Reveal";

const PILLS = [
  { key: "version", label: "Version", icon: Hash },
  { key: "agents", label: "Agents", icon: Bot },
  { key: "tests", label: "Tests", icon: TestTube2 },
  { key: "packages", label: "Packages", icon: Package },
  { key: "tables", label: "Tables", icon: Database },
  { key: "commands", label: "Commands", icon: Terminal },
];

function CastStats() {
  const { data } = useStaticJson("/cast-stats.json", { fallback: CAST_STATS });

  // Guard: if JSON parsed to a non-object type, fall back to bundled stats.
  const displayStats =
    data && typeof data === "object" ? data : CAST_STATS;

  return (
    <Reveal as="section" className="w-full relative z-[2]">
      <PageWrapper width="6xl" className="pb-20">
      <div className="mb-6">
        <SectionHeader title="CAST Ecosystem — Live Stats" />
      </div>

      <div className="flex flex-wrap gap-3">
        {PILLS.map(({ key, label, icon: Icon }) => {
          const value = displayStats[key];
          if (value === undefined || value === null) return null;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 px-4 py-2.5 card"
            >
              <Icon size={14} className="text-accent-400 shrink-0" aria-hidden="true" />
              <span className="font-display text-base font-bold text-accent-400">
                {value}
              </span>
              <span className="font-display text-[10px] tracking-[0.2em] text-slate-400 uppercase">
                {label}
              </span>
            </motion.div>
          );
        })}
        {displayStats.updated && (
          <div className="flex items-center self-center ml-1">
            <span className="font-display text-[11px] tracking-wider text-slate-400">
              updated {new Date(displayStats.updated).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
      </PageWrapper>
    </Reveal>
  );
}

export default CastStats;
