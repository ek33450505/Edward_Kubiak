/**
 * Headlamp.jsx — The narrative protagonist: a runner's headlamp at dusk.
 *
 * STORY CONTEXT:
 *   A Mohican 100 competitor tracing the race-route loop, glimpsed through the
 *   trees at the blue hour. The headlamp is the brightest moving element in the
 *   scene — the human heart of the gorge.
 *
 * COMPOSITION:
 *   <group> moved along getRouteCurve().getPointAt(t) every frame:
 *     1. <sprite>       — warm radial glow, toneMapped:false, HDR × 3.2 → blooms.
 *     2. <pointLight>   — lights terrain + trees with a warm moving pool; the lit
 *                         surfaces are tone-mapped → pool never blooms.
 *
 * HDR SELECTIVE-BLOOM CONTRACT:
 *   SpriteMaterial: warmHDR = Color(HEADLAMP.COLOR) × HEADLAMP.HDR_BOOST (3.2).
 *   With toneMapped={false} the sprite outputs ~3.2 in linear space — above the
 *   Bloom luminanceThreshold=1.0 gate (Unit 10). Only the sprite halo blooms.
 *   PointLight: illuminates LDR surfaces (terrain, trees — default ACESFilmic).
 *   The warm pool on terrain/trees stays below 1.0 → never crosses bloom gate.
 *   This asymmetry — lamp blooms, pool does not — makes the lamp read as a hot
 *   point source while the surrounding warmth stays soft and realistic.
 *
 * ROUTE INTEGRATION:
 *   ROUTE.OPACITY was dimmed to 0.55 in Unit 4 specifically so the headlamp
 *   reads as brighter/louder than the route line — protagonist contrast by design.
 *
 * SHADER RECOMPILE NOTE:
 *   Mounting this component adds one <pointLight>, raising NUM_POINT_LIGHTS by 1.
 *   Three.js recompiles all lit shader programs once at mount. Hidden inside the
 *   TrailScene Suspense boundary — the recompile completes before the scene first
 *   paints, so no dropped frame is visible.
 *   terrain's onBeforeCompile re-runs cleanly on recompile (plan-verified fact).
 *
 * PERFORMANCE:
 *   ZERO per-frame heap allocations. tmpVec is pre-allocated in useMemo so
 *   getPointAt(t, tmpVec) writes in-place. glowTex is created once in useMemo
 *   and disposed on unmount to free GPU memory.
 */

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HEADLAMP } from "./constants";
import { createRadialGlowTexture } from "./textures";
import { getRouteCurve } from "./routeCurve";

// ---------------------------------------------------------------------------
// Headlamp — runner's headlamp tracing the race-route loop once per LOOP_SECONDS
// ---------------------------------------------------------------------------
export default function Headlamp() {
  const groupRef = useRef();

  // Glow sprite texture — radial alpha falloff so the halo reads as a soft warm
  // disc rather than a hard point. Disposed on unmount to free GPU memory.
  // Same pattern as Fireflies.jsx: useMemo + useEffect dispose.
  const glowTex = useMemo(
    () => createRadialGlowTexture(HEADLAMP.SPRITE_TEX_SIZE, HEADLAMP.SPRITE_FALLOFF),
    [],
  );
  useEffect(() => {
    return () => {
      glowTex.dispose();
    };
  }, [glowTex]);

  // Warm HDR color: Color × HDR_BOOST = 3.2 → linear value > 1.0.
  // With toneMapped={false} on SpriteMaterial this crosses the Bloom
  // luminanceThreshold=1.0 gate — only the sprite halo blooms.
  const warmHDR = useMemo(
    () => new THREE.Color(HEADLAMP.COLOR).multiplyScalar(HEADLAMP.HDR_BOOST),
    [],
  );

  // Pre-allocated Vector3 reused by getPointAt() every frame.
  // getPointAt accepts an optional target Vector3 and writes in-place —
  // zero per-frame heap allocations in the useFrame hot path.
  const tmpVec = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const elapsed = clock.getElapsedTime();

    // Normalized position [0, 1) along the route curve, looping every LOOP_SECONDS.
    const t = (elapsed / HEADLAMP.LOOP_SECONDS) % 1;

    // Write curve position into pre-allocated tmpVec (in-place, no allocation).
    getRouteCurve().getPointAt(t, tmpVec);

    // Y_OFFSET lifts the lamp to runner's head height above the trail surface.
    // Sinusoidal bob (BOB_HZ ≈ 1.6 Hz ≈ running cadence) animates the gait.
    groupRef.current.position.set(
      tmpVec.x,
      tmpVec.y +
        HEADLAMP.Y_OFFSET +
        Math.sin(elapsed * HEADLAMP.BOB_HZ * 2 * Math.PI) * HEADLAMP.BOB_AMP,
      tmpVec.z,
    );
  });

  return (
    <group ref={groupRef}>
      {/* Glow sprite — warm HDR halo that blooms in EffectComposer (Unit 10).
          AdditiveBlending: adds color to whatever is behind, brightening the scene
          at the lamp position rather than occludes it. depthWrite:false avoids
          z-fighting with the terrain/route it hovers above. */}
      <sprite scale={[HEADLAMP.SPRITE_SCALE, HEADLAMP.SPRITE_SCALE, 1]}>
        <spriteMaterial
          map={glowTex}
          color={warmHDR}
          toneMapped={false}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      {/* Moving warm light pool — illuminates terrain + trees as runner passes.
          LIGHT_DISTANCE=2.5 caps influence radius so distant geometry is unaffected.
          LIGHT_DECAY=2 is physically-based (inverse-square falloff).
          These surfaces use default tone mapping → output stays LDR → never blooms. */}
      <pointLight
        color={HEADLAMP.LIGHT_COLOR}
        intensity={HEADLAMP.LIGHT_INTENSITY}
        distance={HEADLAMP.LIGHT_DISTANCE}
        decay={HEADLAMP.LIGHT_DECAY}
      />
    </group>
  );
}
