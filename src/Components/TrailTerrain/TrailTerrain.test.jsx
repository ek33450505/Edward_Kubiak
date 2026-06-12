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

  it("component source uses Canvas with dpr and alpha:true", async () => {
    const mod = await import("./TrailTerrain");
    const src = mod.default.toString();
    expect(src).toContain("dpr");
    expect(src).toContain("alpha: true");
  });
});

// ---------------------------------------------------------------------------
// Test suite 3 — index.js re-export
// ---------------------------------------------------------------------------
describe("TrailTerrain — index.js re-export", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.doMock("motion/react", () => ({ useReducedMotion: () => false }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("index.js default export is a function named TrailTerrain", async () => {
    const mod = await import("./index.js");
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
