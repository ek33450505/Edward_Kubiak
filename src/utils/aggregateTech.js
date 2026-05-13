import projects from "../data/projects.js";

/**
 * Aggregates tech tags from all non-archived projects.
 * Returns top 10 by frequency, formatted for recharts RadarChart.
 *
 * @returns {{ name: string, count: number, fullMark: number }[]}
 */
export function aggregateTech() {
  const counts = {};

  projects
    .filter((p) => !p.archived)
    .forEach((p) => {
      (p.tech || []).forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });

  const sorted = Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  if (sorted.length === 0) return [];

  const maxCount = sorted[0][1];

  return sorted.map(([name, count]) => ({ name, count, fullMark: maxCount }));
}
