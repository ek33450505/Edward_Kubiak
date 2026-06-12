import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FIREFLIES, TERRAIN, PALETTE } from "./constants";
import { sampleHeight } from "./Terrain";
import { mulberry32 } from "./prng";
import { createRadialGlowTexture } from "./textures";

const { COUNT, GROUP_COUNT, FLASH_IN, FLASH_OUT, IDLE_MIN, IDLE_RANGE } = FIREFLIES;

// ---------------------------------------------------------------------------
// Fireflies — ~COUNT Points on ridge foreground, J-arc phase cycle.
//
// Color buffer aliasing fix: useMemo builds TWO arrays — `baseColors` (the
// immutable full-brightness source) and `colors` (a separate copy passed to
// the BufferAttribute). THREE.BufferAttribute stores its array BY REFERENCE, so
// colorAttr.array === colors. The useFrame loop reads from `baseColors` and
// writes scaled values into `colors`/colArr. Without the split, the idle phase
// (hdrScale=0) would permanently zero the base colors within one cycle,
// making all fireflies black forever. Position buffer uses the same two-array
// pattern (positions + basePositions).
//
// useFrame loop optimization: opacity + color updates are merged into a single
// loop with one needsUpdate per attribute at the end, halving iteration count.
//
// Vector3/Color allocations: all arrays are pre-allocated (Float32Arrays from
// useMemo). No per-frame heap allocations occur in useFrame.
//
// HDR selective-bloom contract (Unit 6):
//   toneMapped={false} lets the material output values > 1.0 in linear space.
//   The color scale factor `opacity * (1 + (HDR_PEAK-1)*opacity)` is quadratic:
//   - opacity=0.0  → scale=0.0  (off)
//   - opacity=0.5  → scale=0.85 (below Bloom luminanceThreshold=1.0)
//   - opacity=1.0  → scale=HDR_PEAK=2.4 (crosses bloom gate at J-arc peak)
//   This ensures only the brief near-peak flash crosses the bloom threshold;
//   the long idle period never blooms, preserving scene selectivity.
//   POINT_SIZE increased to 0.14 to compensate for the soft sprite reading
//   smaller than a hard GL point at the same nominal radius.
// ---------------------------------------------------------------------------
export default function Fireflies() {
  const pointsRef = useRef();

  // Glow sprite texture — radial alpha falloff so the particle reads as a soft
  // halo rather than a hard point. Disposed on unmount to free GPU memory.
  const glowTexture = useMemo(
    () => createRadialGlowTexture(FIREFLIES.SPRITE_SIZE, FIREFLIES.SPRITE_FALLOFF),
    [],
  );
  useEffect(() => {
    return () => {
      glowTexture.dispose();
    };
  }, [glowTexture]);

  const { positions, basePositions, colors, baseColors, phaseOffsets, idleDurations } =
    useMemo(() => {
      const rand = mulberry32(FIREFLIES.SEED);

      const pos = new Float32Array(COUNT * 3);
      const base = new Float32Array(COUNT * 3);
      const baseCol = new Float32Array(COUNT * 3);
      const phaseOff = new Float32Array(COUNT);
      const idleDur = new Float32Array(COUNT);

      for (let i = 0; i < COUNT; i++) {
        let x, z, h;
        let tries = 0;
        do {
          x = (rand() + FIREFLIES.X_CENTER) * FIREFLIES.X_SPREAD;
          z = rand() * FIREFLIES.Z_HALF * 2 - FIREFLIES.Z_HALF;
          h = sampleHeight(x / 10, z / 10);
          tries++;
        } while (h < FIREFLIES.H_MIN && tries < FIREFLIES.PLACE_TRIES);

        const y = h * TERRAIN.HEIGHT_SCALE + FIREFLIES.Y_SURFACE_OFFSET + rand() * FIREFLIES.Y_JITTER_RANGE;
        base[i * 3] = x;
        base[i * 3 + 1] = y;
        base[i * 3 + 2] = z;
        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;

        // Color: ~72% warm yellow, ~28% accent cyan — stored at full brightness
        // in baseCol. The attribute array (col, a separate copy) is written by
        // useFrame each tick; baseCol is never mutated after useMemo returns.
        const leanYellow = rand() < FIREFLIES.YELLOW_THRESHOLD;
        if (leanYellow) {
          // #ffee44 → r=1.0, g=0.93, b=0.27
          baseCol[i * 3] = 1.0;
          baseCol[i * 3 + 1] = 0.93;
          baseCol[i * 3 + 2] = 0.27;
        } else {
          // PALETTE.ACCENT (#00FFC2) → r=0.0, g=1.0, b=0.76
          baseCol[i * 3] = 0.0;
          baseCol[i * 3 + 1] = 1.0;
          baseCol[i * 3 + 2] = 0.76;
        }

        const grp = Math.floor(rand() * GROUP_COUNT);
        phaseOff[i] = (grp / GROUP_COUNT) * (FLASH_IN + FLASH_OUT + IDLE_MIN + IDLE_RANGE * 0.5);
        idleDur[i] = IDLE_MIN + rand() * IDLE_RANGE;
      }

      // col is a separate copy of baseCol — passed to the BufferAttribute.
      // Three.js stores the array by reference, so the useFrame loop can write
      // scaled values into col without ever corrupting baseCol.
      const col = baseCol.slice();

      return {
        positions: pos,
        basePositions: base,
        colors: col,
        baseColors: baseCol,
        phaseOffsets: phaseOff,
        idleDurations: idleDur,
      };
    }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    const posAttr = pointsRef.current.geometry.attributes.position;
    const colorAttr = pointsRef.current.geometry.attributes.color;
    const arr = posAttr.array;
    const colArr = colorAttr.array;

    // Single merged loop: position y-drift + color dimming together
    for (let i = 0; i < COUNT; i++) {
      const cycleDur = FLASH_IN + FLASH_OUT + idleDurations[i];
      const phase = ((t + phaseOffsets[i]) % cycleDur + cycleDur) % cycleDur;

      let opacity = 0;
      let yDrift = 0;

      if (phase < FLASH_IN) {
        // Flash in: 0 → 1
        opacity = phase / FLASH_IN;
        yDrift = opacity * FIREFLIES.Y_DRIFT_PEAK; // J-arc rise
      } else if (phase < FLASH_IN + FLASH_OUT) {
        // Flash out: 1 → 0
        const t2 = (phase - FLASH_IN) / FLASH_OUT;
        opacity = 1 - t2;
        yDrift = FIREFLIES.Y_DRIFT_PEAK - t2 * FIREFLIES.Y_DRIFT_SETTLE;
      }
      // else: idle phase — opacity=0, yDrift=0

      arr[i * 3 + 1] = basePositions[i * 3 + 1] + yDrift;

      // Encode brightness via color scaling (PointsMaterial has no per-particle opacity).
      // HDR quadratic: only near-peak flashes cross toneMapped=false Bloom gate.
      // At opacity=1.0 scale = HDR_PEAK (2.4); at opacity=0.5 scale = 0.85 (below gate).
      // Read from baseColors (immutable), write to colArr (the attribute array).
      const hdrScale = opacity * (1.0 + (FIREFLIES.HDR_PEAK - 1.0) * opacity);
      const bi = i * 3;
      colArr[bi] = baseColors[bi] * hdrScale;
      colArr[bi + 1] = baseColors[bi + 1] * hdrScale;
      colArr[bi + 2] = baseColors[bi + 2] * hdrScale;
    }

    // Single needsUpdate per attribute at end of loop
    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        {/* Both buffers initialized from pre-computed arrays to avoid first-frame flicker */}
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        map={glowTexture}
        toneMapped={false}
        vertexColors
        size={FIREFLIES.POINT_SIZE}
        sizeAttenuation
        transparent
        opacity={1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
