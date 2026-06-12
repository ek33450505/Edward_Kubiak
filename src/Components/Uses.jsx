import { motion } from "motion/react";
import { Terminal, Brain, GitBranch, Cpu, Package } from "lucide-react";
import { fadeUp, staggerItem } from "../utils/motion";
import { CAST_STATS } from "../data/castStats";
import SectionHeader from "./ui/SectionHeader";
import PageWrapper from "./ui/PageWrapper";

const sections = [
  {
    id: "hardware",
    title: "Hardware",
    icon: Cpu,
    iconColor: "text-amber-400 bg-amber-400/10",
    items: [
      {
        label: "Machine",
        description: "",
      },
      {
        label: "Monitor",
        description: "",
      },
      {
        label: "Keyboard & Mouse",
        description: "",
      },
    ],
  },
  {
    id: "editor-terminal",
    title: "Editor & Terminal",
    icon: Terminal,
    iconColor: "text-sky-400 bg-sky-400/10",
    items: [
      {
        label: "Editor",
        description: "",
      },
      {
        label: "Terminal",
        description: "",
      },
      {
        label: "Font",
        description: "",
      },
      {
        label: "Theme",
        description: "",
      },
    ],
  },
  {
    id: "ai-dev-tools",
    title: "AI / Dev Tools",
    icon: Brain,
    iconColor: "text-violet-400 bg-violet-400/10",
    items: [
      {
        label: "Claude Code",
        description: "Primary AI development environment. Used daily for architecture, code review, and complex problem-solving.",
      },
      {
        label: "CAST",
        description: `My own multi-agent framework — ${CAST_STATS.agents} specialist agents embedded into Claude Code via hook architecture. ${CAST_STATS.version}.`,
      },
      {
        label: "Key CLI Tools",
        description: "",
      },
    ],
  },
  {
    id: "dotfiles",
    title: "Dotfiles",
    icon: GitBranch,
    iconColor: "text-emerald-400 bg-emerald-400/10",
    items: [
      {
        label: "Dotfiles Repo",
        description: "",
      },
      {
        label: "Package Manager",
        description: "",
      },
    ],
  },
];

function SectionCard({ section, index }) {
  const Icon = section.icon;

  return (
    <motion.section
      variants={staggerItem}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      aria-labelledby={`uses-${section.id}-heading`}
      className="p-6 sm:p-8 rounded-xl border border-slate-800/60 bg-slate-900/30"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg ${section.iconColor} shrink-0`}>
          <Icon size={20} aria-hidden="true" />
        </div>
        <h2
          id={`uses-${section.id}-heading`}
          className="font-display text-lg font-bold tracking-wide text-slate-100"
        >
          {section.title}
        </h2>
      </div>

      <ul className="space-y-4">
        {section.items.map((item) => (
          <li key={item.label} className="flex items-start gap-3">
            <Package
              size={14}
              className="text-amber-400/50 shrink-0 mt-1"
              aria-hidden="true"
            />
            <div>
              <p className="font-display text-sm font-bold text-slate-200 mb-0.5">
                {item.label}
              </p>
              <p className="text-sm text-slate-400 leading-relaxed">
                {item.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </motion.section>
  );
}

const Uses = () => {
  return (
    <div className="min-h-[calc(100vh-80px)] py-20">
      <PageWrapper>
        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <SectionHeader
            as="h1"
            headingClassName="font-display text-3xl sm:text-4xl font-bold tracking-tight"
            underlineClassName="mt-3"
            title={<>What I <span className="text-amber-400">Use</span></>}
          />
          <p className="mt-4 text-slate-400 leading-relaxed max-w-xl">
            The hardware, software, and tools that power my day-to-day
            development workflow.
          </p>
        </motion.div>

        {/* Sections */}
        <div className="mt-12 space-y-6">
          {sections.map((section, i) => (
            <SectionCard key={section.id} section={section} index={i} />
          ))}
        </div>
      </PageWrapper>
    </div>
  );
};

export default Uses;
