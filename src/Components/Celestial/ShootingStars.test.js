/**
 * ShootingStars.test.js — pure-logic tests for computeCometArc and TRAIL_SPAN semantics.
 *
 * Tests run in vitest node environment — no R3F, no Three.js rendering,
 * no WebGL context required. Only the pure computeCometArc named export
 * and PRNG sequence are tested here; the React component is visual-QA'd in
 * the browser.
 *
 * TRAIL_SPAN semantics:
 *   frac = t - (i / trailLength) * trailSpan
 *   Adjacent points differ by exactly trailSpan/trailLength on the flight path.
 *   With TRAIL_SPAN=0.12 and TRAIL_LENGTH=32, that's 0.00375 — guaranteed overlap.
 *
 * DUAL-BUFFER CONTRACT:
 *   computeCometArc allocates and returns new arrays. The `base` argument must
 *   remain unmodified after the call — verified by snapshot comparison.
 *
 * DETERMINISM CONTRACT:
 *   Same inputs → same outputs. No Math.random allowed.
 */

import { test, expect } from "vitest";
import { computeCometArc } from "./ShootingStars";
import { mulberry32 } from "../../lib/three/prng";
import { COMETS } from "./constants";

// ---------------------------------------------------------------------------
// Determinism — same inputs, same output including with trailSpan param
// ---------------------------------------------------------------------------

test("computeCometArc is deterministic — same inputs same output", () => {
  const prng = mulberry32(0xdeadbeef);
  const base = {
    startX: prng(), endX: prng(),
    startY: prng(), endY: prng(),
    startZ: prng(), endZ: prng(),
    arc: prng(),
  };
  const r1 = computeCometArc(base, 0.5, COMETS.TRAIL_LENGTH, COMETS.TRAIL_SPAN);
  const r2 = computeCometArc(base, 0.5, COMETS.TRAIL_LENGTH, COMETS.TRAIL_SPAN);
  expect(Array.from(r1.positions)).toEqual(Array.from(r2.positions));
  expect(Array.from(r1.alpha)).toEqual(Array.from(r2.alpha));
});

// ---------------------------------------------------------------------------
// Same seed → identical first-flight base + dormancy draw (PRNG sequence)
// ---------------------------------------------------------------------------

test("same seed produces identical first dormancy draw and first base (PRNG sequence)", () => {
  // Simulate the init sequence: dormancy draw → base draw
  const rng1 = mulberry32(COMETS.SEED);
  const dormancy1 = COMETS.DORMANCY_MIN + rng1() * (COMETS.DORMANCY_MAX - COMETS.DORMANCY_MIN);
  const startX1 = (rng1() - 0.5) * COMETS.SPAWN_RADIUS; // first value of _initBase

  const rng2 = mulberry32(COMETS.SEED);
  const dormancy2 = COMETS.DORMANCY_MIN + rng2() * (COMETS.DORMANCY_MAX - COMETS.DORMANCY_MIN);
  const startX2 = (rng2() - 0.5) * COMETS.SPAWN_RADIUS;

  expect(dormancy1).toBe(dormancy2);
  expect(startX1).toBe(startX2);
});

// ---------------------------------------------------------------------------
// Dormancy draw is within [DORMANCY_MIN, DORMANCY_MAX)
// ---------------------------------------------------------------------------

test("dormancy draw is within [DORMANCY_MIN, DORMANCY_MAX)", () => {
  const rng = mulberry32(COMETS.SEED);
  for (let i = 0; i < 20; i++) {
    const dormancy = COMETS.DORMANCY_MIN + rng() * (COMETS.DORMANCY_MAX - COMETS.DORMANCY_MIN);
    expect(dormancy).toBeGreaterThanOrEqual(COMETS.DORMANCY_MIN);
    expect(dormancy).toBeLessThan(COMETS.DORMANCY_MAX);
  }
});

// ---------------------------------------------------------------------------
// Head alpha > 0 when comet is in flight (t=0.5, i=0)
// ---------------------------------------------------------------------------

