/**
 * Terrain.jsx — Procedural terrain mesh for TrailTerrain
 *
 * Exports:
 *   sampleHeight(nx, nz)      — shared heightmap function (used by River, Trees, etc.)
 *   injectTerrainShader(shader) — pure onBeforeCompile injector (node-testable)
 *   default: TerrainMesh       — R3F mesh component
 *
 * SHADER INJECTION — injectTerrainShader:
 *
 * Four verified facts (three r183) that drive the injection-point choices:
 *
 * 1. Normal availability: Lambert with flatShading computes the per-face normal
 *    in-fragment via dFdx/dFdy inside #include <normal_fragment_begin>. Rim light
 *    is injected AFTER that include and receives the correct view-space face normal.
 *
 * 2. worldpos_vertex is compiled OUT without shadow/envmap defines. We inject our
 *    own world-Y varying (vEkWorldY) computed from modelMatrix * transformed directly
 *    in the vertex shader, rather than relying on the standard worldpos_vertex chunk.
 *
 * 3. Fog interaction: material.fog=true (default) keeps USE_FOG active so Three.js
 *    computes vFogDepth in the vertex shader. We replace #include <fog_fragment> with
 *    aerial perspective for this mesh only. Trees, River, and Mist retain standard
 *    fogExp2 — their materials have no onBeforeCompile, so their fog path is untouched.
 *
 * 4. Lambert fragment tail order: opaque_fragment → tonemapping_fragment →
 *    colorspace_fragment → fog_fragment. fog runs AFTER tone mapping, so aerial
 *    perspective (replacing fog_fragment) operates on LDR color. Rim light is added
 *    to outgoingLight before opaque_fragment — also LDR. Neither can cross the
 *    luminanceThreshold=1.0 bloom gate (bloom selectivity contract preserved).
 *
 * PROGRAM CACHE: injectTerrainShader is a module-level named export — stable function
 * identity across renders. Three.js keys onBeforeCompile programs on the function's
 * toString(), so the terrain Lambert program gets a unique, stable cache key. Trees
 * use Lambert WITHOUT onBeforeCompile, so their cache key differs by construction.
 * No customProgramCacheKey override needed.
 *
 * SINGLE-CALL CONTRACT: Three.js calls onBeforeCompile once per program compile, then
 * caches the program. Do not invoke injectTerrainShader manually outside of Three.js's
 * material system (double-injection would produce duplicate GLSL declarations).
 */

import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { TERRAIN, PALETTE, SCENE } from "./constants";

// ---------------------------------------------------------------------------
// Terrain heightmap — procedural, no external noise lib.
// Produces: ridges ~1.0 on left and right flanks, gorge cut in center-right
// dropping to a flat valley floor at ~0.1–0.15.
// Exported so River, Trees, RaceRoute, and Fireflies can reuse it.
// ---------------------------------------------------------------------------
export function sampleHeight(nx, nz) {
  // nx, nz are in [-1, 1] where the terrain plane is TERRAIN.SIZE×TERRAIN.SIZE units.
  // Layered sine-based ridge noise (math-only — terrain must be stable across calls).
  const ridgeA = Math.sin(nx * Math.PI * 1.2) * 0.5 + 0.5;
  const ridgeB = Math.sin(nz * Math.PI * 0.9 + 0.3) * 0.3 + 0.3;
  const ridge = ridgeA * 0.6 + ridgeB * 0.4;

  // Gorge: centered at GORGE_CENTER, width = 2 × GORGE_HALF_WIDTH
  const gorgeFactor = Math.max(
    0,
    1 - Math.abs(nx - TERRAIN.GORGE_CENTER) / TERRAIN.GORGE_HALF_WIDTH
  );
  const gorgeShape = gorgeFactor > 0 ? Math.pow(gorgeFactor, 1.5) : 0;

  const wallFactor =
    gorgeFactor > 0 && gorgeFactor < TERRAIN.WALL_THRESHOLD
      ? (1 - gorgeFactor) * 0.4
      : 0;

  // Valley floor: flat at the gorge bottom
  const floorHeight = gorgeShape > TERRAIN.FLOOR_THRESHOLD ? TERRAIN.GORGE_FLOOR_HEIGHT : 0;

  const baseHeight = ridge * (1 - gorgeShape * 0.85);
  const height =
    floorHeight > 0
      ? floorHeight
      : baseHeight * (1 - wallFactor) + wallFactor * 0.35;

  // Small undulation (stable sine — no random).
  // Amplitudes sourced from TERRAIN.UNDULATION_AMP_A/B (constants.js) so
  // they are tunable without touching shader code. Reduced from 0.04/0.03
  // to 0.025/0.02 to calm ridgelines and let the dense forest read clearly.
  // All consumers of sampleHeight (Trees, Fireflies, RouteLine) re-sample
  // automatically — no per-consumer update needed.
  const undulation =
    Math.sin(nx * 8.0 + 0.5) * TERRAIN.UNDULATION_AMP_A +
    Math.sin(nz * 6.3 + 1.2) * TERRAIN.UNDULATION_AMP_B;

  return Math.max(0.05, height + undulation);
}

