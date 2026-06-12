/**
 * RouteLine.jsx — animated dashed race route line for TrailTerrain.
 *
 * Curve source: getRouteCurve() singleton from routeCurve.js.
 * Shared with Headlamp (Unit 8) — no redundant waypoint computation.
 *
 * HDR contract:
 *   accentBoosted = PALETTE.ACCENT × ROUTE.HDR_BOOST (1.35×).
 *   With toneMapped={false} and ACCENT "#00FFC2" (max linear channel ≈ 1.0),
 *   the boosted color exceeds 1.0 → crosses Bloom luminanceThreshold=1.0 gate.
 *   opacity dimmed to ROUTE.OPACITY (0.55): protagonist-contrast for the
 *   headlamp (Unit 8), which must read as visibly brighter.
 *
 * dashOffset animation:
 *   drei's Line uses LineDashedMaterial internally. Mutating mat.dashOffset in
 *   useFrame is the accepted pattern (ref mutation, no re-render). needsUpdate
 *   intentionally omitted — dashOffset is a LineMaterial uniform, not a
 *   geometry attribute. Verified: drei 10.7.7 three-stdlib LineMaterial.
 *
 * drei Line prop pass-through:
 *   transparent, opacity, toneMapped all pass through via LineMaterial rest-spread.
 *   Verified: drei 10.7.7.
 */

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { PALETTE, ROUTE } from "./constants";
import { getRouteCurve } from "./routeCurve";

// ---------------------------------------------------------------------------
// RaceRoute — animated dashed line along the CatmullRomCurve3 route loop.
// ---------------------------------------------------------------------------
export default function RaceRoute() {
  const lineRef = useRef();
  const dashOffset = useRef(0);

  // HDR-boosted accent: ACCENT × HDR_BOOST > 1.0 → selectively bloomed (Unit 10).
  // Memoized so the Color object is stable across renders.
  const accentBoosted = useMemo(
    () => new THREE.Color(PALETTE.ACCENT).multiplyScalar(ROUTE.HDR_BOOST),
    []
  );

  // getPoints() from the shared singleton — no curve rebuild on re-render.
  const curvePoints = useMemo(
    () => getRouteCurve().getPoints(ROUTE.CURVE_SAMPLES),
    []
  );

  useFrame((_, delta) => {
    dashOffset.current += delta * ROUTE.DASH_SPEED;
    if (lineRef.current && lineRef.current.material) {
      const mat = lineRef.current.material;
      if (mat.dashOffset !== undefined) {
        mat.dashOffset = -dashOffset.current;
        // needsUpdate intentionally omitted — dashOffset is a uniform
      }
    }
  });

  return (
    <Line
      ref={lineRef}
      points={curvePoints}
      color={accentBoosted}
      lineWidth={ROUTE.LINE_WIDTH}
      dashed
      dashSize={ROUTE.DASH_SIZE}
      gapSize={ROUTE.GAP_SIZE}
      dashOffset={0}
      transparent
      opacity={ROUTE.OPACITY}
      toneMapped={false}
    />
  );
}
