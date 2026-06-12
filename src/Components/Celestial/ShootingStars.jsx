/**
 * ShootingStars.jsx — Single rare meteor with dormancy between flights.
 *
 * VISUAL DESIGN:
 * ─────────────────────────────────────────────────────────────────────────────
 * One meteor crosses the frame every ~6–14 s (DORMANCY_MIN/MAX seconds of idle).
 * Page load starts DORMANT — the first meteor is a discovered moment, not an
 * opening act. During flight, 32 trail points compressed into 12% of the path
 * (TRAIL_SPAN) make sprites overlap into a continuous tapering streak rather than
 * the discrete dots that result from spreading points across the full flight path.
 *
 * DUAL-BUFFER DISCIPLINE (critical — read before modifying):
 * ─────────────────────────────────────────────────────────────────────────────
 * THREE.BufferAttribute stores its typed array BY REFERENCE, not by value.
 * When you pass a Float32Array to `new THREE.BufferAttribute(arr, 3)`, the
 * attribute's `.array` property IS that same array object.
 *
 * BUG CLASS (documented in project verified-facts):
 *   If useFrame reads from and writes to the SAME Float32Array that was passed
 *   to the BufferAttribute, you corrupt the base data on the first write.
 *   This is what made fireflies invisible on the live site: hdrScale=0 wrote
 *   zeros into the base color array, permanently zeroing the seed data.
 *
 * CORRECT PATTERN (enforced here):
 *   • `comet.base` — immutable scalar object from mulberry32, NEVER written after init.
 *   • `comet.renderPositions` Float32Array — the ONLY position array useFrame writes to.
 *   • `comet.alphas` Float32Array — the ONLY alpha array useFrame writes to.
 *   • Geometry BufferAttributes reference renderPositions and alphas.
 *   • On reset: comet.base = _initBase(rng). renderPositions/alphas must NOT be
 *     reassigned — doing so disconnects useFrame writes from the GPU buffer forever.
 *
 * STATE MACHINE (useFrame):
 *   DORMANT → [dormancyRemaining <= 0] → FLYING → [t >= 1.0] → DORMANT
 *   On dormancy exit: t=0, existing base seeds the new flight.
 *   On flight exit: zero alphas (needsUpdate), draw new dormancy + base from PRNG.
 *
 * PRNG:
 *   All randomness uses mulberry32; Math.random() is banned from this file.
 *   A single rng instance in stateRef advances deterministically on each flight reset.
 *
 * @module ShootingStars
 */

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COMETS, SPRITE } from "./constants";
import { createRadialGlowTexture } from "../../lib/three/textures";
import { mulberry32 } from "../../lib/three/prng";

// ---------------------------------------------------------------------------
// computeCometArc — PURE named export for unit testing.
//
// Allocates new output arrays; intended for tests and one-shot use only.
// Do NOT call inside useFrame — use _fillCometArc (pre-allocated) instead.
//
// TRAIL_SPAN semantics: frac = t - (i / trailLength) * trailSpan.
//   All trail points cluster within `trailSpan` fraction of the path behind the
//   head. Adjacent points are separated by exactly trailSpan/trailLength on the
//   flight path — guaranteed sprite overlap when trailSpan is small.
//
// @param {Object} base          - Immutable comet seed: startX/Y/Z, endX/Y/Z, arc
// @param {number} t             - Progress scalar [0, 1]
// @param {number} trailLength   - Number of trail points
// @param {number} [trailSpan]   - Path fraction the trail covers (default COMETS.TRAIL_SPAN)
// @returns {{ positions: Float32Array, alpha: Float32Array }}
// ---------------------------------------------------------------------------
export function computeCometArc(base, t, trailLength, trailSpan = COMETS.TRAIL_SPAN) {
  const positions = new Float32Array(trailLength * 3);
  const alpha = new Float32Array(trailLength);
  _fillCometArc(base, t, trailLength, trailSpan, positions, alpha);
  return { positions, alpha };
}

// ---------------------------------------------------------------------------
// _fillCometArc — internal hot-path version; writes to pre-allocated arrays.
// Zero heap allocations; all operations are scalar arithmetic.
// ---------------------------------------------------------------------------
function _lerp(a, b, f) {
  return a + (b - a) * f;
}

