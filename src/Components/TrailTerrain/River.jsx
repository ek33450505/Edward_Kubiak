/**
 * River.jsx — last-light shimmer river ribbon for TrailTerrain.
 *
 * Exports:
 *   injectRiverShader(shader) — pure onBeforeCompile injector (node-testable)
 *   default: River            — R3F mesh component
 *
 * SHADER INJECTION — injectRiverShader:
 *
 *   Adds traveling "last light" glints via two co-prime sine-band pulses on
 *   vUv.x (tube length UV). Glints are HDR (GLINT_INTENSITY ~2.6×) so they
 *   cross the Bloom luminanceThreshold=1.0 gate; base river stays <1.0.
 *
 * vUv availability:
 *   meshStandardMaterial with no texture maps strips the vUv varying (guarded
 *   by USE_UV). We force it via defines={{ USE_UV: '' }}.
 *   Verified: TubeGeometry uv.x runs along tube length → bands travel the river.
 *
 * toneMapped={false}:
 *   Material outputs linear HDR; ACESFilmic is bypassed, so outgoingLight +
 *   glint can exceed 1.0 for selective bloom (Unit 10).
 *
 * customProgramCacheKey:
 *   Set to a stable string literal to prevent program-cache collisions.
 *   In practice there are no other meshStandardMaterial instances in the scene
 *   (Trees and Terrain are Lambert; Mist uses Basic), so a collision cannot
 *   happen today. The explicit key makes future scene additions safe and
 *   documents the onBeforeCompile intent. An inline arrow without this key
 *   would also be stable (its source text is constant across renders), but
 *   the explicit key is the documented safe pattern.
 *
 * HDR contract:
 *   base: SKY (#38bdf8, max linear channel ~0.97) × emissiveIntensity (0.35)
 *         + ambient/specular → well under 1.0 → never blooms.
 *   glint peak: base + GLINT_INTENSITY (2.6) → crosses threshold → sparkles bloom.
 *
 * DEAD CODE REMOVAL (Unit 5):
 *   The previous useFrame scrolled material.map.offset. meshStandardMaterial
 *   with no texture has no .map — the mutation was always a no-op.
 *   RIVER.SCROLL_SPEED is also removed from constants.js.
 *   Replacement: onBeforeCompile glint shader + uTime useFrame below.
 *
 * DISPOSAL:
 *   TubeGeometry is created in useMemo([]) — created once, never re-created.
 *   The useEffect cleanup disposes it on unmount (belt-and-suspenders for large
 *   geometry objects on Suspense-wrapped unmounts).
 */

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RIVER, TERRAIN, PALETTE } from "./constants";

// ---------------------------------------------------------------------------
// injectRiverShader — pure onBeforeCompile injector.
// Operates on shader stub: { vertexShader: string, fragmentShader: string, uniforms: {} }
// Module-level named export → stable toString() → unique THREE.js program cache key.
// Single-call contract: THREE.js program cache prevents double-invocation.
// ---------------------------------------------------------------------------
export function injectRiverShader(shader) {
  // ---- Uniforms ----
  Object.assign(shader.uniforms, {
    uTime:           { value: 0 },
    uGlintColor:     { value: new THREE.Color(RIVER.GLINT_COLOR) },
    uGlintIntensity: { value: RIVER.GLINT_INTENSITY },
    uGlintSharpness: { value: RIVER.GLINT_SHARPNESS },
    uGlintFreqA:     { value: RIVER.GLINT_FREQ_A },
    uGlintFreqB:     { value: RIVER.GLINT_FREQ_B },
    uGlintSpeedA:    { value: RIVER.GLINT_SPEED_A },
    uGlintSpeedB:    { value: RIVER.GLINT_SPEED_B },
  });

  // ---- Fragment shader ----
  // Prepend uniform declarations, then prepend glint block before opaque_fragment.
  // outgoingLight is MeshStandardMaterial's light accumulator — available at
  // the #include <opaque_fragment> injection point.
  //
  // pow() safety: base is 0.5+0.5*sin(...) → always in [0,1] → pow(x,y) is safe.
  // Two bands with co-prime frequencies → no harmonic sync → organic shimmer.
  const fragDecls = [
    "uniform float uTime;",
    "uniform vec3  uGlintColor;",
    "uniform float uGlintIntensity;",
    "uniform float uGlintSharpness;",
    "uniform float uGlintFreqA;",
    "uniform float uGlintFreqB;",
    "uniform float uGlintSpeedA;",
    "uniform float uGlintSpeedB;",
  ].join("\n");

  // Glint block: prepend before #include <opaque_fragment> (same pattern as
  // terrain rim light in injectTerrainShader). Include is preserved so the
  // standard gl_FragColor assignment runs as usual after the glint addition.
  //
  // Normalization: each band ranges [0,1], sum ranges [0,2]. Multiplying by
  // 0.5 normalizes to [0,1] so peak == uGlintIntensity exactly (2.6×).
  // Without this, simultaneous band peaks would reach 2×2.6 = 5.2× — 2× hotter
  // than the documented HDR contract and bloom design intent.
  const glintBlock = [
    "  // --- river last-light glints (HDR — crosses bloom luminanceThreshold=1.0) ---",
    "  float ekBandA = pow(0.5 + 0.5 * sin((vUv.x * uGlintFreqA - uTime * uGlintSpeedA) * 6.28318), uGlintSharpness);",
    "  float ekBandB = pow(0.5 + 0.5 * sin((vUv.x * uGlintFreqB - uTime * uGlintSpeedB) * 6.28318), uGlintSharpness);",
    "  float ekGlint = (ekBandA + ekBandB) * 0.5;",
    "  outgoingLight += uGlintColor * ekGlint * uGlintIntensity;",
    "#include <opaque_fragment>",
  ].join("\n");

  shader.fragmentShader = (fragDecls + "\n" + shader.fragmentShader)
    .replace("#include <opaque_fragment>", glintBlock);
}

