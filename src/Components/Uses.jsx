import { motion } from "motion/react";
import { Monitor, Terminal, Brain, GitBranch, Cpu, Package } from "lucide-react";

const sections = [
  {
    id: "hardware",
    title: "Hardware",
    icon: Cpu,
    iconColor: "text-amber-400 bg-amber-400/10",
    items: [
      {
        label: "Machine", // TODO: fill in
        description: "{/* TODO: fill in — e.g. MacBook Pro 16\" M3 Pro, 36 GB RAM */}",
      },
      {
        label: "Monitor", // TODO: fill in
        description: "{/* TODO: fill in — e.g. LG 27UK850-W 4K */}",
      },
      {
        label: "Keyboard & Mouse", // TODO: fill in
        description: "{/* TODO: fill in */}",
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
        label: "Editor", // TODO: fill in
        description: "{/* TODO: fill in — e.g. VS Code with key extensions */}",
      },
      {
        label: "Terminal", // TODO: fill in
        description: "{/* TODO: fill in — e.g. Warp / iTerm2 */}",
      },
      {
        label: "Font", // TODO: fill in
        description: "{/* TODO: fill in — e.g. JetBrains Mono */}",
      },
      {
        label: "Theme", // TODO: fill in
        description: "{/* TODO: fill in */}",
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
        description: "My own multi-agent framework — 22 specialist agents embedded into Claude Code via hook architecture. v7.0.",
      },
      {
        label: "Key CLI Tools", // TODO: fill in
        description: "{/* TODO: fill in — e.g. fzf, ripgrep, bat, jq, gh */}",
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
        label: "Dotfiles Repo", // TODO: fill in
        description: "{/* TODO: link dotfiles repo when public */}",
      },
      {
        label: "Package Manager", // TODO: fill in
        description: "{/* TODO: fill in — e.g. Homebrew with Brewfile */}",
      },
    ],
  },
];

function SectionCard({ section, index }) {
  const Icon = section.icon;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
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
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            What I <span className="text-amber-400">Use</span>
          </h1>
          <div className="mt-3 w-16 h-0.5 bg-amber-400/60" />
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
      </div>
    </div>
  );
};

export default Uses;
