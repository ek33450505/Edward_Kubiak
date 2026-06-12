/**
 * routeCurve.test.js
 *
 * Behavioral tests for the routeCurve singleton and the ROUTE constants.
 *
 * Runs in vitest node env — no jsdom, no WebGL context required.
 * THREE.CatmullRomCurve3 and THREE.Vector3 are pure JS — work fine in Node.
 *
 * Covers:
 *  - Returns a CatmullRomCurve3 instance
 *  - curve.closed === true
 *  - Singleton identity (two calls return the same object)
 *  - getPointAt(0.37): finite Vector3, y > 0
 *  - 14 input points (duplicate close-point removed)
 *  - getPoints(120) produces expected count
 *  - resetRouteCurve() clears the cache (fresh build on next call)
 */

import { describe, it, expect, beforeEach } from "vitest";
import * as THREE from "three";
import { getRouteCurve, resetRouteCurve } from "./routeCurve";

// ---------------------------------------------------------------------------
// Reset singleton before each test for full isolation
// ---------------------------------------------------------------------------
beforeEach(() => {
  resetRouteCurve();
});

// ---------------------------------------------------------------------------
// Suite 1 — Instance and shape contract
// ---------------------------------------------------------------------------
describe("routeCurve — instance contract", () => {
  it("returns a THREE.CatmullRomCurve3 instance", () => {
    const curve = getRouteCurve();
    expect(curve).toBeInstanceOf(THREE.CatmullRomCurve3);
  });

  it("curve.closed is true (closed=true passed to constructor)", () => {
    const curve = getRouteCurve();
    expect(curve.closed).toBe(true);
  });

  it("stores exactly 14 input points (duplicate close-point removed)", () => {
    const curve = getRouteCurve();
    // CatmullRomCurve3 stores the input array on .points
    expect(curve.points).toHaveLength(14);
  });
});

// ---------------------------------------------------------------------------
// Suite 2 — Singleton identity
// ---------------------------------------------------------------------------
describe("routeCurve — singleton identity", () => {
  it("two consecutive calls return the same object reference", () => {
    const a = getRouteCurve();
    const b = getRouteCurve();
    expect(a).toBe(b);
  });

  it("resetRouteCurve() causes next call to return a new object", () => {
    const a = getRouteCurve();
    resetRouteCurve();
    const b = getRouteCurve();
    expect(a).not.toBe(b);
  });
});

// ---------------------------------------------------------------------------
// Suite 3 — Geometric contract
// ---------------------------------------------------------------------------
describe("routeCurve — geometric contract", () => {
  it("getPointAt(0.37) returns a THREE.Vector3", () => {
    const pt = getRouteCurve().getPointAt(0.37);
    expect(pt).toBeInstanceOf(THREE.Vector3);
  });

  it("getPointAt(0.37) has all finite components", () => {
    const pt = getRouteCurve().getPointAt(0.37);
    expect(isFinite(pt.x)).toBe(true);
    expect(isFinite(pt.y)).toBe(true);
    expect(isFinite(pt.z)).toBe(true);
  });

  it("getPointAt(0.37) has y > 0 (route stays above world floor)", () => {
    const pt = getRouteCurve().getPointAt(0.37);
    expect(pt.y).toBeGreaterThan(0);
  });

  it("every input point has y > 0 (route never goes underground)", () => {
    // sampleHeight returns min 0.05 → min Y = 0.05*HEIGHT_SCALE + Y_OFFSET = 0.245.
    // Gorge-section points (abs Y: 0.28–0.35) are also > 0.
    const curve = getRouteCurve();
    for (const pt of curve.points) {
      expect(pt.y).toBeGreaterThan(0);
    }
  });

  it("getPoints(120) returns 121 Vector3 values (N+1 inclusive contract)", () => {
    const pts = getRouteCurve().getPoints(120);
    expect(pts).toHaveLength(121);
    expect(pts[0]).toBeInstanceOf(THREE.Vector3);
    expect(pts[120]).toBeInstanceOf(THREE.Vector3);
  });

  it("getPointAt(0) and getPointAt(1) return finite coordinates (curve is closed)", () => {
    const curve = getRouteCurve();
    const p0 = curve.getPointAt(0);
    const p1 = curve.getPointAt(1);
    expect(isFinite(p0.x) && isFinite(p0.y) && isFinite(p0.z)).toBe(true);
    expect(isFinite(p1.x) && isFinite(p1.y) && isFinite(p1.z)).toBe(true);
  });
});