function _fillCometArc(base, t, trailLength, trailSpan, outPositions, outAlpha) {
  // Overall comet fade envelope: rises from 0 at birth (t=0), peaks at midpoint
  // (t=0.5), falls back to 0 at death (t=1.0). sin(t*π) = 0 at both endpoints.
  const cometFade = Math.sin(Math.min(t, 1.0) * Math.PI);

  for (let i = 0; i < trailLength; i++) {
    // TRAIL_SPAN compression: all trail points are packed into trailSpan fraction
    // of the path behind the head. Adjacent frac values differ by trailSpan/trailLength,
    // guaranteeing sprite overlap → continuous streak.
    const frac = t - (i / trailLength) * trailSpan;

    if (frac < 0) {
      // Trail point before the start of the path — hide at origin, no visible artifact.
      outAlpha[i] = 0;
      outPositions[i * 3]     = 0;
      outPositions[i * 3 + 1] = 0;
      outPositions[i * 3 + 2] = 0;
      continue;
    }

    // Arc position: linear travel from start to end, with lateral sine arc.
    // Math.sin(frac * Math.PI) peaks at frac=0.5 — creates a gentle curved trajectory.
    outPositions[i * 3]     = _lerp(base.startX, base.endX, frac) + Math.sin(frac * Math.PI) * base.arc;
    outPositions[i * 3 + 1] = _lerp(base.startY, base.endY, frac);
    outPositions[i * 3 + 2] = _lerp(base.startZ, base.endZ, frac);

    // Alpha taper: ^1.5 falloff gives a realistic sharp head → thin tail.
    // Multiplied by cometFade so the meteor fades in and out gracefully.
    outAlpha[i] = Math.pow(1 - i / trailLength, 1.5) * cometFade;
  }
}

// ---------------------------------------------------------------------------
// _initBase — generate only the immutable seed data from the PRNG.
//
// Returns a plain object of scalar values — zero Float32Array allocations.
// Called at initialization and on every comet reset in useFrame.
// Keeping base generation separate from buffer allocation means the reset
// path is alloc-free (no Float32Array created per reset).
// ---------------------------------------------------------------------------
function _initBase(rng) {
  const r = COMETS.SPAWN_RADIUS;
  // PRNG call count and order are FIXED — 7 calls total, same sequence every time.
  // Changing the count or order would invalidate the determinism tests and shift
  // the dormancy-first draw that makes the initial wait predictable.
  // z is clamped to [DEPTH_MIN, DEPTH_MAX] — far from camera (z=30) so
  // gl_PointSize attenuation stays flat; no close-pass ballooning.
  return {
    startX: (rng() - 0.5) * r,                                              // call 1
    startY: (rng() - 0.5) * r * 0.6,                                        // call 2
    startZ: COMETS.DEPTH_MIN + rng() * (COMETS.DEPTH_MAX - COMETS.DEPTH_MIN), // call 3
    endX:   (rng() - 0.5) * r,                                              // call 4
    endY:   (rng() - 0.5) * r * 0.6,                                        // call 5
    endZ:   COMETS.DEPTH_MIN + rng() * (COMETS.DEPTH_MAX - COMETS.DEPTH_MIN), // call 6
    arc:    (rng() - 0.5) * 2 * COMETS.ARC_CURVE,                           // call 7
  };
}

// ---------------------------------------------------------------------------
// ShaderMaterial GLSL — per-vertex alpha via custom attribute.
//
// Vertex shader: scales gl_PointSize by pow(alpha, 0.5) — gentler shrink so
// tail points stay visibly sized while the fragment layer handles linear fade.
// Using raw alpha for size caused double attenuation (shrink + fade) that killed
// the trail streak. Fragment keeps linear vAlpha for correct opacity taper.
// ---------------------------------------------------------------------------
const VERT = /* glsl */`
  uniform float size;
  attribute float alpha;
  varying float vAlpha;

  void main() {
    vAlpha = alpha;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    // pow(alpha, 0.5) = sqrt — gentler size shrink than linear alpha.
    // Fragment uses linear vAlpha for fade; separation prevents double-attenuation.
    gl_PointSize = size * pow(alpha, 0.5) * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const FRAG = /* glsl */`
  uniform vec3 color;
  uniform sampler2D map;
  uniform float alphaDiscard; // COMETS.ALPHA_DISCARD — single source of truth in constants.js
  varying float vAlpha;

  void main() {
    vec4 texColor = texture2D(map, gl_PointCoord);
    float a = texColor.a * vAlpha;
    if (a < alphaDiscard) discard;
    gl_FragColor = vec4(color, a);
  }
