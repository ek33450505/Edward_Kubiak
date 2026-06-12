/**
 * TrailTerrain constants — single source of truth for all tunable parameters.
 *
 * Scene palette cross-reference:
 *   PALETTE.ACCENT       ↔  --color-accent-400   (#00FFC2) in src/index.css
 *   PALETTE.EMERALD      ↔  --color-emerald-400  (#34d399) in src/index.css
 *   PALETTE.SKY          ↔  --color-sky-400      (#38bdf8) in src/index.css
 *   PALETTE.SLATE_950    ↔  --color-slate-950    (#0a0f1a) in src/index.css
 * CSS cannot consume JS constants directly, so both locations must be kept in
 * sync manually — this comment is the cross-reference.
 */

// ---------------------------------------------------------------------------
// Scene palette — Three.js hex strings for all scene colors
// ---------------------------------------------------------------------------
export const PALETTE = {
  // Site tokens (must match src/index.css @theme values)
  ACCENT: "#00FFC2",       // route line, cyan fireflies — --color-accent-400
  EMERALD: "#34d399",      // ridge canopy, oak trees   — --color-emerald-400
  SKY: "#38bdf8",          // river water               — --color-sky-400
  SLATE_950: "#0a0f1a",    // fog + background base     — --color-slate-950

  // Scene-specific (no site token equivalent)
  GORGE_WALL_MID: "#1a2a1a",   // terrain: gorge wall mid-tone
  GORGE_WALL_DARK: "#1a3a2a",  // hemlock trees (deep gorge shadow)
  FLOOR_DARK: "#0a1218",       // terrain: gorge floor (darkest)
  FIREFLY_YELLOW: "#ffee44",   // firefly warm glow (~72% of fireflies)
  FOG: "#0a0f1a",              // fogExp2 color (same as SLATE_950)
  AMBIENT_LIGHT: "#1a0e06",    // warm amber ambient
  SUN_LIGHT: "#ff9944",        // dusk directional (west)
  FILL_LIGHT: "#4466ff",       // cool fill (east/sky bounce)
};

// ---------------------------------------------------------------------------
// Terrain — PlaneGeometry 128×128 segments displaced into Clear Fork Gorge
// Clear Fork Gorge depth reference: ~300 ft (~90 m), ratio drives GORGE_DEPTH
// ---------------------------------------------------------------------------
export const TERRAIN = {
  SEGMENTS: 128,         // vertex resolution per axis (128×128 = 16,641 vertices)
  SIZE: 20,              // world units across (10 units radius)
  HEIGHT_SCALE: 2.5,     // multiplier: normalized h (0..1) → world Y
  RIDGE_HEIGHT: 0.5,     // normalized h threshold for "ridge" coloring
  GORGE_CENTER: 0.1,     // nx position of gorge center (slightly off-axis, like real gorge)
  GORGE_HALF_WIDTH: 0.15, // fraction of terrain width for gorge walls
  GORGE_FLOOR_HEIGHT: 0.08, // normalized h at gorge floor (flat valley bottom)
  FLOOR_THRESHOLD: 0.7,  // gorgeShape above this → flat floor kicks in
  WALL_THRESHOLD: 0.6,   // gorgeFactor < this → wall blending factor active
};

// ---------------------------------------------------------------------------
// River — CatmullRomCurve3 + TubeGeometry along gorge floor
// ---------------------------------------------------------------------------
export const RIVER = {
  WAYPOINTS: 30,         // control points for the spline (more = smoother meander)
  TUBE_SEGMENTS: 80,     // radial subdivisions of TubeGeometry
  TUBE_RADIUS: 0.06,     // world units
  TUBE_RADIAL_SEGMENTS: 6,
  MEANDER_AMP: 0.35,     // x-axis sinusoidal offset amplitude (world units)
  MEANDER_FREQ: 2.5,     // π-multiples of z-range for meander cycles
  Y_OFFSET: 0.22,        // world Y of river surface (gorge floor ~0.08*2.5=0.2)
  SCROLL_SPEED: 0.4,     // UV scroll rate (units/sec) — animated in useFrame
  EMISSIVE_INTENSITY: 0.35,
  OPACITY: 0.72,
};

// ---------------------------------------------------------------------------
// Trees — instanced hemlock (gorge walls) + oak (ridgelines)
// ---------------------------------------------------------------------------
export const TREES = {
  HEMLOCK_TARGET: 150,   // max instances to place (may be fewer if placement fails)
  OAK_TARGET: 150,
  HEMLOCK_MAX_ATTEMPTS: 3000,
  OAK_MAX_ATTEMPTS: 3000,
  HEMLOCK_SEED: 0xdeadbeef,

  // Hemlock placement criteria: gorge wall zone
  HEMLOCK_H_MIN: 0.18,
  HEMLOCK_H_MAX: 0.55,
  HEMLOCK_DIST_FROM_GORGE_MAX: 0.35,
  HEMLOCK_SCALE_MIN: 0.25,
  HEMLOCK_SCALE_RANGE: 0.35, // scale = SCALE_MIN + rand() * SCALE_RANGE
  HEMLOCK_CONE_RADIUS: 0.2,
  HEMLOCK_CONE_HEIGHT: 1.0,
  HEMLOCK_CONE_SEGS: 5,
  HEMLOCK_X_SQUASH: 0.35,    // x/z scale relative to y (tall-narrow silhouette)
  HEMLOCK_Y_LIFT: 0.5,       // y offset factor relative to scale

  // Oak placement criteria: ridgeline zone
  OAK_H_MIN: 0.5,
  OAK_SCALE_MIN: 0.3,
  OAK_SCALE_RANGE: 0.4,
  OAK_CONE_RADIUS: 0.5,
  OAK_CONE_HEIGHT: 0.7,
  OAK_CONE_SEGS: 7,
  OAK_X_SQUASH: 0.65,        // x/z relative to y (squat canopy)
  OAK_Y_SQUASH: 0.75,        // y relative to scale
  OAK_Y_LIFT: 0.45,
};

