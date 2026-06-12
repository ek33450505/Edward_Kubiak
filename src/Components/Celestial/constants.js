/**
 * constants.js — Single source of tunables for the Celestial art scene.
 *
 * All numeric knobs live here; components import named constants.
 * No inline magic numbers in scene files — edit here, see the result.
 */

// ---------------------------------------------------------------------------
// STARS — drei <Stars> base field
// ---------------------------------------------------------------------------
export const STARS = {
  COUNT: 6000,
  RADIUS: 100,
  DEPTH: 50,
  FACTOR: 4,
  SATURATION: 0.8,
  FADE: true,
};

// ---------------------------------------------------------------------------
// NEBULA — 5 point-cloud layers, depths spread z: -30 to -100
//
// Each layer is a BufferGeometry point cloud at the specified depth.
// hdrMult: channel multiplier applied to the toneMapped=false HDR emitter
// sub-cloud — must produce channel values > 1.0 so the bloom gate triggers.
// ---------------------------------------------------------------------------
export const NEBULA = [
  { color: '#00FFC2', count: 800, z: -30,  hdrMult: 2.2 }, // mint/accent-400
  { color: '#38bdf8', count: 600, z: -55,  hdrMult: 2.0 }, // sky-400
  { color: '#a78bfa', count: 500, z: -70,  hdrMult: 1.9 }, // violet
  { color: '#fb7185', count: 400, z: -85,  hdrMult: 1.8 }, // rose-400
  { color: '#34d399', count: 350, z: -100, hdrMult: 1.7 }, // emerald-400
];

// HDR_FRACTION: top fraction of particles per layer that get toneMapped=false + HDR vals > 1.0.
// At HDR_FRACTION=0.05, these particles pass the LUMINANCE_THRESHOLD=1.0 gate and bloom.
export const HDR_FRACTION = 0.05;

// ---------------------------------------------------------------------------
// COMETS — single rare meteor config
//
// TRAIL_SPAN: fraction of the flight path covered by the trail behind the head.
//   frac = t - (i / TRAIL_LENGTH) * TRAIL_SPAN
//   With TRAIL_LENGTH=32 points over 18% of path, sprites overlap →
//   continuous tapering streak instead of discrete dots.
//
// DEPTH: flight z is constrained to [-60, -30] — far enough from the camera
//   (at z=30) that gl_PointSize attenuation stays flat and the head can't
//   balloon into a large orb on a close pass. Both start and end z are drawn
//   from this range so the flight reads as near-parallel-to-screen.
//
// DORMANCY: random idle between flights drawn from the mulberry32 instance
//   (deterministic; no Math.random). Page loads show calm star field first —
//   first meteor is a discovered moment, not an opening act.
// ---------------------------------------------------------------------------
export const COMETS = {
  POOL: 1,              // one meteor in flight at most
  TRAIL_LENGTH: 32,     // trail point count (more points → overlap → solid streak)
  TRAIL_SPAN: 0.18,     // path fraction covered by trail (overlap contract)
  SPEED: 0.85,          // t-units/sec → ~1.2 s traversal; quick like a real meteor
  SEED: 0xdeadbeef,     // mulberry32 base seed — deterministic positions
  SPAWN_RADIUS: 60,     // scatter radius for spawn positions
  ARC_CURVE: 0.15,      // lateral arc amplitude (low — meteors fly near-straight)
  DEPTH_MIN: -60,       // z far bound — keeps meteor deep, attenuation flat
  DEPTH_MAX: -30,       // z near bound — prevents close-pass bloating
  HEAD_SIZE: 3.0,       // gl_PointSize scale for head sprite
  COLOR: '#D8FFF4',     // near-white-hot with mint tinge — realistic and blooms
  HDR_MULT: 2.4,        // channel multiplier (> 1.0) → passes LUMINANCE_THRESHOLD=1.0
  DORMANCY_MIN: 6,      // minimum seconds idle between flights
  DORMANCY_MAX: 14,     // maximum seconds idle between flights
  ALPHA_DISCARD: 0.01,  // fragment discard threshold in ShootingStars shader
};

