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
  BEECH_MID: "#235c43",        // beech/tulip poplar mid-slope deciduous — between GORGE_WALL_DARK and EMERALD
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

  // Small undulation — stable sine noise layered over the ridge base.
  // Feeds tree/firefly placement AND the route line heights (sampleHeight is shared).
  // Reducing these amplitudes calms ridgelines so the forest reads clearly.
  UNDULATION_AMP_A: 0.025,  // x-axis sine amplitude (was hardcoded 0.04)
  UNDULATION_AMP_B: 0.02,   // z-axis sine amplitude (was hardcoded 0.03)

  // Rim light — amber sun-crest highlight injected via onBeforeCompile.
  // Operates on outgoingLight (pre-opaque_fragment) → tone-mapped output → LDR.
  // Never crosses luminanceThreshold=1.0 bloom gate by design.
  // Hue cross-reference: RIM_COLOR approximates PALETTE.SUN_LIGHT ("#ff9944").
  RIM_COLOR: "#ff8844",
  RIM_STRENGTH: 0.55,
  RIM_POWER: 2.5,

  // Aerial perspective — replaces #include <fog_fragment> for this mesh only.
  // Trees, River, and Mist continue to use standard fogExp2 via fog:true.
  // AERIAL_COLOR_LOW cross-reference: matches PALETTE.FOG = PALETTE.SLATE_950 ("#0a0f1a").
  AERIAL_DENSITY: 0.07,
  AERIAL_STRENGTH: 0.85,
  AERIAL_Y_MIN: 0.4,           // world-Y where aerial blend begins (gorge floor level)
  AERIAL_Y_MAX: 2.2,           // world-Y where blend reaches full AERIAL_COLOR_HIGH
  AERIAL_COLOR_LOW: "#0a0f1a", // fog navy — cross-ref: PALETTE.FOG = PALETTE.SLATE_950
  AERIAL_COLOR_HIGH: "#2c1a28", // ember-violet (far-ridge haze)
};

// ---------------------------------------------------------------------------
// River — CatmullRomCurve3 + TubeGeometry along gorge floor
//
// SCROLL_SPEED removed in Unit 5: the old useFrame that animated
// material.map.offset was dead code — meshStandardMaterial with no texture
// has no map to scroll. Replaced by onBeforeCompile glint shader (see River.jsx).
//
// HDR contract: toneMapped={false} on the material; base color×emissive stays
// <1.0; glint adds ~2.6× to outgoingLight → selectively bloomed (Unit 10).
// ---------------------------------------------------------------------------
export const RIVER = {
  WAYPOINTS: 30,             // control points for the spline (more = smoother meander)
  TUBE_SEGMENTS: 80,         // radial subdivisions of TubeGeometry
  TUBE_RADIUS: 0.06,         // world units
  TUBE_RADIAL_SEGMENTS: 6,
  MEANDER_AMP: 0.35,         // x-axis sinusoidal offset amplitude (world units)
  MEANDER_FREQ: 2.5,         // π-multiples of z-range for meander cycles
  Y_OFFSET: 0.22,            // world Y of river surface (gorge floor ~0.08*2.5=0.2)
  EMISSIVE_INTENSITY: 0.35,
  OPACITY: 0.72,

  // Glint shader — traveling "last light" sparkles injected via onBeforeCompile.
  // Two co-prime sine bands on vUv.x (TubeGeometry UV runs along tube length).
  // GLINT_INTENSITY (~2.6) is the HDR push: only the sparkle peaks cross the
  // Bloom luminanceThreshold=1.0 gate; the base river surface never does.
  GLINT_FREQ_A: 24,          // band A spatial frequency (cycles per UV unit)
  GLINT_FREQ_B: 41,          // band B frequency — co-prime to A (no harmonic sync)
  GLINT_SPEED_A: 0.035,      // band A uTime scroll rate (positive = downstream)
  GLINT_SPEED_B: -0.02,      // band B scroll rate (negative = upstream shimmer)
  GLINT_SHARPNESS: 24,       // pow() exponent — higher = narrower sparkle peaks
  GLINT_INTENSITY: 2.6,      // HDR multiplier — crosses luminanceThreshold=1.0 gate
  GLINT_COLOR: "#bfe9ff",    // cool silver-blue — "caught light" on water surface
};

