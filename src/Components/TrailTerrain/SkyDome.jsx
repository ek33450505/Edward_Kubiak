/**
 * SkyDome.jsx — Full-sky dusk-gradient dome for TrailTerrain
 *
 * Architecture notes:
 *
 * BackSide + renderOrder={-1} + depthWrite:false:
 *   The camera lives inside the sphere. BackSide makes the interior surface
 *   visible. renderOrder=-1 draws the dome before all scene objects so depth
 *   testing never clips it. depthWrite:false prevents the dome from blocking
 *   any subsequent draw.
 *
 * fog:false:
 *   Scene fogExp2 would incorrectly tint the sky itself. The dome IS the
 *   background; fog should only affect geometry in front of it.
 *
 * frustumCulled={false}:
 *   The sphere wraps the camera, so its bounds always overlap the frustum.
 *   Leaving culling on would cause the dome to pop out when the camera
 *   translates to the sphere edge (camera breath in Unit 9).
 *
 * Star kill-switch contract:
 *   uStarDensity === 0.0 guarantees zero stars via two independent guards:
 *   (1) the explicit `uStarDensity > 0.0` branch check in GLSL, and
 *   (2) h > 1.0 is mathematically impossible for fract() values in [0, 1).
 *
 * GPU hash determinism:
 *   mulberry32 in prng.js covers JS-side randomness only. The GLSL hashFloat
 *   uses a sin-free fract-multiply hash — output is deterministic for a given
 *   GPU/driver but NOT guaranteed identical across GPU vendors (different
 *   float precision in fract). Acceptable for decorative stars.
 *
 * HDR / bloom contract:
 *   All output is clamped to [0,1]. This material must NEVER exceed 1.0 and
 *   must NEVER bloom. The site retired an astronomy theme — stars are a
 *   whisper, not a feature.
 *
 * Geometry and material disposal follows the house pattern (see Terrain.jsx):
 *   explicit useEffect cleanup because large ShaderMaterial objects warrant
 *   an explicit call rather than relying on r3f auto-dispose timing.
 */

import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { SKY, SCENE } from "./constants";

// ---------------------------------------------------------------------------
// GLSL sources — defined as module-level constants for readability and to
// keep the useMemo body focused on uniform setup.
// ---------------------------------------------------------------------------

