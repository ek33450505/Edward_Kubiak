/**
 * Canonical color map for project accent colors.
 * Single source of truth consumed by Portfolio, ProjectDetail, and Home.
 *
 * Keys per entry:
 *   bg        — background utility class (icon container, highlights)
 *   text      — foreground text utility class
 *   badge     — combined classes for tech-chip / badge elements
 *   stat      — combined classes for bordered stat chips
 *   spotlight — rgba() string for CardSpotlight glow (Portfolio)
 *   border    — border utility class (ProjectDetail detail panels)
 */
export const colorMap = {
  amber: {
    bg: "bg-amber-400/10",
    text: "text-amber-400",
    badge: "bg-amber-400/10 text-amber-400",
    stat: "bg-amber-400/8 text-amber-400/70 border-amber-400/15",
    spotlight: "rgba(0, 255, 194, 0.08)",
    border: "border-amber-400/30",
  },
  teal: {
    bg: "bg-teal-400/10",
    text: "text-teal-400",
    badge: "bg-teal-400/10 text-teal-400",
    stat: "bg-teal-400/8 text-teal-400/70 border-teal-400/15",
    spotlight: "rgba(45, 212, 191, 0.1)",
    border: "border-teal-400/30",
  },
  violet: {
    bg: "bg-violet-400/10",
    text: "text-violet-400",
    badge: "bg-violet-400/10 text-violet-400",
    stat: "bg-violet-400/8 text-violet-400/70 border-violet-400/15",
    spotlight: "rgba(167, 139, 250, 0.1)",
    border: "border-violet-400/30",
  },
  sky: {
    bg: "bg-sky-400/10",
    text: "text-sky-400",
    badge: "bg-sky-400/10 text-sky-400",
    stat: "bg-sky-400/8 text-sky-400/70 border-sky-400/15",
    spotlight: "rgba(56, 189, 248, 0.08)",
    border: "border-sky-400/30",
  },
  emerald: {
    bg: "bg-emerald-400/10",
    text: "text-emerald-400",
    badge: "bg-emerald-400/10 text-emerald-400",
    stat: "bg-emerald-400/8 text-emerald-400/70 border-emerald-400/15",
    spotlight: "rgba(52, 211, 153, 0.08)",
    border: "border-emerald-400/30",
  },
  rose: {
    bg: "bg-rose-400/10",
    text: "text-rose-400",
    badge: "bg-rose-400/10 text-rose-400",
    stat: "bg-rose-400/8 text-rose-400/70 border-rose-400/15",
    spotlight: "rgba(251, 113, 133, 0.08)",
    border: "border-rose-400/30",
  },
};

/**
 * Returns a combined "text-{color} bg-{color}/10" class string for a given
 * color key.  Used by Home.jsx's FeaturedWork section where both text and
 * background are applied to the same element and only the text class is also
 * needed independently.
 *
 * Falls back to amber when the color key is unknown.
 *
 * @param {string} color - one of the colorMap keys
 * @returns {string} e.g. "text-violet-400 bg-violet-400/10"
 */
export function getColorClasses(color) {
  const c = colorMap[color] || colorMap.amber;
  return `${c.text} ${c.bg}`;
}
