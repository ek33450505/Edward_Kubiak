import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { TREES, TERRAIN, PALETTE } from "./constants";
import { sampleHeight } from "./Terrain";
import { mulberry32 } from "./prng";

// ---------------------------------------------------------------------------
// Instanced trees — hemlock (gorge walls) + oak (ridgelines).
// Geometries are stable (empty dep arrays) — created once, disposed on unmount.
// ConeGeometry is lightweight enough that r3f's auto-dispose is sufficient,
// but explicit cleanup is included for consistency.
// ---------------------------------------------------------------------------

export default function Trees() {
  const hemlockRef = useRef();
  const oakRef = useRef();

  const { hemlockMatrices, oakMatrices } = useMemo(() => {
    const rand = mulberry32(TREES.HEMLOCK_SEED);

    const hemlockMx = [];
    const oakMx = [];
    const dummy = new THREE.Object3D();
    const halfSize = TERRAIN.SIZE / 2;

    // ~HEMLOCK_TARGET hemlocks on gorge walls
    let attempts = 0;
    while (hemlockMx.length < TREES.HEMLOCK_TARGET && attempts < TREES.HEMLOCK_MAX_ATTEMPTS) {
      attempts++;
      const nx = rand() * 2 - 1;
      const nz = rand() * 2 - 1;
      const h = sampleHeight(nx, nz);
      const distFromGorge = Math.abs(nx - 0.1); // 0.1 = TERRAIN.GORGE_CENTER
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

    // ~OAK_TARGET oaks on ridgelines
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

    return { hemlockMatrices: hemlockMx, oakMatrices: oakMx };
  }, []);

  // Apply matrices once on mount
  useEffect(() => {
    if (hemlockRef.current) {
      hemlockMatrices.forEach((m, i) => hemlockRef.current.setMatrixAt(i, m));
      hemlockRef.current.instanceMatrix.needsUpdate = true;
    }
    if (oakRef.current) {
      oakMatrices.forEach((m, i) => oakRef.current.setMatrixAt(i, m));
      oakRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [hemlockMatrices, oakMatrices]);

  const hemlockGeo = useMemo(
    () => new THREE.ConeGeometry(
      TREES.HEMLOCK_CONE_RADIUS,
      TREES.HEMLOCK_CONE_HEIGHT,
      TREES.HEMLOCK_CONE_SEGS,
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
      oakGeo?.dispose();
    };
  }, [hemlockGeo, oakGeo]);

  return (
    <>
      {/* Hemlock — tall narrow, dark gorge-wall color */}
      <instancedMesh
        ref={hemlockRef}
        args={[hemlockGeo, null, hemlockMatrices.length]}
        frustumCulled={false}
      >
        <meshLambertMaterial color={PALETTE.GORGE_WALL_DARK} flatShading />
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