function elevationToColor(h) {
  if (h > TERRAIN.RIDGE_HEIGHT) {
    const t = (h - TERRAIN.RIDGE_HEIGHT) / TERRAIN.RIDGE_HEIGHT;
    return new THREE.Color().lerpColors(
      new THREE.Color(PALETTE.GORGE_WALL_MID),
      new THREE.Color(PALETTE.EMERALD),
      t * 0.9
    );
  } else if (h > 0.18) {
    const t = (h - 0.18) / 0.32;
    return new THREE.Color().lerpColors(
      new THREE.Color(PALETTE.SLATE_950),
      new THREE.Color(PALETTE.GORGE_WALL_MID),
      t
    );
  } else {
    return new THREE.Color(PALETTE.FLOOR_DARK);
  }
}

// ---------------------------------------------------------------------------
// injectTerrainShader — pure onBeforeCompile injector
// Operates on shader stub: { vertexShader: string, fragmentShader: string, uniforms: {} }
// See file header for design rationale and single-call contract.
// ---------------------------------------------------------------------------
export function injectTerrainShader(shader) {
  // ---- Uniforms ----
  // uSunDirWorld: normalized world-space sun direction from SCENE.SUN_POSITION.
  // Transformed to view-space inside the fragment shader via viewMatrix — no
  // per-frame update needed (sun is static for the dusk scene).
  const sp = SCENE.SUN_POSITION;
  Object.assign(shader.uniforms, {
    uRimColor:       { value: new THREE.Color(TERRAIN.RIM_COLOR) },
    uRimStrength:    { value: TERRAIN.RIM_STRENGTH },
    uRimPower:       { value: TERRAIN.RIM_POWER },
    uSunDirWorld:    { value: new THREE.Vector3(sp[0], sp[1], sp[2]).normalize() },
    uAerialDensity:  { value: TERRAIN.AERIAL_DENSITY },
    uAerialStrength: { value: TERRAIN.AERIAL_STRENGTH },
    uAerialYMin:     { value: TERRAIN.AERIAL_Y_MIN },
    uAerialYMax:     { value: TERRAIN.AERIAL_Y_MAX },
    uAerialLow:      { value: new THREE.Color(TERRAIN.AERIAL_COLOR_LOW) },
    uAerialHigh:     { value: new THREE.Color(TERRAIN.AERIAL_COLOR_HIGH) },
  });

  // ---- Vertex shader ----
  // Prepend varying declaration then inject world-Y assignment after fog_vertex.
  // transformed = final local-space position (after begin_vertex / morphing / skinning).
  // modelMatrix is in Three.js's built-in shader prefix — always available.
  shader.vertexShader = [
    "varying float vEkWorldY;",
    shader.vertexShader,
  ]
    .join("\n")
    .replace(
      "#include <fog_vertex>",
      "#include <fog_vertex>\n  vEkWorldY = (modelMatrix * vec4(transformed, 1.0)).y;"
    );

  // ---- Fragment shader ----
  // 1. Prepend varying + all custom uniform declarations.
  // 2. Prepend rim light accumulation immediately before opaque_fragment.
  //    outgoingLight is modified before it is folded into gl_FragColor → stays LDR.
  // 3. Replace fog_fragment entirely with aerial-perspective blend.
  //    vFogDepth is still computed (fog:true / USE_FOG active); we just consume it
  //    differently from the standard fogExp2 mix.
  const fragDecls = [
    "varying float vEkWorldY;",
    "uniform vec3  uRimColor;",
    "uniform float uRimStrength;",
    "uniform float uRimPower;",
    "uniform vec3  uSunDirWorld;",
    "uniform float uAerialDensity;",
    "uniform float uAerialStrength;",
    "uniform float uAerialYMin;",
    "uniform float uAerialYMax;",
    "uniform vec3  uAerialLow;",
    "uniform vec3  uAerialHigh;",
  ].join("\n");

  // Rim block: prepend before opaque_fragment (include preserved — prepend pattern).
  const rimBlock = [
    "  // --- terrain rim light (LDR — outgoingLight; never blooms) ---",
    "  vec3 ekViewDir = normalize(vViewPosition);",
    "  float ekRim = pow(1.0 - clamp(dot(normal, ekViewDir), 0.0, 1.0), uRimPower);",
    "  vec3 ekSunView = normalize((viewMatrix * vec4(uSunDirWorld, 0.0)).xyz);",
    "  outgoingLight += uRimColor * ekRim * clamp(dot(normal, ekSunView), 0.0, 1.0) * uRimStrength;",
    "#include <opaque_fragment>",
  ].join("\n");

  // Aerial block: replaces fog_fragment entirely (no standard fog kept for terrain).
  // exp2 fog formula mirrors Three.js fogExp2: factor = 1 - exp2(-d²*depth²*log2(e))
  const aerialBlock = [
    "  // --- terrain aerial perspective (replaces fogExp2 for this mesh only) ---",
    "  float ekFogFactor = 1.0 - exp2(-uAerialDensity * uAerialDensity * vFogDepth * vFogDepth * 1.442695);",
    "  vec3 ekAerial = mix(uAerialLow, uAerialHigh, smoothstep(uAerialYMin, uAerialYMax, vEkWorldY));",
    "  gl_FragColor.rgb = mix(gl_FragColor.rgb, ekAerial, clamp(ekFogFactor * uAerialStrength, 0.0, 1.0));",
  ].join("\n");

  shader.fragmentShader = (fragDecls + "\n" + shader.fragmentShader)
    .replace("#include <opaque_fragment>", rimBlock)
    .replace("#include <fog_fragment>", aerialBlock);
}

