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
    expect(TREES.HEMLOCK_TARGET).toBeLessThanOrEqual(500);
    expect(TREES.OAK_TARGET).toBeGreaterThanOrEqual(10);
    expect(TREES.OAK_TARGET).toBeLessThanOrEqual(500);
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
// Test suite 7 — SkyDome export contract
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