// ---------------------------------------------------------------------------
// Trees — three instanced species to read as forested, not dotted:
//
//   Band 1 — Hemlock (gorge walls)     h 0.18–0.55, close to gorge
//   Band 2 — Beech / tulip poplar      h 0.20–0.55, mid-slope everywhere
//            (fills the previously-empty open-slope zone)
//   Band 3 — Oak / canopy ridgeline    h > 0.45, any distance
//
// Bands overlap slightly at their edges so species transitions look organic.
// The gorge floor (h < ~0.15) is excluded from all three by their H_MIN values.
// MAX_ATTEMPTS give each species a 30–37× attempt budget to ensure >90% fill rate (verified by tests).
// ---------------------------------------------------------------------------
export const TREES = {
  // ---- Targets & attempt budgets ----
  HEMLOCK_TARGET: 380,   // was 150; raised to fill gorge-wall bands
  OAK_TARGET: 340,       // was 150; raised to fill ridgeline canopy
  BEECH_TARGET: 320,     // new mid-slope species (beech / tulip poplar / yellow birch)
  HEMLOCK_MAX_ATTEMPTS: 12000,  // was 3000; ~32× target ensures >90% fill
  OAK_MAX_ATTEMPTS: 12000,
  BEECH_MAX_ATTEMPTS: 12000,

  // ---- Seeds (one per species for independent determinism) ----
  HEMLOCK_SEED: 0xdeadbeef,
  // Oak reuses the hemlock rand stream (existing behavior — changing would shift placements)
  BEECH_SEED: 0xb33c4e57,   // independent stream for the new mid-slope species

  // ---- Hemlock: gorge wall — tall narrow dark conifers ----
  HEMLOCK_H_MIN: 0.18,
  HEMLOCK_H_MAX: 0.55,
  HEMLOCK_DIST_FROM_GORGE_MAX: 0.5,   // was 0.35; wider to close gorge-wall gaps
  HEMLOCK_SCALE_MIN: 0.25,
  HEMLOCK_SCALE_RANGE: 0.45,  // was 0.35; wider for understory size variety
  HEMLOCK_CONE_RADIUS: 0.2,
  HEMLOCK_CONE_HEIGHT: 1.0,
  HEMLOCK_CONE_SEGS: 5,
  HEMLOCK_X_SQUASH: 0.35,    // x/z scale relative to y (tall-narrow silhouette)
  HEMLOCK_Y_LIFT: 0.5,       // y offset factor relative to scale

  // ---- Beech / tulip poplar / yellow birch: mid-slope deciduous ----
  // Fills the open slope zone that was previously empty.
  // Shape between hemlock (narrow/tall) and oak (squat canopy).
  BEECH_H_MIN: 0.20,
  BEECH_H_MAX: 0.55,
  // No distFromGorge constraint — beeches grow across the full slope,
  // overlapping hemlock and oak zones at their edges for organic transitions.
  BEECH_SCALE_MIN: 0.25,
  BEECH_SCALE_RANGE: 0.50,   // wide range — mature beeches alongside understory saplings
  BEECH_CONE_RADIUS: 0.35,
  BEECH_CONE_HEIGHT: 0.85,
  BEECH_CONE_SEGS: 6,
  BEECH_X_SQUASH: 0.55,      // moderate spread (between hemlock narrow and oak squat)
  BEECH_Y_SQUASH: 0.85,      // slight y squash for rounded deciduous canopy shape
  BEECH_Y_LIFT: 0.45,

  // ---- Oak: ridgeline canopy — squat warm-green ----
  OAK_H_MIN: 0.45,    // was 0.5; lowered slightly to close ridge-to-slope transition gap
  OAK_SCALE_MIN: 0.3,
  OAK_SCALE_RANGE: 0.55,  // was 0.4; wider for understory oak variety
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
  // POINT_SIZE 0.14 (was 0.08): soft radial sprite reads smaller than a hard GL
  // point at the same pixel radius — scaling up compensates so on-screen apparent
  // size is unchanged after adding the glow texture map.
  POINT_SIZE: 0.14,

  // HDR selective-bloom contract (Unit 6):
  // HDR_PEAK: color scale factor at flash peak. With toneMapped={false}, a peak
  // value of 2.4 crosses the Bloom luminanceThreshold=1.0 gate only at the very
  // top of the J-arc. The quadratic formula `opacity * (1 + (HDR_PEAK-1)*opacity)`
  // ensures only near-peak flashes are HDR — at opacity=0.5 the multiplier is
  // 0.85, safely below threshold; at opacity=1.0 it reaches HDR_PEAK=2.4.
  HDR_PEAK: 2.4,

  // Glow sprite — passed to createRadialGlowTexture(SPRITE_SIZE, SPRITE_FALLOFF).
  // SPRITE_SIZE must be a power of two (GPU texture requirement).
  // SPRITE_FALLOFF >1 = soft quadratic centre; 2.2 gives a smooth organic halo.
  SPRITE_SIZE: 64,
  SPRITE_FALLOFF: 2.2,
};