const vertexShader = /* glsl */ `
  varying vec3 vWorldDir;

  void main() {
    // Sphere vertex position in model space = direction from center.
    // Normalizing gives the exact unit-direction vector we need in the
    // fragment shader without any matrix math.
    vWorldDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3  uHorizon;
  uniform vec3  uViolet;
  uniform vec3  uZenith;
  uniform float uGradY0;
  uniform float uGradY1;
  uniform float uGradY2;
  uniform vec2  uSunAzimuth;
  uniform float uSunGlowExp;
  uniform float uSunGlowStrength;
  uniform float uStarDensity;
  uniform float uStarIntensity;
  uniform float uStarMinY;
  uniform float uStarCellScale;

  varying vec3 vWorldDir;

  // -------------------------------------------------------------------------
  // GPU hash — sin-free fract-multiply variant.
  // Deterministic per GPU/driver; not cross-GPU identical (float precision
  // differs). Acceptable for decorative stars — see file header.
  // -------------------------------------------------------------------------
  float hashFloat(vec3 p) {
    p = fract(p * vec3(127.1, 311.7, 74.7));
    p += dot(p, p.zyx + 19.19);
    return fract((p.x + p.y) * p.z);
  }

  void main() {
    vec3  dir = vWorldDir;
    float y   = dir.y;

    // -----------------------------------------------------------------------
    // Dusk gradient: HORIZON → VIOLET → ZENITH via two smoothstep bands
    // -----------------------------------------------------------------------
    vec3 color = mix(uHorizon, uViolet, smoothstep(uGradY0, uGradY1, y));
    color      = mix(color,   uZenith, smoothstep(uGradY1, uGradY2, y));

    // -----------------------------------------------------------------------
    // Warm azimuthal sun-glow near the horizon (ember tint toward sun side).
    // horizonProximity falls to 0 beyond |y| = 0.3 — no glow at zenith.
    // Safe division: clamp xz length away from 0 to avoid NaN at poles.
    // NOTE: no saturate() in GLSL ES — use clamp(x, 0.0, 1.0) throughout.
    // -----------------------------------------------------------------------
    float horizonProximity = 1.0 - clamp(abs(y) / 0.3, 0.0, 1.0);
    float xzLen   = max(length(dir.xz), 0.001);
    float sunDot  = dot(dir.xz / xzLen, uSunAzimuth);
    float sunGlow = pow(clamp(sunDot, 0.0, 1.0), uSunGlowExp)
                    * uSunGlowStrength * horizonProximity;
    color += uHorizon * sunGlow;

    // -----------------------------------------------------------------------
    // Stars: cell-hash sparkle above STAR_MIN_Y.
    // Kill-switch: uStarDensity == 0.0 prevents entry via explicit guard AND
    // h > 1.0 is mathematically impossible (fract range is [0, 1)).
    // -----------------------------------------------------------------------
    if (dir.y > uStarMinY && uStarDensity > 0.0) {
      vec3  cellCoord = floor(normalize(dir) * uStarCellScale);
      float h         = hashFloat(cellCoord);
      if (h > 1.0 - uStarDensity) {
        float brightness = (h - (1.0 - uStarDensity)) / uStarDensity;
        color += vec3(brightness * uStarIntensity);
      }
    }

    // -----------------------------------------------------------------------
    // Hard cap at 1.0 — this material must NEVER exceed 1.0 and NEVER bloom.
    // -----------------------------------------------------------------------
    color = clamp(color, 0.0, 1.0);

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ---------------------------------------------------------------------------
// SkyDome component
// ---------------------------------------------------------------------------
export default function SkyDome() {
  const meshRef = useRef();

  // Sun azimuth: normalize the xz components of SCENE.SUN_POSITION.
  // Computed once (SCENE is a constant); passed to shader as uniform vec2.
  const sunAzimuth = useMemo(() => {
    const [sx, , sz] = SCENE.SUN_POSITION;
    const len = Math.sqrt(sx * sx + sz * sz) || 1;
    return new THREE.Vector2(sx / len, sz / len);
  }, []);

  const { geometry, material } = useMemo(() => {
    const geo = new THREE.SphereGeometry(SKY.RADIUS, 32, 16);

    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
      uniforms: {
        uHorizon:         { value: new THREE.Color(SKY.HORIZON) },
        uViolet:          { value: new THREE.Color(SKY.VIOLET) },
        uZenith:          { value: new THREE.Color(SKY.ZENITH) },
        uGradY0:          { value: SKY.GRAD_Y0 },
        uGradY1:          { value: SKY.GRAD_Y1 },
        uGradY2:          { value: SKY.GRAD_Y2 },
        uSunAzimuth:      { value: sunAzimuth },
        uSunGlowExp:      { value: SKY.SUN_GLOW_EXP },
        uSunGlowStrength: { value: SKY.SUN_GLOW_STRENGTH },
        uStarDensity:     { value: SKY.STAR_DENSITY },
        uStarIntensity:   { value: SKY.STAR_INTENSITY },
        uStarMinY:        { value: SKY.STAR_MIN_Y },
        uStarCellScale:   { value: SKY.STAR_CELL_SCALE },
      },
      vertexShader,
      fragmentShader,
    });

    return { geometry: geo, material: mat };
  }, [sunAzimuth]);

  // Explicit disposal on unmount (house pattern — see Terrain.jsx).
  // r3f auto-dispose covers children attached at unmount; large custom
  // ShaderMaterial uniforms (THREE.Color allocations) warrant explicit cleanup.
  useEffect(() => {
    return () => {
      geometry?.dispose();
      material?.dispose();
    };
  }, [geometry, material]);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      renderOrder={-1}
      frustumCulled={false}
    />
  );
}