// ---------------------------------------------------------------------------
// Fireflies — Points with J-arc phase animation
// ~400 particles across 12 staggered phase groups
// ---------------------------------------------------------------------------
export const FIREFLIES = {
  COUNT: 400,
  GROUP_COUNT: 12,
  FLASH_IN: 0.4,         // seconds from dark → full brightness
  FLASH_OUT: 0.4,        // seconds from full brightness → dark
  IDLE_MIN: 2.0,         // minimum dark time between flashes (seconds)
  IDLE_RANGE: 3.0,       // random extra idle time (seconds)
  SEED: 0xcafebabe,

  // Placement: foreground ridges, z-range ±5
  X_CENTER: -0.1,        // bias factor for x placement (slightly left of center)
  X_SPREAD: 16,          // world x spread before clamping
  Z_HALF: 5,             // ±Z placement extent
  H_MIN: 0.4,            // minimum normalized terrain height for placement
  PLACE_TRIES: 30,       // max attempts per firefly before accepting any position
  Y_SURFACE_OFFSET: 0.05, // above terrain surface
  Y_JITTER_RANGE: 0.3,   // random height above surface

  // J-arc vertical drift during flash
  Y_DRIFT_PEAK: 0.05,    // peak rise at full brightness
  Y_DRIFT_SETTLE: 0.03,  // settle back during flash-out

  // Color split: ~72% warm yellow, ~28% accent cyan (PALETTE.ACCENT)
  YELLOW_THRESHOLD: 0.72,

  // Geometry
  POINT_SIZE: 0.08,
};

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------
export const CAMERA = {
  POSITION: [8, 4, 0],   // looking across the gorge from the east ridge
  FOV: 55,
};

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------
export const SCENE = {
  FOG_DENSITY: 0.08,
  AMBIENT_INTENSITY: 0.4,
  SUN_POSITION: [-8, 6, -4],
  SUN_INTENSITY: 0.8,
  FILL_POSITION: [5, 3, 6],
  FILL_INTENSITY: 0.2,
  // Container CSS gradient — stays as Suspense/loading fallback even when
  // the SkyDome makes the canvas opaque at runtime (see SKY section below).
  BACKGROUND_GRADIENT: "linear-gradient(to top, #2a1800, #1a1020 50%, #0a0f1a)",
};

// ---------------------------------------------------------------------------
// SKY — SkyDome shader parameters (see SkyDome.jsx)
//
// SCENE.BACKGROUND_GRADIENT is the loading-state fallback: the container CSS
// gradient stays visible until the Canvas first paints; once the dome renders,
// the opaque canvas (alpha:false) covers it completely.
//
// STAR_DENSITY kill-switch: set to 0 to produce zero stars at runtime.
// The GLSL guard `uStarDensity > 0.0` enforces this explicitly even before
// the threshold math (h > 1.0 is also impossible for fract values in [0,1)).
// ---------------------------------------------------------------------------
export const SKY = {
  RADIUS: 60,            // sphere radius — well inside R3F default far=1000

  // Dusk gradient colors (navy zenith → violet mid → ember horizon)
  ZENITH: "#0a0f1a",     // deep navy — matches PALETTE.SLATE_950 at zenith
  VIOLET: "#241433",     // warm violet — twilight mid-sky band
  HORIZON: "#3b220a",    // dark amber — ember dusk at horizon

  // Gradient transition stops on direction-y axis (world-up)
  GRAD_Y0: -0.05,        // horizon band: below this → pure HORIZON color
  GRAD_Y1: 0.18,         // mid-sky: HORIZON blends to VIOLET between Y0→Y1
  GRAD_Y2: 0.55,         // zenith: VIOLET blends to ZENITH between Y1→Y2

  // Azimuthal sun-glow (warm ember tint toward SCENE.SUN_POSITION direction)
  SUN_GLOW_EXP: 3.0,     // falloff sharpness (higher = tighter cone)
  SUN_GLOW_STRENGTH: 0.35, // peak glow intensity (added on top of gradient)

  // Stars — whisper only; site retired astronomy theme.
  // STAR_DENSITY 0 = kill-switch (set STAR_DENSITY: 0 to disable entirely).
  STAR_DENSITY: 0.004,   // fraction of cells that show a star (0 disables)
  STAR_INTENSITY: 0.3,   // max star brightness — never HDR, never blooms
  STAR_MIN_Y: 0.35,      // only appear above violet band
  STAR_CELL_SCALE: 90.0, // cell grid density (higher = more, smaller cells)
};
