import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { FIREFLIES, TERRAIN, PALETTE } from "./constants";
import { sampleHeight } from "./Terrain";
import { mulberry32 } from "./prng";

const { COUNT, GROUP_COUNT, FLASH_IN, FLASH_OUT, IDLE_MIN, IDLE_RANGE } = FIREFLIES;

// ---------------------------------------------------------------------------
// Fireflies — ~COUNT Points on ridge foreground, J-arc phase cycle.
//
// Color buffer fix: initialized with pre-computed `colors` array (not zeros).
// Without this, fireflies render black until the first useFrame tick (~16 ms),
// causing a visible flicker on the first frame. Position buffer uses the same
// pattern.
//
// useFrame loop optimization: opacity + color updates are merged into a single
// loop with one needsUpdate per attribute at the end, halving iteration count.
//
// Vector3/Color allocations: all arrays are pre-allocated (Float32Arrays from
// useMemo). No per-frame heap allocations occur in useFrame.
// ---------------------------------------------------------------------------
export default function Fireflies() {
  const pointsRef = useRef();

  const { positions, basePositions, colors, phaseOffsets, idleDurations } =
    useMemo(() => {
      const rand = mulberry32(FIREFLIES.SEED);

      const pos = new Float32Array(COUNT * 3);
      const base = new Float32Array(COUNT * 3);
      const col = new Float32Array(COUNT * 3);
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

        // Color: ~72% warm yellow, ~28% accent cyan — stored at full brightness.
        // The useFrame loop scales these by opacity to dim non-flashing particles.
        const leanYellow = rand() < FIREFLIES.YELLOW_THRESHOLD;
        if (leanYellow) {
          // #ffee44 → r=1.0, g=0.93, b=0.27
          col[i * 3] = 1.0;
          col[i * 3 + 1] = 0.93;
          col[i * 3 + 2] = 0.27;
        } else {
          // PALETTE.ACCENT (#00FFC2) → r=0.0, g=1.0, b=0.76
          col[i * 3] = 0.0;
          col[i * 3 + 1] = 1.0;
          col[i * 3 + 2] = 0.76;
        }

        const grp = Math.floor(rand() * GROUP_COUNT);
        phaseOff[i] = (grp / GROUP_COUNT) * (FLASH_IN + FLASH_OUT + IDLE_MIN + IDLE_RANGE * 0.5);
        idleDur[i] = IDLE_MIN + rand() * IDLE_RANGE;
      }

      return {
        positions: pos,
        basePositions: base,
        colors: col,
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

      // Encode brightness via color scaling (PointsMaterial has no per-particle opacity)
      const bi = i * 3;
      colArr[bi] = colors[bi] * opacity;
      colArr[bi + 1] = colors[bi + 1] * opacity;
      colArr[bi + 2] = colors[bi + 2] * opacity;
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
