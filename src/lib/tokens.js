// Mirror of the @theme tokens in src/index.css — keep in sync
// (src/lib/tokens.test.js fails if the two drift).
// For JS/SVG consumers that can't read CSS custom properties.
// "Systems Console" dark theme — text pairs verified ≥ 4.5:1, graphics ≥ 3:1
// on --background #111214.

export const BACKGROUND = "#111214";       // graphite base
export const FOREGROUND = "#E6E7EA";       // primary ink
export const CARD = "#17181B";             // raised panel
export const MUTED = "#1C1E22";            // recessed fill
export const MUTED_FOREGROUND = "#9AA0AA"; // secondary / caption ink
export const SLATE_700 = "#2A2D33";        // hairline (border)
export const BORDER_STRONG = "#646B76";    // interactive control outline (>= 3:1)

export const ACCENT = "#F2A93B";           // amber signal (primary)
export const ACCENT_500 = "#D98F1F";       // deeper amber
export const ACCENT_300 = "#F7C873";       // lighter amber
export const PRIMARY_FOREGROUND = "#111214";

export const TERRA = "#F07F5E";
export const WATER = "#6FB3E8";
export const SEPIA = "#B9A77C";

export const STATUS_COLORS = {
  operational: "#6FB3E8",
  construction: "#F2A93B",
  permitted: "#7DD3A8",
  proposed: "#C08BF5",
  cancelled: "#6B7280",
};