`;

// ---------------------------------------------------------------------------
// ShootingStars component
// ---------------------------------------------------------------------------
export default function ShootingStars() {
  // Glow sprite texture — disposed on unmount
  const glowTexture = useMemo(
    () => createRadialGlowTexture(SPRITE.SIZE, SPRITE.FALLOFF_EXP),
    [],
  );
  useEffect(() => {
    return () => glowTexture.dispose();
  }, [glowTexture]);

  // Shader material — created once for the meteor's lifetime.
  // HDR color (channels > 1.0, toneMapped=false) → passes LUMINANCE_THRESHOLD=1.0 → blooms.
  const material = useMemo(() => {
    const color = new THREE.Color(COMETS.COLOR).multiplyScalar(COMETS.HDR_MULT);
    return new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        size:         { value: COMETS.HEAD_SIZE },
        color:        { value: color },
        map:          { value: glowTexture },
        alphaDiscard: { value: COMETS.ALPHA_DISCARD },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
  }, [glowTexture]);

  useEffect(() => {
    return () => material.dispose();
  }, [material]);

  // ---------------------------------------------------------------------------
  // Lazy one-time initialization — PRNG + comet state stored in a ref so
  // animation state changes never trigger re-renders.
  //
  // PRNG sequence: draw dormancy → draw base → start DORMANT.
  // First meteor is a discovered moment: page load shows the calm star field.
  // ---------------------------------------------------------------------------
  const stateRef = useRef(null);
  if (stateRef.current === null) {
    const rng = mulberry32(COMETS.SEED);
    // Draw initial dormancy before the first flight
    const dormancyRemaining =
      COMETS.DORMANCY_MIN + rng() * (COMETS.DORMANCY_MAX - COMETS.DORMANCY_MIN);
    stateRef.current = {
      rng,
      comet: {
        // Immutable seed data — seeded and ready for the first flight.
        base: _initBase(rng),
        // Render buffers — allocated ONCE; live for the lifetime of this component.
        // MUST NOT be reassigned on reset: THREE.BufferAttribute holds these BY
        // REFERENCE; reassigning would disconnect useFrame writes from the GPU buffer,
        // freezing the meteor permanently (inverse of the aliasing bug class).
        renderPositions: new Float32Array(COMETS.TRAIL_LENGTH * 3),
        alphas: new Float32Array(COMETS.TRAIL_LENGTH),
        t: 0,
        isDormant: true,
        dormancyRemaining,
      },
    };
  }

  // Single geometry — Buffer attributes reference the live render arrays.
  // DUAL-BUFFER: renderPositions/alphas are the ONLY arrays useFrame writes to.
  const geometry = useMemo(() => {
    const { comet } = stateRef.current;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(comet.renderPositions, 3));
    geo.setAttribute("alpha",    new THREE.BufferAttribute(comet.alphas, 1));
    return geo;
  }, []); // stateRef.current is stable — no dependency needed

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  // ---------------------------------------------------------------------------
  // useFrame state machine — no heap allocations:
  //   DORMANT: count down dormancyRemaining; do NOT write buffers.
  //   FLYING:  advance t, write renderPositions + alphas via _fillCometArc.
  //   Reset:   zero alphas (one final needsUpdate), draw next dormancy + base.
  // ---------------------------------------------------------------------------
  useFrame((_, delta) => {
    const { comet, rng } = stateRef.current;

    if (comet.isDormant) {
      comet.dormancyRemaining -= delta;
      if (comet.dormancyRemaining <= 0) {
        // Dormancy expired — start the flight. base was seeded on last reset.
        comet.t = 0;
        comet.isDormant = false;
      }
      return; // Buffers are already zeroed from the previous reset.
    }

    // Advance flight progress
    comet.t += COMETS.SPEED * delta;

    if (comet.t >= 1.0) {
      // Flight complete: zero alphas so the meteor disappears immediately.
      comet.alphas.fill(0);
      geometry.attributes.alpha.needsUpdate = true;

      // Draw next dormancy + base — deterministic PRNG advance, no Math.random.
      // Replace ONLY base (scalar object); renderPositions/alphas must NOT be reassigned.
      // THREE.BufferAttribute holds the original arrays BY REFERENCE; reassigning would
      // disconnect useFrame writes from the GPU buffer, freezing the comet forever.
      comet.dormancyRemaining =
        COMETS.DORMANCY_MIN + rng() * (COMETS.DORMANCY_MAX - COMETS.DORMANCY_MIN);
      comet.base = _initBase(rng); // scalar object only — zero Float32Array alloc
      comet.isDormant = true;
      return;
    }

    // Normal flying frame — write render arrays from immutable base data.
    _fillCometArc(
      comet.base,
      comet.t,
      COMETS.TRAIL_LENGTH,
      COMETS.TRAIL_SPAN,
      comet.renderPositions,
      comet.alphas,
    );
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.alpha.needsUpdate    = true;
  });

  return <points geometry={geometry} material={material} />;
}