test("computeCometArc head alpha is > 0 when t > 0", () => {
  const base = { startX: 0, endX: 10, startY: 0, endY: 0, startZ: 0, endZ: 0, arc: 1 };
  // With TRAIL_SPAN=0.12, frac[0] = t = 0.5 > 0; cometFade = sin(0.5π) = 1.0
  const { alpha } = computeCometArc(base, 0.5, COMETS.TRAIL_LENGTH, COMETS.TRAIL_SPAN);
  expect(alpha[0]).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// Tail alpha = 0 — at t=0.05 the last point has frac < 0 (not yet reached)
// (TRAIL_SPAN semantics: tail can be visible mid-flight, but not at small t)
// ---------------------------------------------------------------------------

test("computeCometArc tail alpha is 0 at small t (tail not yet reached)", () => {
  // t=0.05, i=TRAIL_LENGTH-1: frac = 0.05 - (31/32)*0.12 = 0.05 - 0.11625 = -0.066 < 0
  const base = { startX: 0, endX: 10, startY: 0, endY: 0, startZ: 0, endZ: 0, arc: 1 };
  const { alpha } = computeCometArc(base, 0.05, COMETS.TRAIL_LENGTH, COMETS.TRAIL_SPAN);
  expect(alpha[COMETS.TRAIL_LENGTH - 1]).toBe(0);
});

// ---------------------------------------------------------------------------
// Adjacent trail points have frac spacing exactly TRAIL_SPAN/TRAIL_LENGTH
// This is the overlap guarantee — sprites must overlap to form a solid streak.
// ---------------------------------------------------------------------------

test("adjacent trail points are separated by TRAIL_SPAN/TRAIL_LENGTH on path (overlap guarantee)", () => {
  // Use base with endX=1, startX=0, arc=0 so x position = frac exactly
  const base = { startX: 0, endX: 1, startY: 0, endY: 0, startZ: 0, endZ: 0, arc: 0 };
  const trailLength = COMETS.TRAIL_LENGTH;
  const trailSpan   = COMETS.TRAIL_SPAN;
  const expectedSpacing = trailSpan / trailLength; // 0.12/32 = 0.00375

  // t=0.5: all points visible (min frac = 0.5 - 1.0*0.12 = 0.38 > 0)
  const { positions } = computeCometArc(base, 0.5, trailLength, trailSpan);

  // For startX=0, endX=1, arc=0: positions[i*3] = lerp(0, 1, frac[i]) = frac[i]
  for (let i = 0; i < trailLength - 1; i++) {
    const xi   = positions[i * 3];
    const xi1  = positions[(i + 1) * 3];
    // Float32Array has ~7 significant digits; tolerance at 6 decimal places is safe
    expect(xi - xi1).toBeCloseTo(expectedSpacing, 6);
  }
});

// ---------------------------------------------------------------------------
// base object is not mutated (dual-buffer contract)
// ---------------------------------------------------------------------------

test("computeCometArc does not mutate the base argument", () => {
  const base = { startX: 1, endX: 2, startY: 3, endY: 4, startZ: 5, endZ: 6, arc: 0.5 };
  const snapshot = { ...base };
  computeCometArc(base, 0.7, COMETS.TRAIL_LENGTH, COMETS.TRAIL_SPAN);
  expect(base).toEqual(snapshot);
});

// ---------------------------------------------------------------------------
// Returns arrays of correct length
// ---------------------------------------------------------------------------

test("computeCometArc returns arrays of correct length", () => {
  const base = { startX: 0, endX: 1, startY: 0, endY: 0, startZ: 0, endZ: 0, arc: 0 };
  const { positions, alpha } = computeCometArc(base, 0.3, COMETS.TRAIL_LENGTH, COMETS.TRAIL_SPAN);
  expect(positions.length).toBe(COMETS.TRAIL_LENGTH * 3);
  expect(alpha.length).toBe(COMETS.TRAIL_LENGTH);
});

// ---------------------------------------------------------------------------
// t=0 → all alpha zero (comet just spawned; cometFade = sin(0) = 0)
// ---------------------------------------------------------------------------

test("computeCometArc all alpha is 0 when t=0", () => {
  const base = { startX: 0, endX: 10, startY: 0, endY: 0, startZ: 0, endZ: 0, arc: 1 };
  const { alpha } = computeCometArc(base, 0, COMETS.TRAIL_LENGTH, COMETS.TRAIL_SPAN);
  // At t=0: cometFade=sin(0)=0, so alpha[0] = 0; frac<0 for i>0 so alpha[i]=0 too
  for (let i = 0; i < COMETS.TRAIL_LENGTH; i++) {
    expect(alpha[i]).toBe(0);
  }
});
