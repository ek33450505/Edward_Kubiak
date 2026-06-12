/**
 * Mist.jsx — Layered valley mist for TrailTerrain.
 *
 * OVERDRAW MITIGATION:
 *   Planes are sized to the gorge only (MIST.WIDTH × MIST.LENGTH), not the full
 *   terrain (TERRAIN.SIZE). LAYER_COUNT is the primary tunable lever: reduce to 3
 *   first if GPU perf budget is exceeded, then shrink WIDTH. All four layers share
 *   a single PlaneGeometry (one draw call worth of geometry, not four), disposed
 *   once on unmount. depthWrite:false prevents depth-buffer overdraw on opaque
 *   geometry that would otherwise mask transparency sorting.
 *
 * TEXTURE CLONING:
 *   One source noise texture is created via createNoiseTexture, then .clone()d per
 *   layer. Clones share the underlying image.data Uint8Array on the CPU side, but
 *   each clone is uploaded as its own WebGLTexture (4 × 128² RGBA ≈ 256 KB VRAM —
 *   negligible). The point of cloning is the independent repeat/offset state, which
 *   is what enables each plane to drift at a different UV speed/direction.
 *   needsUpdate = true must be set on each clone explicitly. Texture clones do not
 *   auto-flag the GPU upload; without it the clone renders as a black square.
 *   RepeatWrapping is set on the source by createNoiseTexture; clones inherit it
 *   via Three.js Texture.clone() (which copies wrapS/T from the source).
 *
 * RENDER ORDER / RIVER INTERACTION:
 *   River y≈0.22, lowest mist y=MIST.LAYER_YS[0]=0.35. Camera at CAMERA.POSITION
 *   [8, 4, 0] — above and to the side of the gorge.
 *   Distance from camera to river center > distance to mist layer-0 center: the
 *   river sits lower (further below the camera), so Three.js back-to-front
 *   transparent sort draws river first, then mist layers on top. River glints
 *   read through the low-opacity mist (0.06–0.16) via standard alpha compositing.
 *   No explicit renderOrder override is needed; the natural depth sort produces
 *   correct occlusion. Both river (transparent, depthWrite not set = true by
 *   default) and mist (transparent, depthWrite:false) are opaque objects for the
 *   depth test; the distance delta between river and mist is small but consistent
 *   from the fixed camera position. Setting explicit renderOrder here would
 *   override distance sorting and would be the wrong lever.
 *
 * BLEND / BLOOM CONTRACT:
 *   NormalBlending (default): mist modulates and occludes; it does NOT add HDR
 *   energy the way AdditiveBlending would. This is intentional — mist is
 *   atmospheric, not glowing.
 *   toneMapped = true (default, not overridden): output stays ≤ 1.0 → never
 *   crosses the Bloom luminanceThreshold=1.0 gate. Mist MUST NOT bloom.
 *   fog:true: standard fogExp2 depth haze applies, naturally blending distant
 *   mist planes into the gorge fog at depth.
 *
 * ZERO PER-FRAME ALLOCATIONS:
 *   useFrame mutates textures[i].offset.x/y in-place. No new objects created.
 *
 * DISPOSAL:
 *   Shared geometry: disposed once in useEffect cleanup.
 *   Cloned textures: each clone disposed in useEffect cleanup. Clones are created
 *   imperatively in useMemo (not via JSX) so r3f cannot track them; manual
 *   disposal is required to avoid GPU memory leaks on unmount.
 *   meshBasicMaterial instances: created via JSX <meshBasicMaterial /> so r3f
 *   disposes them automatically when their parent mesh unmounts.
 */

import { useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MIST } from "./constants";
import { createNoiseTexture } from "./textures";

