/**
 * TrailTerrain.test.jsx
 *
 * jsdom is NOT installed in this project — all tests run in node env.
 * There is no React DOM renderer available, so full component render tests
 * are not possible. Instead we verify:
 *
 * (1) Reduced-motion bail-out contract: TrailTerrain calls useReducedMotion()
 *     and returns null when it is true.
 *
 * (2) Export contract: default export is a function named TrailTerrain,
 *     verifying the lazy() import site can resolve it.
 *
 * (3) index.js re-export passes through the same default export.
 *
 * (4) constants.js contract: palette keys present, counts within sane bounds,
 *     tunable numbers are exported and named (not magic inline values).
 *
 * (5) useFrameloopWhenVisible: hook export exists and is a function.
 *
 * Canvas mock approach: mock @react-three/fiber so Canvas is a no-op.
 * This avoids WebGL stub complexity and is consistent with prior approach.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Module-level mocks (hoisted — must appear before any dynamic imports)
// ---------------------------------------------------------------------------
vi.mock("@react-three/fiber", () => ({
  Canvas: vi.fn(() => null),
  useFrame: vi.fn(),
}));

vi.mock("@react-three/drei", () => ({
  Line: vi.fn(() => null),
}));

vi.mock("@react-three/postprocessing", () => ({
  EffectComposer: vi.fn(() => null),
  Bloom: vi.fn(() => null),
  Vignette: vi.fn(() => null),
}));

// ---------------------------------------------------------------------------
// Test suite 1 — reduced-motion bail-out logic
// ---------------------------------------------------------------------------
describe("TrailTerrain — reduced-motion bail-out", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when useReducedMotion() is true (verified via source logic)", async () => {
    vi.doMock("motion/react", () => ({ useReducedMotion: () => true }));

    const mod = await import("./TrailTerrain");
    const TrailTerrain = mod.default;

    expect(typeof TrailTerrain).toBe("function");

    const src = TrailTerrain.toString();
    expect(src).toContain("useReducedMotion");
    expect(src).toContain("return null");
  });

  it("component source references reducedMotion bail before rendering Canvas", async () => {
    vi.doMock("motion/react", () => ({ useReducedMotion: () => true }));

    const mod = await import("./TrailTerrain");
    const src = mod.default.toString();

    const nullIdx = src.indexOf("return null");
    const canvasIdx = src.indexOf("Canvas");
    expect(nullIdx).toBeGreaterThan(0);
    expect(canvasIdx).toBeGreaterThan(nullIdx);
  });
});

// ---------------------------------------------------------------------------
// Test suite 2 — export contract (normal render path)
// ---------------------------------------------------------------------------
describe("TrailTerrain — export contract", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock("motion/react", () => ({ useReducedMotion: () => false }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("default export is a named function called TrailTerrain", async () => {
    const mod = await import("./TrailTerrain");
    expect(typeof mod.default).toBe("function");
    expect(mod.default.name).toBe("TrailTerrain");
  });

  it("component source references aria-hidden (decorative, not interactive)", async () => {
    const mod = await import("./TrailTerrain");
    const src = mod.default.toString();
    expect(src).toContain("aria-hidden");
    expect(src).toMatch(/aria-hidden[^,\n]*true/);
  });

  it("component source references pointer-events-none (never intercepts clicks)", async () => {
    const mod = await import("./TrailTerrain");
    const src = mod.default.toString();
    expect(src).toContain("pointer-events-none");
  });

  it("component source uses Canvas with dpr and alpha:false (dome+composer rationale)", async () => {
    // alpha:false: SkyDome makes canvas opaque; transparent FBO + EffectComposer
    // (Unit 10) causes alpha-fringe artifacts on bloomed pixels; opaque canvas
    // skips page compositing. See TrailTerrain.jsx header comment for full rationale.
    const mod = await import("./TrailTerrain");
    const src = mod.default.toString();
    expect(src).toContain("dpr");
    expect(src).toContain("alpha: false");
  });
});

// ---------------------------------------------------------------------------
// Test suite 3 — direct export contract (index.js removed; barrel was dead)
// ---------------------------------------------------------------------------
describe("TrailTerrain — direct export contract", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock("motion/react", () => ({ useReducedMotion: () => false }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("TrailTerrain.jsx default export is a function named TrailTerrain", async () => {
    const mod = await import("./TrailTerrain");
    expect(typeof mod.default).toBe("function");
    expect(mod.default.name).toBe("TrailTerrain");
  });
});

// ---------------------------------------------------------------------------
// Test suite 4 — constants.js contract
// ---------------------------------------------------------------------------
describe("constants.js — tunable parameter exports", () => {
  it("PALETTE exports required site-token keys", async () => {
    const { PALETTE } = await import("./constants");
    expect(PALETTE).toHaveProperty("ACCENT");
    expect(PALETTE).toHaveProperty("EMERALD");
    expect(PALETTE).toHaveProperty("SKY");
    expect(PALETTE).toHaveProperty("SLATE_950");
    // Values are valid hex strings
    expect(PALETTE.ACCENT).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(PALETTE.EMERALD).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(PALETTE.SKY).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it("TERRAIN exports segment count and size within sane bounds", async () => {
    const { TERRAIN } = await import("./constants");
    expect(TERRAIN.SEGMENTS).toBeGreaterThanOrEqual(32);
    expect(TERRAIN.SEGMENTS).toBeLessThanOrEqual(512);
    expect(TERRAIN.SIZE).toBeGreaterThan(0);
    expect(TERRAIN.HEIGHT_SCALE).toBeGreaterThan(0);
  });

  it("FIREFLIES exports COUNT and GROUP_COUNT within sane bounds", async () => {
    const { FIREFLIES } = await import("./constants");
    expect(FIREFLIES.COUNT).toBeGreaterThanOrEqual(100);
    expect(FIREFLIES.COUNT).toBeLessThanOrEqual(2000);
    expect(FIREFLIES.GROUP_COUNT).toBeGreaterThanOrEqual(1);
    expect(FIREFLIES.FLASH_IN).toBeGreaterThan(0);
    expect(FIREFLIES.FLASH_OUT).toBeGreaterThan(0);
    expect(FIREFLIES.IDLE_MIN).toBeGreaterThan(0);
  });

  it("TREES exports tree counts within sane bounds", async () => {
    const { TREES } = await import("./constants");
    expect(TREES.HEMLOCK_TARGET).toBeGreaterThanOrEqual(10);
    expect(TREES.HEMLOCK_TARGET).toBeLessThanOrEqual(800);
    expect(TREES.OAK_TARGET).toBeGreaterThanOrEqual(10);
    expect(TREES.OAK_TARGET).toBeLessThanOrEqual(800);
    // Beech (mid-slope species added to fill open-slope zone)
    expect(TREES.BEECH_TARGET).toBeGreaterThanOrEqual(10);
    expect(TREES.BEECH_TARGET).toBeLessThanOrEqual(800);
  });

  it("TREES exports BEECH species geometry and placement constants", async () => {
    const { TREES } = await import("./constants");
    // Seeds
    expect(typeof TREES.HEMLOCK_SEED).toBe("number");
    expect(typeof TREES.BEECH_SEED).toBe("number");
    // Placement band — above gorge floor, below ridgeline
    expect(TREES.BEECH_H_MIN).toBeGreaterThanOrEqual(0.15);
    expect(TREES.BEECH_H_MAX).toBeLessThanOrEqual(0.65);
    expect(TREES.BEECH_H_MIN).toBeLessThan(TREES.BEECH_H_MAX);
    // Geometry
    expect(TREES.BEECH_CONE_RADIUS).toBeGreaterThan(0);
    expect(TREES.BEECH_CONE_HEIGHT).toBeGreaterThan(0);
    expect(TREES.BEECH_CONE_SEGS).toBeGreaterThanOrEqual(3);
    // Scale
    expect(TREES.BEECH_SCALE_MIN).toBeGreaterThan(0);
    expect(TREES.BEECH_SCALE_RANGE).toBeGreaterThan(0);
    // Attempt budget
    expect(TREES.BEECH_MAX_ATTEMPTS).toBeGreaterThanOrEqual(TREES.BEECH_TARGET * 2);
  });

  it("TERRAIN exports UNDULATION_AMP_A and UNDULATION_AMP_B", async () => {
    const { TERRAIN } = await import("./constants");
    expect(typeof TERRAIN.UNDULATION_AMP_A).toBe("number");
    expect(typeof TERRAIN.UNDULATION_AMP_B).toBe("number");
    // Should be small positive fractions (ridge noise amplitude)
    expect(TERRAIN.UNDULATION_AMP_A).toBeGreaterThan(0);
    expect(TERRAIN.UNDULATION_AMP_A).toBeLessThan(0.15);
    expect(TERRAIN.UNDULATION_AMP_B).toBeGreaterThan(0);
    expect(TERRAIN.UNDULATION_AMP_B).toBeLessThan(0.15);
  });

  it("CAMERA exports POSITION as a 3-element array and FOV in sane range", async () => {
    const { CAMERA } = await import("./constants");
    expect(Array.isArray(CAMERA.POSITION)).toBe(true);
    expect(CAMERA.POSITION).toHaveLength(3);
    expect(CAMERA.FOV).toBeGreaterThan(0);
    expect(CAMERA.FOV).toBeLessThanOrEqual(180);
  });
});

// ---------------------------------------------------------------------------
// Test suite 5 — useFrameloopWhenVisible hook export
// ---------------------------------------------------------------------------
describe("useFrameloopWhenVisible hook", () => {
  it("is exported as a function from src/hooks/useFrameloopWhenVisible.js", async () => {
    const mod = await import("../../hooks/useFrameloopWhenVisible");
    expect(typeof mod.useFrameloopWhenVisible).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// Test suite 6 — SKY constants contract
// ---------------------------------------------------------------------------
describe("constants.js — SKY section", () => {
  it("exports required SKY keys", async () => {
    const { SKY } = await import("./constants");
    const requiredKeys = [
      "RADIUS", "ZENITH", "VIOLET", "HORIZON",
      "GRAD_Y0", "GRAD_Y1", "GRAD_Y2",
      "SUN_GLOW_EXP", "SUN_GLOW_STRENGTH",
      "STAR_DENSITY", "STAR_INTENSITY", "STAR_MIN_Y", "STAR_CELL_SCALE",
    ];
    for (const key of requiredKeys) {
      expect(SKY).toHaveProperty(key);
    }
  });

  it("SKY color values are valid 6-digit hex strings", async () => {
    const { SKY } = await import("./constants");
    const hexRe = /^#[0-9a-fA-F]{6}$/;
    expect(SKY.ZENITH).toMatch(hexRe);
    expect(SKY.VIOLET).toMatch(hexRe);
    expect(SKY.HORIZON).toMatch(hexRe);
  });

  it("SKY.STAR_DENSITY >= 0 (0 is the kill-switch; never negative)", async () => {
    const { SKY } = await import("./constants");
    expect(SKY.STAR_DENSITY).toBeGreaterThanOrEqual(0);
  });

  it("SKY.RADIUS is within 20–500 world units", async () => {
    const { SKY } = await import("./constants");
    expect(SKY.RADIUS).toBeGreaterThanOrEqual(20);
    expect(SKY.RADIUS).toBeLessThanOrEqual(500);
  });

  it("gradient stops are strictly ascending: GRAD_Y0 < GRAD_Y1 < GRAD_Y2", async () => {
    const { SKY } = await import("./constants");
    expect(SKY.GRAD_Y0).toBeLessThan(SKY.GRAD_Y1);
    expect(SKY.GRAD_Y1).toBeLessThan(SKY.GRAD_Y2);
  });
});

// ---------------------------------------------------------------------------
// Test suite 6b — TREES placement behavioral contract
//
// Simulates the placement loop logic using the same predicates as Trees.jsx.
// Verifies: (1) each species achieves >= 90% of its TARGET within MAX_ATTEMPTS;
//           (2) no placed tree is below the gorge-floor exclusion height (~0.15).
//
// sampleHeight and mulberry32 are node-importable (pure math, no WebGL).
// ---------------------------------------------------------------------------
describe("TREES placement — behavioral contract", () => {
  it("hemlock: achieves >= 90% of HEMLOCK_TARGET within HEMLOCK_MAX_ATTEMPTS", async () => {
    const { TREES, TERRAIN } = await import("./constants");
    const { sampleHeight } = await import("./Terrain");
    const { mulberry32 } = await import("./prng");

    const rand = mulberry32(TREES.HEMLOCK_SEED);
    let placed = 0;
    let attempts = 0;
    while (placed < TREES.HEMLOCK_TARGET && attempts < TREES.HEMLOCK_MAX_ATTEMPTS) {
      attempts++;
      const nx = rand() * 2 - 1;
      const nz = rand() * 2 - 1;
      const h = sampleHeight(nx, nz);
      const distFromGorge = Math.abs(nx - TERRAIN.GORGE_CENTER);
      if (
        h >= TREES.HEMLOCK_H_MIN &&
        h <= TREES.HEMLOCK_H_MAX &&
        distFromGorge < TREES.HEMLOCK_DIST_FROM_GORGE_MAX
      ) {
        placed++;
        // Consume scale rand (mirrors Trees.jsx loop)
        rand();
      }
    }
    expect(placed).toBeGreaterThanOrEqual(Math.floor(TREES.HEMLOCK_TARGET * 0.9));
  });

  it("beech: achieves >= 90% of BEECH_TARGET within BEECH_MAX_ATTEMPTS", async () => {
    const { TREES } = await import("./constants");
    const { sampleHeight } = await import("./Terrain");
    const { mulberry32 } = await import("./prng");

    const beechRand = mulberry32(TREES.BEECH_SEED);
    let placed = 0;
    let attempts = 0;
    while (placed < TREES.BEECH_TARGET && attempts < TREES.BEECH_MAX_ATTEMPTS) {
      attempts++;
      const nx = beechRand() * 2 - 1;
      const nz = beechRand() * 2 - 1;
      const h = sampleHeight(nx, nz);
      if (h >= TREES.BEECH_H_MIN && h <= TREES.BEECH_H_MAX) {
        placed++;
        // Consume scale rand (mirrors Trees.jsx loop)
        beechRand();
      }
    }
    expect(placed).toBeGreaterThanOrEqual(Math.floor(TREES.BEECH_TARGET * 0.9));
  });

  it("oak: achieves >= 90% of OAK_TARGET within OAK_MAX_ATTEMPTS (continuing hemlock rand stream)", async () => {
    const { TREES, TERRAIN } = await import("./constants");
    const { sampleHeight } = await import("./Terrain");
    const { mulberry32 } = await import("./prng");

    // Mirror Trees.jsx: oak continues the shared rand stream after hemlock finishes
    const rand = mulberry32(TREES.HEMLOCK_SEED);
    // Drain hemlock loop to match Trees.jsx rand stream state
    let hemlockPlaced = 0;
    let hemlockAttempts = 0;
    while (hemlockPlaced < TREES.HEMLOCK_TARGET && hemlockAttempts < TREES.HEMLOCK_MAX_ATTEMPTS) {
      hemlockAttempts++;
      const nx = rand() * 2 - 1;
      const nz = rand() * 2 - 1;
      const h = sampleHeight(nx, nz);
      const distFromGorge = Math.abs(nx - TERRAIN.GORGE_CENTER);
      if (
        h >= TREES.HEMLOCK_H_MIN &&
        h <= TREES.HEMLOCK_H_MAX &&
        distFromGorge < TREES.HEMLOCK_DIST_FROM_GORGE_MAX
      ) {
        hemlockPlaced++;
        rand(); // consume scale rand
      }
    }

    // Now drain oak loop
    let placed = 0;
    let attempts = 0;
    while (placed < TREES.OAK_TARGET && attempts < TREES.OAK_MAX_ATTEMPTS) {
      attempts++;
      const nx = rand() * 2 - 1;
      const nz = rand() * 2 - 1;
      const h = sampleHeight(nx, nz);
      if (h > TREES.OAK_H_MIN) {
        placed++;
        rand(); // consume scale rand
      }
    }
    expect(placed).toBeGreaterThanOrEqual(Math.floor(TREES.OAK_TARGET * 0.9));
  });

  it("no species H_MIN is below the gorge-floor exclusion threshold (h ~0.15)", async () => {
    const { TREES, TERRAIN } = await import("./constants");
    const FLOOR_EXCLUSION = 0.15; // gorge floor / river zone to keep clear
    expect(TREES.HEMLOCK_H_MIN).toBeGreaterThanOrEqual(FLOOR_EXCLUSION);
    expect(TREES.BEECH_H_MIN).toBeGreaterThanOrEqual(FLOOR_EXCLUSION);
    expect(TREES.OAK_H_MIN).toBeGreaterThanOrEqual(FLOOR_EXCLUSION);
    // Belt-and-suspenders: GORGE_FLOOR_HEIGHT itself is well below all H_MINs
    expect(TERRAIN.GORGE_FLOOR_HEIGHT).toBeLessThan(TREES.HEMLOCK_H_MIN);
    expect(TERRAIN.GORGE_FLOOR_HEIGHT).toBeLessThan(TREES.BEECH_H_MIN);
    expect(TERRAIN.GORGE_FLOOR_HEIGHT).toBeLessThan(TREES.OAK_H_MIN);
  });
});

// ---------------------------------------------------------------------------
// Test suite 7 — ROUTE constants contract (Unit 4)
// ---------------------------------------------------------------------------
describe("constants.js — ROUTE section", () => {
  it("exports all required ROUTE keys", async () => {
    const { ROUTE } = await import("./constants");
    const requiredKeys = [
      "CURVE_SAMPLES",
      "LINE_WIDTH",
      "DASH_SIZE",
      "GAP_SIZE",
      "DASH_SPEED",
      "OPACITY",
      "HDR_BOOST",
      "Y_OFFSET",
    ];
    for (const key of requiredKeys) {
      expect(ROUTE).toHaveProperty(key);
    }
  });

  it("ROUTE.OPACITY is in (0, 1] (valid opacity range)", async () => {
    const { ROUTE } = await import("./constants");
    expect(ROUTE.OPACITY).toBeGreaterThan(0);
    expect(ROUTE.OPACITY).toBeLessThanOrEqual(1);
  });

  it("ROUTE.HDR_BOOST > 1.0 (must cross Bloom luminanceThreshold=1.0 gate)", async () => {
    const { ROUTE } = await import("./constants");
    expect(ROUTE.HDR_BOOST).toBeGreaterThan(1.0);
  });

  it("ROUTE.CURVE_SAMPLES is a positive integer (getPoints resolution)", async () => {
    const { ROUTE } = await import("./constants");
    expect(ROUTE.CURVE_SAMPLES).toBeGreaterThan(0);
    expect(Number.isInteger(ROUTE.CURVE_SAMPLES)).toBe(true);
  });

  it("ROUTE.Y_OFFSET is a positive number (hover clearance above terrain)", async () => {
    const { ROUTE } = await import("./constants");
    expect(typeof ROUTE.Y_OFFSET).toBe("number");
    expect(ROUTE.Y_OFFSET).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Test suite 8a — FIREFLIES HDR / glow constants contract (Unit 6)
// ---------------------------------------------------------------------------
describe("constants.js — FIREFLIES HDR and glow sprite constants", () => {
  it("HDR_PEAK > 1 (must be able to push past Bloom luminanceThreshold=1.0)", async () => {
    const { FIREFLIES } = await import("./constants");
    expect(FIREFLIES.HDR_PEAK).toBeGreaterThan(1);
  });

  it("SPRITE_SIZE is a power of two in [16, 256] (GPU texture requirement)", async () => {
    const { FIREFLIES } = await import("./constants");
    const s = FIREFLIES.SPRITE_SIZE;
    expect(s).toBeGreaterThanOrEqual(16);
    expect(s).toBeLessThanOrEqual(256);
    // isPowerOfTwo: only one bit set
    expect((s & (s - 1))).toBe(0);
  });

  it("SPRITE_FALLOFF > 0 (required for createRadialGlowTexture falloffExp param)", async () => {
    const { FIREFLIES } = await import("./constants");
    expect(FIREFLIES.SPRITE_FALLOFF).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Test suite 8b — CAMERA breath constants contract (Unit 9)
// ---------------------------------------------------------------------------
describe("constants.js — CAMERA breath constants", () => {
  it("LOOK_AT is a 3-element array", async () => {
    const { CAMERA } = await import("./constants");
    expect(Array.isArray(CAMERA.LOOK_AT)).toBe(true);
    expect(CAMERA.LOOK_AT).toHaveLength(3);
  });

  it("BREATH_AMP is in (0, 0.5] (gentle drift — felt not seen)", async () => {
    const { CAMERA } = await import("./constants");
    expect(CAMERA.BREATH_AMP).toBeGreaterThan(0);
    expect(CAMERA.BREATH_AMP).toBeLessThanOrEqual(0.5);
  });

  it("BREATH_PERIOD >= 30 (slow enough to feel organic over a full session)", async () => {
    const { CAMERA } = await import("./constants");
    expect(CAMERA.BREATH_PERIOD).toBeGreaterThanOrEqual(30);
  });

  it("BREATH_RATIOS is a 2-element array (Y-axis and Z-axis frequency ratios)", async () => {
    const { CAMERA } = await import("./constants");
    expect(Array.isArray(CAMERA.BREATH_RATIOS)).toBe(true);
    expect(CAMERA.BREATH_RATIOS).toHaveLength(2);
  });

  it("BREATH_PHASES is a 2-element array (Y-axis and Z-axis phase offsets)", async () => {
    const { CAMERA } = await import("./constants");
    expect(Array.isArray(CAMERA.BREATH_PHASES)).toBe(true);
    expect(CAMERA.BREATH_PHASES).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Test suite 8c — CameraRig export contract (Unit 9)
// ---------------------------------------------------------------------------
describe("CameraRig — export contract", () => {
  it("default export is a function", async () => {
    const mod = await import("./CameraRig");
    expect(typeof mod.default).toBe("function");
  });

  it("source references lookAt (re-assertion every frame is the critical contract)", async () => {
    const mod = await import("./CameraRig");
    const src = mod.default.toString();
    expect(src).toContain("lookAt");
  });

  it("source references CAMERA.LOOK_AT (target comes from constants, not a magic literal)", async () => {
    const mod = await import("./CameraRig");
    const src = mod.default.toString();
    // Source string check on the module file (function body may be minified in tests,
    // but in vitest node env JSX is not minified so identifiers survive).
    // Cross-check via direct source import to be resilient.
    const { readFileSync } = await import("fs");
    const fileSrc = readFileSync(
      new URL("./CameraRig.jsx", import.meta.url).pathname,
      "utf8",
    );
    expect(fileSrc).toContain("CAMERA.LOOK_AT");
  });
});

// ---------------------------------------------------------------------------
// Test suite 8 — SkyDome export contract
// ---------------------------------------------------------------------------
describe("SkyDome — export contract", () => {
  it("default export is a function", async () => {
    // SkyDome imports only from 'react' and 'three' — both node-importable.
    // JSX is transpiled by Vitest; no WebGL context required for import.
    const mod = await import("./SkyDome");
    expect(typeof mod.default).toBe("function");
  });

  it("source references BackSide (interior face visible from inside sphere)", async () => {
    const mod = await import("./SkyDome");
    const src = mod.default.toString();
    expect(src).toContain("BackSide");
  });

  it("source references renderOrder (ensures dome draws before scene objects)", async () => {
    const mod = await import("./SkyDome");
    const src = mod.default.toString();
    expect(src).toContain("renderOrder");
  });

  it("source references depthWrite and fog: false (dome must not occlude or be fogged)", async () => {
    const mod = await import("./SkyDome");
    const src = mod.default.toString();
    expect(src).toContain("depthWrite");
    expect(src).toContain("fog: false");
  });

  it("source references frustumCulled={false} (camera inside sphere — always visible)", async () => {
    const mod = await import("./SkyDome");
    const src = mod.default.toString();
    expect(src).toContain("frustumCulled");
  });
});

// ---------------------------------------------------------------------------
// Test suite 9 — MIST constants contract (Unit 7)
// ---------------------------------------------------------------------------
describe("constants.js — MIST section", () => {
  it("exports required MIST keys", async () => {
    const { MIST } = await import("./constants");
    const requiredKeys = [
      "LAYER_COUNT", "WIDTH", "LENGTH", "CENTER_X",
      "LAYER_YS", "LAYER_OPACITIES", "DRIFT_SPEEDS", "REPEATS",
      "COLOR", "TEX_SIZE", "NOISE_SEED", "NOISE_LATTICE", "NOISE_OCTAVES",
    ];
    for (const key of requiredKeys) {
      expect(MIST).toHaveProperty(key);
    }
  });

  it("all per-layer arrays have length === LAYER_COUNT", async () => {
    const { MIST } = await import("./constants");
    expect(MIST.LAYER_YS).toHaveLength(MIST.LAYER_COUNT);
    expect(MIST.LAYER_OPACITIES).toHaveLength(MIST.LAYER_COUNT);
    expect(MIST.DRIFT_SPEEDS).toHaveLength(MIST.LAYER_COUNT);
    expect(MIST.REPEATS).toHaveLength(MIST.LAYER_COUNT);
  });

  it("LAYER_OPACITIES are all in open interval (0, 1)", async () => {
    const { MIST } = await import("./constants");
    for (const op of MIST.LAYER_OPACITIES) {
      expect(op).toBeGreaterThan(0);
      expect(op).toBeLessThan(1);
    }
  });

  it("LAYER_YS is strictly ascending (lower planes must be first)", async () => {
    const { MIST } = await import("./constants");
    for (let i = 1; i < MIST.LAYER_YS.length; i++) {
      expect(MIST.LAYER_YS[i]).toBeGreaterThan(MIST.LAYER_YS[i - 1]);
    }
  });

  it("TEX_SIZE is a power of two in [16, 512] (GPU texture requirement)", async () => {
    const { MIST } = await import("./constants");
    const s = MIST.TEX_SIZE;
    expect(s).toBeGreaterThanOrEqual(16);
    expect(s).toBeLessThanOrEqual(512);
    // isPowerOfTwo: only one bit set
    expect(s & (s - 1)).toBe(0);
  });

  it("MIST.COLOR is a valid 6-digit hex string", async () => {
    const { MIST } = await import("./constants");
    expect(MIST.COLOR).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it("LAYER_YS lowest plane is above river surface y≈0.22 (river glints read through)", async () => {
    const { MIST, RIVER } = await import("./constants");
    expect(MIST.LAYER_YS[0]).toBeGreaterThan(RIVER.Y_OFFSET);
  });
});

// ---------------------------------------------------------------------------
// Test suite 10 — Mist export contract (Unit 7)
// ---------------------------------------------------------------------------
describe("Mist — export contract", () => {
  it("default export is a function", async () => {
    const mod = await import("./Mist");
    expect(typeof mod.default).toBe("function");
  });

  it("source references depthWrite (transparent planes must not write depth buffer)", async () => {
    const { readFileSync } = await import("fs");
    const fileSrc = readFileSync(
      new URL("./Mist.jsx", import.meta.url).pathname,
      "utf8",
    );
    expect(fileSrc).toContain("depthWrite");
  });

  it("source references clone (per-layer texture cloning required for independent drift)", async () => {
    const { readFileSync } = await import("fs");
    const fileSrc = readFileSync(
      new URL("./Mist.jsx", import.meta.url).pathname,
      "utf8",
    );
    expect(fileSrc).toContain("clone");
  });

  it("source references NormalBlending (mist occludes, does not glow — not additive)", async () => {
    const { readFileSync } = await import("fs");
    const fileSrc = readFileSync(
      new URL("./Mist.jsx", import.meta.url).pathname,
      "utf8",
    );
    expect(fileSrc).toContain("NormalBlending");
  });

  it("source references dispose (cloned textures require manual cleanup)", async () => {
    const { readFileSync } = await import("fs");
    const fileSrc = readFileSync(
      new URL("./Mist.jsx", import.meta.url).pathname,
      "utf8",
    );
    expect(fileSrc).toContain("dispose");
  });
});
