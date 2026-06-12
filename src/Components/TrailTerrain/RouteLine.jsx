import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import * as THREE from "three";
import { PALETTE, TERRAIN } from "./constants";
import { sampleHeight } from "./Terrain";

// ---------------------------------------------------------------------------
// RaceRoute — CatmullRomCurve3 closed loop, PALETTE.ACCENT emissive line,
// dash animation via material.dashOffset mutation.
//
// Note on dashOffset animation: drei's Line component uses LineDashedMaterial
// internally. Mutating mat.dashOffset in useFrame is the accepted approach
// (ref mutation, no re-render). needsUpdate is intentionally false — LineMaterial
// dashOffset is a uniform, not a geometry attribute, so it doesn't need a flag.
// If drei's Line internals change, this is the first thing to re-verify.
// ---------------------------------------------------------------------------
export default function RaceRoute() {
  const lineRef = useRef();
  const dashOffset = useRef(0);

  // Route waypoints: south ridge traverse → gorge descent → river leg → climb → lake → close
  const routePoints = useMemo(() => [
    new THREE.Vector3(-8, sampleHeight(-0.8, -0.7) * TERRAIN.HEIGHT_SCALE + 0.12, -7),
    new THREE.Vector3(-5, sampleHeight(-0.5, -0.5) * TERRAIN.HEIGHT_SCALE + 0.12, -5),
    new THREE.Vector3(-2, sampleHeight(-0.2, -0.3) * TERRAIN.HEIGHT_SCALE + 0.12, -4),
    new THREE.Vector3(0.5, sampleHeight(0.05, -0.1) * TERRAIN.HEIGHT_SCALE + 0.12, -1.5),
    new THREE.Vector3(1.0, 0.35, 0),
    new THREE.Vector3(1.0, 0.3, 2),
    new THREE.Vector3(1.2, 0.28, 4),
    new THREE.Vector3(0.8, 0.3, 6),
    new THREE.Vector3(-0.5, sampleHeight(-0.05, 0.75) * TERRAIN.HEIGHT_SCALE + 0.12, 7.5),
    new THREE.Vector3(-3, sampleHeight(-0.3, 0.85) * TERRAIN.HEIGHT_SCALE + 0.12, 8.5),
    new THREE.Vector3(5, sampleHeight(0.5, 0.7) * TERRAIN.HEIGHT_SCALE + 0.12, 7),
    new THREE.Vector3(8, sampleHeight(0.8, 0.3) * TERRAIN.HEIGHT_SCALE + 0.12, 3),
    new THREE.Vector3(7, sampleHeight(0.7, -0.3) * TERRAIN.HEIGHT_SCALE + 0.12, -3),
    new THREE.Vector3(4, sampleHeight(0.4, -0.7) * TERRAIN.HEIGHT_SCALE + 0.12, -7),
    new THREE.Vector3(-8, sampleHeight(-0.8, -0.7) * TERRAIN.HEIGHT_SCALE + 0.12, -7), // close loop
  ], []);

  const curvePoints = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(routePoints, true);
    return curve.getPoints(120);
  }, [routePoints]);

  useFrame((_, delta) => {
    dashOffset.current += delta * 0.6;
    if (lineRef.current && lineRef.current.material) {
      const mat = lineRef.current.material;
      if (mat.dashOffset !== undefined) {
        mat.dashOffset = -dashOffset.current;
        // needsUpdate intentionally omitted — dashOffset is a uniform
      }
    }
  });

  return (
    <Line
      ref={lineRef}
      points={curvePoints}
      color={PALETTE.ACCENT}
      lineWidth={1.8}
      dashed
      dashSize={0.4}
      gapSize={0.15}
      dashOffset={0}
    />
  );
}