// ---------------------------------------------------------------------------
// Mist — R3F component
// ---------------------------------------------------------------------------
export default function Mist() {
  // ---- Shared geometry (one PlaneGeometry for all LAYER_COUNT meshes) ----
  // PlaneGeometry lies in the XY plane by default; each mesh applies
  // rotation={[-Math.PI / 2, 0, 0]} to lay it flat in the XZ plane.
  const geometry = useMemo(() => {
    return new THREE.PlaneGeometry(MIST.WIDTH, MIST.LENGTH);
  }, []);

  // ---- Per-layer texture clones ----
  // ONE source noise texture, cloned per layer for independent offset/repeat.
  const textures = useMemo(() => {
    const source = createNoiseTexture(
      MIST.TEX_SIZE,
      MIST.NOISE_SEED,
      MIST.NOISE_LATTICE,
      MIST.NOISE_OCTAVES,
    );
    const clones = Array.from({ length: MIST.LAYER_COUNT }, (_, i) => {
      const clone = source.clone();
      // needsUpdate triggers GPU upload on first render — required for clones.
      clone.needsUpdate = true;
      // Per-layer UV repeat — slightly different across layers to break
      // visible tiling registration between co-planar mist layers.
      const rep = MIST.REPEATS[i];
      clone.repeat.set(rep[0], rep[1]);
      return clone;
    });
    // source is never used in a render (no mesh references it), so no GPU
    // allocation is made for it. The shared image.data Uint8Array is kept alive
    // by each clone's .image reference until the clones are disposed.
    // source goes out of scope here and will be GC'd normally.
    return clones;
  }, []);

  // ---- Disposal ----
  // Shared geometry: once covers all four meshes.
  // Cloned textures: explicit — r3f does not track imperatively-created textures.
  // meshBasicMaterial JSX instances: r3f disposes automatically on mesh unmount.
  useEffect(() => {
    return () => {
      geometry.dispose();
      textures.forEach((t) => t.dispose());
    };
  }, [geometry, textures]);

  // ---- Drift animation ----
  // Each clone's UV offset advances by DRIFT_SPEEDS[i] * delta per frame.
  // A 0.3× y-component with the same sign produces a slight diagonal drift
  // (visible as slow diagonal flow rather than purely horizontal slide).
  // Even-indexed layers drift in the +x direction; odd-indexed in -x.
  // Zero per-frame allocations — in-place mutation of offset vector.
  useFrame((_, delta) => {
    for (let i = 0; i < MIST.LAYER_COUNT; i++) {
      const speed = MIST.DRIFT_SPEEDS[i];
      textures[i].offset.x += speed * delta;
      textures[i].offset.y += speed * 0.3 * delta;
    }
  });

  return (
    <>
      {MIST.LAYER_YS.map((y, i) => (
        <mesh
          key={i}
          geometry={geometry}
          position={[MIST.CENTER_X, y, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          {/*
           * meshBasicMaterial: unlit — mist is atmospheric depth, not a light
           * receiver. Lighting on a mist plane would make it read as a surface
           * rather than a volumetric haze.
           *
           * color: MIST.COLOR tints the white noise texture toward the deep gorge
           * fog palette. The noise texture rgb channels are 255 (white) so color
           * drives the final hue entirely; alpha channel drives per-pixel opacity.
           *
           * depthWrite:false: mist planes must not write the depth buffer.
           * If they did, their depth values would occlude opaque objects (trees,
           * terrain) drawn at the same depth — transparent planes should never
           * participate in depth rejection of scene geometry.
           *
           * fog:true: standard fogExp2 blends the plane into gorge depth haze.
           *
           * blending: NormalBlending is the Three.js default, stated explicitly
           * for clarity — mist attenuates/modulates, NOT AdditiveBlending (which
           * would add HDR energy and potentially trigger bloom on mist).
           *
           * toneMapped not overridden (defaults to true): output stays ≤ 1.0.
           * Mist MUST NOT bloom — this is the contract enforced by the default.
           */}
          <meshBasicMaterial
            map={textures[i]}
            color={MIST.COLOR}
            transparent
            opacity={MIST.LAYER_OPACITIES[i]}
            depthWrite={false}
            fog={true}
            blending={THREE.NormalBlending}
          />
        </mesh>
      ))}
    </>
  );
}
