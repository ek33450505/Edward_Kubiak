import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { TREES, TERRAIN, PALETTE } from "./constants";
import { sampleHeight } from "./Terrain";
import { mulberry32 } from "./prng";

// ---------------------------------------------------------------------------
// Instanced trees — three species covering the gorge cross-section:
//
//   Hemlock   gorge walls       h 0.18–0.55, close to gorge
//   Beech     mid-slope open    h 0.20–0.55, full width (fills the empty band)
//   Oak       ridgeline canopy  h > 0.45,    full width
//
// Three InstancedMesh draw calls, ~1040 cone instances of ~12 triangles each.
// Geometries are stable (empty dep arrays) — created once, disposed on unmount.
// ConeGeometry is lightweight; explicit cleanup is included for consistency.
//
// Seeding: hemlock + oak share one PRNG stream (existing behavior preserved).
//          Beech gets its own independent stream (BEECH_SEED) so its count
//          changes never perturb hemlock/oak placements.
// ---------------------------------------------------------------------------

export default function Trees() {
  const hemlockRef = useRef();
  const beechRef = useRef();
  const oakRef = useRef();

  const { hemlockMatrices, beechMatrices, oakMatrices } = useMemo(() => {
    // --- Shared stream for hemlock + oak (existing behavior) ---
    const rand = mulberry32(TREES.HEMLOCK_SEED);

    // --- Independent stream for beech ---
    const beechRand = mulberry32(TREES.BEECH_SEED);

    const hemlockMx = [];
    const beechMx = [];
    const oakMx = [];
    const dummy = new THREE.Object3D();
    const halfSize = TERRAIN.SIZE / 2;

    // ------------------------------------------------------------------
    // Band 1 — Hemlock: gorge-wall conifers (h 0.18–0.55, close to gorge)
    // Tall narrow dark silhouettes that read as dense old-growth hemlock.
    // ------------------------------------------------------------------
    let attempts = 0;
    while (hemlockMx.length < TREES.HEMLOCK_TARGET && attempts < TREES.HEMLOCK_MAX_ATTEMPTS) {
      attempts++;
      const nx = rand() * 2 - 1;
      const nz = rand() * 2 - 1;
      const h = sampleHeight(nx, nz);
      const distFromGorge = Math.abs(nx - TERRAIN.GORGE_CENTER);
      if (
        h >= TREES.HEMLOCK_H_MIN &&
        h <= TREES.HEMLOCK_H_MAX &&
        distFromGorge < TREES.HEMLOCK_DIST_FROM_GORGE_MAX
      ) {
        const x = nx * halfSize;
        const z = nz * halfSize;
        const y = h * TERRAIN.HEIGHT_SCALE;
        const scale = TREES.HEMLOCK_SCALE_MIN + rand() * TREES.HEMLOCK_SCALE_RANGE;
        dummy.position.set(x, y + scale * TREES.HEMLOCK_Y_LIFT, z);
        dummy.scale.set(scale * TREES.HEMLOCK_X_SQUASH, scale, scale * TREES.HEMLOCK_X_SQUASH);
        dummy.updateMatrix();
        hemlockMx.push(dummy.matrix.clone());
      }
    }

    // ------------------------------------------------------------------
    // Band 2 — Beech / tulip poplar / yellow birch: mid-slope deciduous
    // Fills the previously empty open-slope zone (h 0.20–0.55, full width).
    // Independent PRNG so beech count changes never shift hemlock/oak positions.
    // ------------------------------------------------------------------
    attempts = 0;
    while (beechMx.length < TREES.BEECH_TARGET && attempts < TREES.BEECH_MAX_ATTEMPTS) {
      attempts++;
      const nx = beechRand() * 2 - 1;
      const nz = beechRand() * 2 - 1;
      const h = sampleHeight(nx, nz);
      if (h >= TREES.BEECH_H_MIN && h <= TREES.BEECH_H_MAX) {
        const x = nx * halfSize;
        const z = nz * halfSize;
        const y = h * TERRAIN.HEIGHT_SCALE;
        const scale = TREES.BEECH_SCALE_MIN + beechRand() * TREES.BEECH_SCALE_RANGE;
        dummy.position.set(x, y + scale * TREES.BEECH_Y_LIFT, z);
        dummy.scale.set(
          scale * TREES.BEECH_X_SQUASH,
          scale * TREES.BEECH_Y_SQUASH,
          scale * TREES.BEECH_X_SQUASH
        );
        dummy.updateMatrix();
        beechMx.push(dummy.matrix.clone());
      }
    }

    // ------------------------------------------------------------------
    // Band 3 — Oak: ridgeline canopy (h > 0.45, any width)
    // Squat warm-green canopy that caps the ridgelines.
    // Continues from hemlock's shared rand stream (existing behavior).
    // ------------------------------------------------------------------
    attempts = 0;
    while (oakMx.length < TREES.OAK_TARGET && attempts < TREES.OAK_MAX_ATTEMPTS) {
      attempts++;
      const nx = rand() * 2 - 1;
      const nz = rand() * 2 - 1;
      const h = sampleHeight(nx, nz);
      if (h > TREES.OAK_H_MIN) {
        const x = nx * halfSize;
        const z = nz * halfSize;
        const y = h * TERRAIN.HEIGHT_SCALE;
        const scale = TREES.OAK_SCALE_MIN + rand() * TREES.OAK_SCALE_RANGE;
        dummy.position.set(x, y + scale * TREES.OAK_Y_LIFT, z);
        dummy.scale.set(
          scale * TREES.OAK_X_SQUASH,
          scale * TREES.OAK_Y_SQUASH,
          scale * TREES.OAK_X_SQUASH
        );
        dummy.updateMatrix();
        oakMx.push(dummy.matrix.clone());
      }
    }

    return { hemlockMatrices: hemlockMx, beechMatrices: beechMx, oakMatrices: oakMx };
  }, []);

  // Apply matrices once on mount
  useEffect(() => {
    if (hemlockRef.current) {
      hemlockMatrices.forEach((m, i) => hemlockRef.current.setMatrixAt(i, m));
      hemlockRef.current.instanceMatrix.needsUpdate = true;
    }
    if (beechRef.current) {
      beechMatrices.forEach((m, i) => beechRef.current.setMatrixAt(i, m));
      beechRef.current.instanceMatrix.needsUpdate = true;
    }
    if (oakRef.current) {
      oakMatrices.forEach((m, i) => oakRef.current.setMatrixAt(i, m));
      oakRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [hemlockMatrices, beechMatrices, oakMatrices]);

  const hemlockGeo = useMemo(
    () => new THREE.ConeGeometry(
      TREES.HEMLOCK_CONE_RADIUS,
      TREES.HEMLOCK_CONE_HEIGHT,
      TREES.HEMLOCK_CONE_SEGS,
      1
    ),
    []
  );

  /** Mid-slope deciduous: broader cone between hemlock (narrow) and oak (squat) */
  const beechGeo = useMemo(
    () => new THREE.ConeGeometry(
      TREES.BEECH_CONE_RADIUS,
      TREES.BEECH_CONE_HEIGHT,
      TREES.BEECH_CONE_SEGS,
      1
    ),
    []
  );

  const oakGeo = useMemo(
    () => new THREE.ConeGeometry(
      TREES.OAK_CONE_RADIUS,
      TREES.OAK_CONE_HEIGHT,
      TREES.OAK_CONE_SEGS,
      1
    ),
    []
  );

  useEffect(() => {
    return () => {
      hemlockGeo?.dispose();
      beechGeo?.dispose();
      oakGeo?.dispose();
    };
  }, [hemlockGeo, beechGeo, oakGeo]);

  return (
    <>
      {/* Hemlock — tall narrow, deep gorge-wall shadow color */}
      <instancedMesh
        ref={hemlockRef}
        args={[hemlockGeo, null, hemlockMatrices.length]}
        frustumCulled={false}
      >
        <meshLambertMaterial color={PALETTE.GORGE_WALL_DARK} flatShading />
      </instancedMesh>

      {/* Beech / tulip poplar — mid-tone deciduous, fills open-slope band */}
      <instancedMesh
        ref={beechRef}
        args={[beechGeo, null, beechMatrices.length]}
        frustumCulled={false}
      >
        <meshLambertMaterial color={PALETTE.BEECH_MID} flatShading />
      </instancedMesh>

      {/* Oak — squat, warm ridge canopy */}
      <instancedMesh
        ref={oakRef}
        args={[oakGeo, null, oakMatrices.length]}
        frustumCulled={false}
      >
        <meshLambertMaterial color={PALETTE.EMERALD} flatShading />
      </instancedMesh>
    </>
  );
}
