// Static per-route meta. Project detail routes are excluded — ProjectDetail
// manages its own meta via useDocumentMeta. Shared by src/App.jsx (client-side
// document meta) and scripts/prerender-routes.mjs (build-time head prerender).
export const ROUTE_META = {
  "/": {
    title: "Edward Kubiak — Full Stack Developer & AI Systems Engineer",
    description:
      "Edward Kubiak — Full Stack Developer & AI Systems Engineer in Columbus, OH. Creator of CAST, a Claude Code agent framework, and Compute Atlas, a compute census.",
    canonical: "/",
  },
  "/about": {
    title: "About — Edward Kubiak",
    description:
      "About Edward Kubiak: Columbus, OH full stack developer and AI systems engineer building CAST (open-source Claude Code agents) and production apps for Ohio schools.",
    canonical: "/about/",
  },
  "/projects": {
    title: "Projects — Edward Kubiak",
    description:
      "Projects by Edward Kubiak — CAST, Compute Atlas, looptrip, misfire, and Attest, plus production React/Node.js work for Ohio school districts.",
    canonical: "/projects/",
  },
  "/resume": {
    title: "Resume — Edward Kubiak",
    description:
      "Edward Kubiak's resume — full stack developer & AI systems engineer, React/Node.js/Python, Claude Code agent tooling. Download the PDF or view online.",
    canonical: "/resume/",
  },
  "/now": {
    title: "Now — Edward Kubiak",
    description:
      "What Edward Kubiak is building, learning, and running right now — CAST, Compute Atlas, and AI agent-reliability tooling. Updated regularly.",
    canonical: "/now/",
  },
  "/practice": {
    title: "How I Work With Agents — Edward Kubiak",
    description:
      "How Edward Kubiak plans, prompts, reviews and verifies AI-agent work — the judgment layer, with real cases where plausible code was not correct.",
    canonical: "/practice/",
  },
};
