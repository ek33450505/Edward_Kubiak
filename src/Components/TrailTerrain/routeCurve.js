/**
 * routeCurve.js — singleton CatmullRomCurve3 for the race route loop.
 *
 * Exports:
 *   getRouteCurve()    — lazily-memoized singleton (shared by RouteLine + Headlamp)
 *   resetRouteCurve()  — clears the cache (testing only — never call in production)
 *
 * SINGLETON CONTRACT:
 *   getRouteCurve() builds the curve on first call and caches it in the
 *   module-level `cached` variable. Subsequent calls return the same object.
 *   RouteLine and Headlamp (Unit 8) share one instance — no redundant math.
 *
 * DUPLICATE-POINT DECISION:
 *   The original RouteLine.jsx defined 15 points where point[14] duplicated
 *   point[0] ("close the loop"). With closed=true, CatmullRomCurve3 handles
 *   closure implicitly — the duplicate node creates a zero-length segment at
 *   the junction, producing a kink/tangent discontinuity in the spline.
 *   Decision: use 14 unique waypoints + closed=true. Visual path is identical
 *   (same geography, same tangents everywhere except the close-point, which
 *   is now smooth instead of kinked).
 *
 * Y_OFFSET (= ROUTE.Y_OFFSET = 0.12):
 *   All sampleHeight-based waypoints add ROUTE.Y_OFFSET above the terrain
 *   surface to keep the route line hovering above the mesh.
 *   Points 5-8 (gorge/river section) use absolute world-Y — they do not
 *   call sampleHeight and therefore do not add Y_OFFSET (same as original).
 */

import * as THREE from "three";
import { TERRAIN, ROUTE } from "./constants";
import { sampleHeight } from "./Terrain";

// Module-level singleton cache.
let cached = null;

/**
 * Returns the lazily-memoized CatmullRomCurve3 race route.
 * Pure JS — safe to call outside a React render.
 *
 * @returns {THREE.CatmullRomCurve3}
 */
export function getRouteCurve() {
  if (!cached) {
    const hs = TERRAIN.HEIGHT_SCALE;
    const yo = ROUTE.Y_OFFSET;

    // ---------------------------------------------------------------------------
    // 14 unique waypoints (14 not 15 — duplicate removed, see file header).
    // Section comments match the original RouteLine.jsx narrative.
    // ---------------------------------------------------------------------------
    const points = [
      // South ridge traverse
      new THREE.Vector3(-8, sampleHeight(-0.8, -0.7) * hs + yo, -7),
      new THREE.Vector3(-5, sampleHeight(-0.5, -0.5) * hs + yo, -5),
      new THREE.Vector3(-2, sampleHeight(-0.2, -0.3) * hs + yo, -4),
      new THREE.Vector3(0.5, sampleHeight(0.05, -0.1) * hs + yo, -1.5),
      // Gorge descent + river leg — absolute world Y (gorge floor stays low)
      // No sampleHeight, no Y_OFFSET: these points are already at river level.
      new THREE.Vector3(1.0, 0.35, 0),
      new THREE.Vector3(1.0, 0.3, 2),
      new THREE.Vector3(1.2, 0.28, 4),
      new THREE.Vector3(0.8, 0.3, 6),
      // North ridge climb
      new THREE.Vector3(-0.5, sampleHeight(-0.05, 0.75) * hs + yo, 7.5),
      new THREE.Vector3(-3, sampleHeight(-0.3, 0.85) * hs + yo, 8.5),
      // Lake / east ridge traverse
      new THREE.Vector3(5, sampleHeight(0.5, 0.7) * hs + yo, 7),
      new THREE.Vector3(8, sampleHeight(0.8, 0.3) * hs + yo, 3),
      new THREE.Vector3(7, sampleHeight(0.7, -0.3) * hs + yo, -3),
      new THREE.Vector3(4, sampleHeight(0.4, -0.7) * hs + yo, -7),
      // Closure handled by CatmullRomCurve3(points, true) — no duplicate needed.
    ];

    cached = new THREE.CatmullRomCurve3(points, true);
  }
  return cached;
}

/**
 * Resets the singleton cache. For testing only.
 * Calling this in production would force a full curve rebuild on next access.
 */
export function resetRouteCurve() {
  cached = null;
}