// ---------------------------------------------------------------------------
// Camera — static position + CameraRig breath (Unit 9)
//
// CameraRig applies a Lissajous drift around POSITION every frame.
// LOOK_AT is re-asserted every frame (R3F only calls lookAt once at creation —
// see CameraRig.jsx JSDoc for the full rationale).
//
// Irrational-ish BREATH_RATIOS ([1.31, 0.73]) and BREATH_PHASES ([1.7, 3.1])
// ensure the Lissajous path never visibly repeats within a human-length session
// — the GCD period of these ratios with 1.0 is astronomically large relative
// to BREATH_PERIOD=64 s.
// ---------------------------------------------------------------------------
export const CAMERA = {
  POSITION: [8, 4, 0],   // looking across the gorge from the east ridge
  FOV: 55,

  // CameraRig breath — Lissajous drift parameters
  LOOK_AT: [0, 0, 0],           // target; re-asserted every frame by CameraRig
  BREATH_AMP: 0.15,             // world-unit drift amplitude
  BREATH_PERIOD: 64,            // seconds for one X-axis cycle
  // Irrational-ish frequency ratios → Lissajous path never visibly repeats
  BREATH_RATIOS: [1.31, 0.73],  // [Y-axis ratio, Z-axis ratio] relative to X
  BREATH_PHASES: [1.7, 3.1],    // [Y-axis phase offset, Z-axis phase offset] (radians)
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
// Route — race route CatmullRomCurve3 loop (see routeCurve.js, RouteLine.jsx)
//
// HDR contract: LINE color = PALETTE.ACCENT × HDR_BOOST.
// With toneMapped={false} and ACCENT "#00FFC2" (max linear channel ~1.0),
// the boosted color > 1.0 → crosses Bloom luminanceThreshold=1.0 gate.
// OPACITY is dimmed (0.55) so the headlamp (Unit 8) reads as brighter/louder.
//
// Y_OFFSET: world Y added above sampleHeight surface for all sampleHeight-based
// waypoints (keeps the route line hovering just above the terrain mesh).
// ---------------------------------------------------------------------------
export const ROUTE = {
  CURVE_SAMPLES: 120,   // getPoints() resolution — higher = smoother rendered line
  LINE_WIDTH: 1.8,      // LineMaterial lineWidth (world-space–ish units)
  DASH_SIZE: 0.4,       // world units per dash segment
  GAP_SIZE: 0.15,       // world units per gap between dashes
  DASH_SPEED: 0.6,      // dashOffset advance rate (units/sec)
  OPACITY: 0.55,        // dimmed for protagonist-contrast (headlamp > route)
  HDR_BOOST: 1.35,      // ACCENT multiplier → >1.0 linear → crosses bloom gate
  Y_OFFSET: 0.12,       // world Y above sampleHeight surface (hover clearance)
};

// ---------------------------------------------------------------------------
// Mist — Layered valley mist planes for atmospheric gorge depth (see Mist.jsx)
//
// OVERDRAW MITIGATION: Planes are sized to the gorge (WIDTH=7 × LENGTH=18),
// not the full terrain (SIZE=20). All LAYER_COUNT layers share ONE PlaneGeometry.
// Fallback levers in order of preference:
//   1. Reduce LAYER_COUNT to 3 (drop the topmost, least-visible layer)
//   2. Shrink WIDTH (tightens overdraw footprint while keeping depth coverage)
//
// LAYER ORDERING: LAYER_YS must be strictly ascending (tested contract).
// The lowest plane (y=0.35) sits above the river surface (y≈0.22); river glints
// read through at low opacities (0.06–0.16). See Mist.jsx render-order rationale
// for why no explicit renderOrder override is needed.
//
// DRIFT: DRIFT_SPEEDS sign controls primary UV drift direction on the x axis
// (positive = offset advances in +x; negative = advances in -x). The component
// applies a 0.3× y-component with the same sign, producing a slight diagonal
// drift per layer that breaks the purely horizontal appearance. Mixed signs
// ensure adjacent layers move in opposite directions for organic layered depth.
// All values stay in 0.004–0.012 range — fast enough to read, slow enough not
// to appear as a slide.
//
// REPEATS: per-layer [wrapX, wrapY] UV repeat factors. Slightly different
// repeats across layers break visible tiling registration between planes.
//
// TEX_SIZE must be a power of two (GPU texture requirement — tested contract).
// NOISE_SEED: 0xb4f3e19a — arbitrary hex constant for deterministic noise.
// ---------------------------------------------------------------------------
export const MIST = {
  LAYER_COUNT: 4,
  WIDTH: 7,
  LENGTH: 18,
  CENTER_X: 1.0,
  LAYER_YS: [0.35, 0.55, 0.78, 1.02],        // strictly ascending (tested)
  LAYER_OPACITIES: [0.16, 0.12, 0.09, 0.06], // each in (0,1) (tested)
  DRIFT_SPEEDS: [0.006, -0.008, 0.010, -0.004], // mixed signs; ~0.004–0.012 range
  REPEATS: [[2, 1], [3, 1.5], [1.5, 2], [2.5, 1]], // per-layer [wrapX, wrapY]
  COLOR: "#1c2a3a",   // deep gorge-fog tint — cross-ref: PALETTE.SLATE_950 family
  TEX_SIZE: 128,       // power of two (tested)
  NOISE_SEED: 0xb4f3e19a,
  NOISE_LATTICE: 8,
  NOISE_OCTAVES: 3,
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
