import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RIVER, TERRAIN, PALETTE } from "./constants";

// ---------------------------------------------------------------------------
// River ribbon — CatmullRomCurve3 along gorge floor → TubeGeometry.
//
// Disposal: TubeGeometry is created in a useMemo that depends on `curve`.
// `curve` depends on `[]` (stable), so the geometry is created once and
// never re-created mid-session.  The useEffect cleanup disposes it on unmount
// because TubeGeometry is a substantial heap object (TUBE_SEGMENTS × radial
// verts) that r3f may not always catch on a Suspense-wrapped unmount.
// ---------------------------------------------------------------------------
export default function River() {
  const meshRef = useRef();
  const uvOffset = useRef(0);

  const curve = useMemo(() => {
    const points = [];
    const halfSize = TERRAIN.SIZE / 2;
    for (let i = 0; i <= RIVER.WAYPOINTS; i++) {
      const t = (i / RIVER.WAYPOINTS) * 2 - 1;
      const z = t * (halfSize - 0.5);
      const xOffset = Math.sin(t * Math.PI * RIVER.MEANDER_FREQ) * RIVER.MEANDER_AMP;
      const x = 0.1 * halfSize + xOffset; // gorge center (normalized 0.1) × half-size
      points.push(new THREE.Vector3(x, RIVER.Y_OFFSET, z));
    }
    return new THREE.CatmullRomCurve3(points);
  }, []);

  const geometry = useMemo(() => {
    return new THREE.TubeGeometry(
      curve,
      RIVER.TUBE_SEGMENTS,
      RIVER.TUBE_RADIUS,
      RIVER.TUBE_RADIAL_SEGMENTS,
      false
    );
  }, [curve]);

  // Dispose TubeGeometry on unmount (see note above)
  useEffect(() => {
    return () => {
      geometry?.dispose();
    };
  }, [geometry]);

  useFrame((_, delta) => {
    uvOffset.current += delta * RIVER.SCROLL_SPEED;
    if (meshRef.current) {
      meshRef.current.material.map &&
        (meshRef.current.material.map.offset.x = uvOffset.current);
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color={PALETTE.SKY}
        emissive={PALETTE.SKY}
        emissiveIntensity={RIVER.EMISSIVE_INTENSITY}
        transparent
        opacity={RIVER.OPACITY}
        roughness={0.1}
        metalness={0.2}
      />
    </mesh>
  );
}