// ---------------------------------------------------------------------------
// River — R3F component
// ---------------------------------------------------------------------------
export default function River() {
  // shaderRef holds the compiled shader object for uTime mutation in useFrame.
  const shaderRef = useRef(null);

  const curve = useMemo(() => {
    const points = [];
    const halfSize = TERRAIN.SIZE / 2;
    for (let i = 0; i <= RIVER.WAYPOINTS; i++) {
      const t = (i / RIVER.WAYPOINTS) * 2 - 1;
      const z = t * (halfSize - 0.5);
      const xOffset = Math.sin(t * Math.PI * RIVER.MEANDER_FREQ) * RIVER.MEANDER_AMP;
      const x = 0.1 * halfSize + xOffset; // gorge center (normalized 0.1) × half-size
      points.push(new THREE.Vector3(x, RIVER.Y_OFFSET, z));
    }
    return new THREE.CatmullRomCurve3(points);
  }, []);

  const geometry = useMemo(() => {
    return new THREE.TubeGeometry(
      curve,
      RIVER.TUBE_SEGMENTS,
      RIVER.TUBE_RADIUS,
      RIVER.TUBE_RADIAL_SEGMENTS,
      false
    );
  }, [curve]);

  // Dispose TubeGeometry on unmount (see file header disposal note).
  useEffect(() => {
    return () => {
      geometry?.dispose();
    };
  }, [geometry]);

  // Advance uTime each frame so the glint bands travel the river.
  useFrame((_, delta) => {
    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh geometry={geometry}>
      {/*
       * defines={{ USE_UV: '' }}: forces THREE.js to compile vUv into the
       * standard shader, which it otherwise strips when no maps are present.
       * toneMapped={false}: outputs linear HDR so glints can exceed 1.0.
       * customProgramCacheKey: stable string avoids cache collisions (see
       * file header for full rationale — no other standard materials in scene).
       * onBeforeCompile: injectRiverShader is a module-level named function
       * → stable toString() → unique program cache key even without explicit key.
       * The customProgramCacheKey is belt-and-suspenders for future safety.
       */}
      <meshStandardMaterial
        color={PALETTE.SKY}
        emissive={PALETTE.SKY}
        emissiveIntensity={RIVER.EMISSIVE_INTENSITY}
        transparent
        opacity={RIVER.OPACITY}
        roughness={0.1}
        metalness={0.2}
        defines={{ USE_UV: "" }}
        toneMapped={false}
        onBeforeCompile={(s) => {
          injectRiverShader(s);
          shaderRef.current = s;
        }}
        customProgramCacheKey={() => "ek-river-glint-v1"}
      />
    </mesh>
  );
}
