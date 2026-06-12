/**
 * NebulaLayer.jsx — 5 point-cloud nebula layers with mouse parallax.
 *
 * ARCHITECTURE:
 * ─────────────────────────────────────────────────────────────────────────────
 * Each of the 5 NEBULA layers is rendered as two <points> primitives:
 *   • Base cloud   — standard toneMapped particles at moderate opacity.
 *   • HDR sub-cloud — top HDR_FRACTION of particles, toneMapped={false}, color
 *                     channels scaled by hdrMult (> 1.0) so they pass the
 *                     LUMINANCE_THRESHOLD=1.0 bloom gate and glow.
 *
 * Positions are seeded via mulberry32 in useMemo and NEVER mutated after init.
 * useFrame only mutates the group's rotation (two float properties), which
 * is not a BufferAttribute — no dual-buffer pattern needed here.
 *
 * PARALLAX:
 *   useFrame reads state.pointer ({x, y} in [-1,1] per R3F convention) and
 *   lerps the outer group rotation toward pointer * PARALLAX.STRENGTH.
 *   No manual DOM event listener is registered.
 *
 * DISPOSAL:
 *   All THREE.BufferGeometry and THREE.DataTexture objects created in useMemo
 *   are disposed in the useEffect cleanup.
 *
 * @module NebulaLayer
 */

import { useMemo, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { NEBULA, HDR_FRACTION, PARALLAX, COMETS, SPRITE } from "./constants";
import { createRadialGlowTexture } from "../../lib/three/textures";
import { mulberry32 } from "../../lib/three/prng";

export default function NebulaLayer() {
  const groupRef = useRef();

  // Pre-compute all geometry data and textures once — never modified after init.
  const { layers, glowTexture } = useMemo(() => {
    const tex = createRadialGlowTexture(SPRITE.SIZE, SPRITE.FALLOFF_EXP);

    const layerData = NEBULA.map(({ color, count, z, hdrMult }, idx) => {
      // Each layer gets its own deterministic PRNG stream.
      // 10007 is prime; prime stride avoids seed-stream overlap between layers
      // (adjacent seeds from the same mulberry32 seed are not statistically independent).
      const rng = mulberry32(COMETS.SEED + idx * 10007);

      const hdrCount = Math.ceil(count * HDR_FRACTION);
      const baseCount = count - hdrCount;

      const basePosArr = new Float32Array(baseCount * 3);
      const hdrPosArr = new Float32Array(hdrCount * 3);

      // Generate all positions, distributing first baseCount to base cloud
      // and remaining hdrCount to HDR sub-cloud.
      for (let i = 0; i < count; i++) {
        const x = (rng() - 0.5) * 110;          // wide horizontal scatter
        const y = (rng() - 0.5) * 80;           // vertical scatter
        const zPos = z + (rng() - 0.5) * 15;    // slight depth variation per particle

        if (i < baseCount) {
          basePosArr[i * 3]     = x;
          basePosArr[i * 3 + 1] = y;
          basePosArr[i * 3 + 2] = zPos;
        } else {
          const hi = i - baseCount;
          hdrPosArr[hi * 3]     = x;
          hdrPosArr[hi * 3 + 1] = y;
          hdrPosArr[hi * 3 + 2] = zPos;
        }
      }

      // Build THREE.BufferGeometry objects — owned here, disposed in useEffect.
      const baseGeo = new THREE.BufferGeometry();
      baseGeo.setAttribute("position", new THREE.BufferAttribute(basePosArr, 3));

      const hdrGeo = new THREE.BufferGeometry();
      hdrGeo.setAttribute("position", new THREE.BufferAttribute(hdrPosArr, 3));

      // Base color at standard luminance.
      const baseColor = new THREE.Color(color);

      // HDR color: multiply channels by hdrMult to exceed 1.0, passing the
      // LUMINANCE_THRESHOLD=1.0 gate when toneMapped=false is set on the material.
      const hdrColor = new THREE.Color(color).multiplyScalar(hdrMult);

      return { baseGeo, hdrGeo, baseColor, hdrColor };
    });

    return { layers: layerData, glowTexture: tex };
  }, []);

  // Dispose all GPU resources on unmount.
  useEffect(() => {
    return () => {
      glowTexture.dispose();
      layers.forEach(({ baseGeo, hdrGeo }) => {
        baseGeo.dispose();
        hdrGeo.dispose();
      });
    };
  }, [glowTexture, layers]);

  // Mouse parallax — lerp group rotation toward cursor * PARALLAX.STRENGTH.
  // state.pointer is a pre-existing R3F object; reading .x/.y is not a heap alloc.
  useFrame(({ pointer }) => {
    if (!groupRef.current) return;
    const targetX = -pointer.y * PARALLAX.STRENGTH;
    const targetY =  pointer.x * PARALLAX.STRENGTH;
    groupRef.current.rotation.x +=
      (targetX - groupRef.current.rotation.x) * PARALLAX.LERP;
    groupRef.current.rotation.y +=
      (targetY - groupRef.current.rotation.y) * PARALLAX.LERP;
  });

  return (
    <group ref={groupRef}>
      {layers.map(({ baseGeo, hdrGeo, baseColor, hdrColor }, i) => (
        <group key={i}>
          {/* Base cloud — standard tone-mapped particles */}
          <points>
            <primitive object={baseGeo} attach="geometry" />
            <pointsMaterial
              color={baseColor}
              size={0.3}
              sizeAttenuation
              map={glowTexture}
              transparent
              depthWrite={false}
              opacity={0.55}
            />
          </points>

          {/* HDR sub-cloud — toneMapped=false so channels > 1.0 pass bloom gate */}
          <points>
            <primitive object={hdrGeo} attach="geometry" />
            <pointsMaterial
              color={hdrColor}
              size={0.45}
              sizeAttenuation
              map={glowTexture}
              transparent
              depthWrite={false}
              toneMapped={false}
            />
          </points>
        </group>
      ))}
    </group>
  );
}