// ---------------------------------------------------------------------------
// TerrainMesh — PlaneGeometry SEGMENTS×SEGMENTS, displaced + vertex colored.
// Disposal: geometry is created in useMemo with an empty dep array, so it
// never re-creates mid-session. The useEffect cleanup disposes it on unmount
// since r3f auto-dispose only covers geometries attached to mesh children
// of the Canvas tree at unmount time — a large custom-attribute geometry
// warrants an explicit cleanup to be safe.
// ---------------------------------------------------------------------------
export default function TerrainMesh() {
  const meshRef = useRef();

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      TERRAIN.SIZE,
      TERRAIN.SIZE,
      TERRAIN.SEGMENTS,
      TERRAIN.SEGMENTS
    );
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const count = pos.count;
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const nx = x / (TERRAIN.SIZE / 2);
      const nz = z / (TERRAIN.SIZE / 2);
      const h = sampleHeight(nx, nz);
      pos.setY(i, h * TERRAIN.HEIGHT_SCALE);
      const col = elevationToColor(h);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    pos.needsUpdate = true;
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  useEffect(() => {
    return () => {
      geometry?.dispose();
    };
  }, [geometry]);

  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow>
      {/*
       * onBeforeCompile={injectTerrainShader}:
       * Module-level named function → stable toString() → unique Three.js program
       * cache key. Trees use Lambert WITHOUT onBeforeCompile (key differs by
       * construction); no collision risk, no customProgramCacheKey needed.
       */}
      <meshLambertMaterial
        vertexColors
        flatShading
        side={THREE.FrontSide}
        onBeforeCompile={injectTerrainShader}
      />
    </mesh>
  );
}
