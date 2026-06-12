import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { TERRAIN, PALETTE } from "./constants";

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

  // Small undulation (stable sine — no random)
  const undulation =
    Math.sin(nx * 8.0 + 0.5) * 0.04 +
    Math.sin(nz * 6.3 + 1.2) * 0.03;

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
      <meshLambertMaterial
        vertexColors
        flatShading
        side={THREE.FrontSide}
      />
    </mesh>
  );
}
