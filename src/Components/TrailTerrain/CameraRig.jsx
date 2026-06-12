/**
 * CameraRig.jsx — Lissajous camera breath for the TrailTerrain art pass.
 *
 * ENGINEERING NOTES:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. lookAt re-assertion (CRITICAL):
 *    R3F calls camera.lookAt(0,0,0) only ONCE at camera creation and never
 *    again. Once camera.position drifts via useFrame, the framing diverges
 *    unless lookAt is re-asserted every frame. A pre-allocated THREE.Vector3
 *    (spread from CAMERA.LOOK_AT) is created in useMemo so there is no
 *    per-frame heap allocation.
 *
 * 2. Reduced-motion coverage:
 *    TrailTerrain returns null before mounting the Canvas when
 *    useReducedMotion() is true — this component never reaches useFrame in
 *    that case. No extra guard is needed here; the Canvas bail is the contract.
 *
 * 3. Irrational-ish ratios:
 *    BREATH_RATIOS ([1.31, 0.73]) and BREATH_PHASES ([1.7, 3.1]) ensure the
 *    Lissajous path never visibly repeats within a human-length session. The
 *    GCD period of these ratios relative to the base frequency (1/BREATH_PERIOD)
 *    is astronomically large — the path feels organic and non-repeating.
 *
 * @module CameraRig
 */

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CAMERA } from "./constants";

// ---------------------------------------------------------------------------
// CameraRig — renders null, pure useFrame side-effect component.
// Placed inside TrailScene outside <Suspense> (no async deps).
// ---------------------------------------------------------------------------
export default function CameraRig() {
  // Pre-allocate lookAt target — avoids per-frame Vector3 construction
  const lookAt = useMemo(() => new THREE.Vector3(...CAMERA.LOOK_AT), []);

  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();
    const w = (2 * Math.PI) / CAMERA.BREATH_PERIOD;
    const [R0, R1] = CAMERA.BREATH_RATIOS;
    const [P0, P1] = CAMERA.BREATH_PHASES;
    const A = CAMERA.BREATH_AMP;
    const [bx, by, bz] = CAMERA.POSITION;

    camera.position.set(
      bx + Math.sin(t * w) * A,
      by + Math.sin(t * w * R0 + P0) * A * 0.6,
      bz + Math.cos(t * w * R1 + P1) * A * 0.8,
    );

    // Re-assert lookAt every frame: R3F only calls camera.lookAt once at
    // creation — re-asserting every frame preserves gorge framing while
    // the position drifts through the Lissajous path.
    camera.lookAt(lookAt);
  });

  return null;
}