// ---------------------------------------------------------------------------
// CAMERA — Lissajous breath path
//
// Irrational-ish BREATH_RATIOS and BREATH_PHASES ensure the path never
// visibly repeats within a human-length session.
// ---------------------------------------------------------------------------
export const CAMERA = {
  POSITION: [0, 0, 30],
  LOOK_AT: [0, 0, 0],
  BREATH_PERIOD: 22,           // seconds per base cycle
  BREATH_AMP: 0.9,             // world-unit amplitude
  BREATH_RATIOS: [1.31, 0.73],
  BREATH_PHASES: [1.7, 3.1],
};

// ---------------------------------------------------------------------------
// PARALLAX — nebula group mouse-rotation lerp
// ---------------------------------------------------------------------------
export const PARALLAX = {
  STRENGTH: 0.04,  // rotation radians at full cursor deflection
  LERP: 0.05,      // smoothing factor per frame
};

// ---------------------------------------------------------------------------
// BLOOM — EffectComposer selective-bloom + vignette
//
// Selective-bloom recipe (pmndrs standard, documented for future maintainers):
//   1. Scene renderer uses default ACESFilmic tone mapping.
//   2. All standard tone-mapped materials (stars, nebula base layer) produce
//      pixel values < 1.0 after tone mapping — they can NEVER trigger bloom.
//   3. Every intentional emitter sets `toneMapped={false}` and pushes its color
//      channel value above 1.0 (HDR emitters: nebula HDR sub-cloud per hdrMult,
//      comet heads ×2.2).
//   4. LUMINANCE_THRESHOLD=1.0 is THE selectivity gate: only toneMapped=false HDR
//      emitters pass it.  Lowering this threshold would begin blooming the entire
//      tone-mapped scene — do NOT lower it without reconsidering the full material
//      table in the plan.
//
// MULTISAMPLING=0 rationale:
//   antialias is already false on the Canvas WebGLRenderer — adding MSAA buffers
//   inside the composer would be redundant and waste GPU memory.  Default in
//   @react-three/postprocessing is 8; must be explicit 0 to override.
//
// LEVELS=6 rationale:
//   postprocessing Bloom default is 8 mip levels.  Capping at 6 reduces the mip
//   chain cost while preserving visible bloom radius.  Fallback lever: reduce to 5.
//
// frameloop="demand" compatibility:
//   The EffectComposer renders inside a priority useFrame (R3F internals), so it
//   respects demand-mode frame scheduling and pauses when the canvas is off-screen
//   — no extra wiring required.
//
// No ToneMapping effect added:
//   Scene materials tone-map in-shader via the renderer's default ACES mapping.
//   HDR emitters bypass via toneMapped:false.  The composer's HalfFloat buffer
//   (default) preserves the HDR values for the Bloom pass, then outputs LDR to
//   screen.  Adding a ToneMapping effect would double-apply ACESFilmic to LDR pixels.
// ---------------------------------------------------------------------------
export const BLOOM = {
  MULTISAMPLING: 0,            // override default=8; antialias already off on Canvas
  INTENSITY: 0.85,             // overall bloom strength — fallback: reduce toward 0.5
  LUMINANCE_THRESHOLD: 1.0,    // THE selectivity contract — only toneMapped=false HDR emitters bloom
  LUMINANCE_SMOOTHING: 0.15,   // soft knee width around threshold (avoids hard cutoff flicker)
  RADIUS: 0.75,                // bloom spread radius (0=tight, 1=very wide)
  LEVELS: 6,                   // mip-chain depth (default=8; 6 caps cost, preserves visual radius)
  VIGNETTE_OFFSET: 0.28,       // inner edge of vignette darkening (0=center, 1=full frame)
  VIGNETTE_DARKNESS: 0.55,     // max darkness at corners (0=no vignette, 1=full black)
};

// ---------------------------------------------------------------------------
// SPRITE — glow texture params (shared by NebulaLayer and ShootingStars)
// ---------------------------------------------------------------------------
export const SPRITE = {
  SIZE: 64,
  FALLOFF_EXP: 2.5,
};
