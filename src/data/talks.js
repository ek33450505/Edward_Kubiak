// TODO: replace placeholder with real talk/podcast/article entries
import { CAST_STATS, CAST_ECOSYSTEM } from "./castStats";

const talks = [
  {
    title: "Building a Multi-Agent Framework for Claude Code",
    event: "CAST Demo",
    date: "2026-05-01",
    type: "demo", // "talk" | "podcast" | "article" | "demo"
    url: "https://github.com/ek33450505/claude-agent-team",
    description:
      `A walkthrough of the CAST ${CAST_STATS.version} architecture — ${CAST_STATS.agents} specialist agents, hook-driven dispatch, and ${CAST_ECOSYSTEM.tapsPlusUmbrella} for Claude Code.`,
    youtubeId: null, // TODO: add YouTube video ID when available
  },
];

export default talks;
