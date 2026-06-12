import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { useReducedMotion } from "motion/react";
import { useFrameloopWhenVisible } from "../../hooks/useFrameloopWhenVisible";
import { CAMERA, SCENE, PALETTE } from "./constants";
import SkyDome from "./SkyDome";
import TerrainMesh from "./Terrain";
import River from "./River";
import Trees from "./Trees";
import RaceRoute from "./RouteLine";
import Fireflies from "./Fireflies";
import Mist from "./Mist";
import Headlamp from "./Headlamp";
import CameraRig from "./CameraRig";

// ---------------------------------------------------------------------------
// TrailScene — lighting, fog, and all scene objects.
// Kept here (not a separate file) as it has no independent reuse and its
// entire purpose is TrailTerrain composition.
// ---------------------------------------------------------------------------
function TrailScene() {
  return (
    <>
      {/* Pre-dome frame clear: slate background so any frame before the dome
          paints clears to slate rather than black. Overridden by SkyDome at
          runtime; container CSS gradient (SCENE.BACKGROUND_GRADIENT) handles
          the Suspense loading fallback outside the canvas. */}
      <color attach="background" args={[PALETTE.SLATE_950]} />

      {/* Exponential fog: thickens in the gorge depth */}
      <fogExp2 attach="fog" args={[PALETTE.FOG, SCENE.FOG_DENSITY]} />

      {/* Scene lighting: warm ambient + directional dusk */}
      <ambientLight intensity={SCENE.AMBIENT_INTENSITY} color={PALETTE.AMBIENT_LIGHT} />
      <directionalLight
        position={SCENE.SUN_POSITION}
        intensity={SCENE.SUN_INTENSITY}
        color={PALETTE.SUN_LIGHT}
      />
      <directionalLight
        position={SCENE.FILL_POSITION}
        intensity={SCENE.FILL_INTENSITY}
        color={PALETTE.FILL_LIGHT}
      />

      {/* CameraRig: outside Suspense — no async deps; pure useFrame side-effect */}
      <CameraRig />

      <Suspense fallback={null}>
        {/* SkyDome first: renders at renderOrder=-1, behind all scene objects */}
        <SkyDome />
        <TerrainMesh />
        <River />
        <Trees />
        <RaceRoute />
        {/* Headlamp: after RaceRoute — the narrative protagonist. Warm HDR sprite
            blooms; moving pointLight warms terrain/trees (LDR — never blooms).
            Adding the pointLight triggers a one-time shader recompile at mount,
            hidden inside Suspense so no dropped frame is visible. */}
        <Headlamp />
        <Fireflies />
        {/* Mist: after River — depth-sorted transparents; river draws first
            (further from camera), mist alpha-blends on top. See Mist.jsx
            render-order rationale. */}
        <Mist />
      </Suspense>
    </>
  );
}

// ---------------------------------------------------------------------------
// TrailTerrain — default export; consumed via React.lazy at import site.
//
// Engineering requirements (mirrors StarField):
//   - useReducedMotion() bail → return null before mounting Canvas
//   - IntersectionObserver on container → frameloop "demand"/"always"
//   - aria-hidden, pointer-events-none
//   - Canvas dpr=[1,1.5], antialias:false, alpha:false
//
// alpha:false rationale (changed from alpha:true in Unit 2):
//   SkyDome makes the canvas fully opaque at runtime — a transparent
//   framebuffer is unnecessary. More importantly, a transparent FBO +
//   EffectComposer (added in Unit 10) produces alpha-fringe artifacts on
//   HDR-bloomed pixels where the compositor pre-multiplies alpha against the
//   page background. Opaque canvas also skips page compositing overhead.
//   Container CSS gradient (SCENE.BACKGROUND_GRADIENT) stays as the
//   Suspense/loading fallback and is hidden by the canvas once it paints.
//
// Hook ordering: ALL hooks called unconditionally (Rules of Hooks).
// The reducedMotion bail-out is a render-return, not an early hook skip.
// useFrameloopWhenVisible receives reducedMotion and skips observer setup
// when true — see hook JSDoc for the edge-case rationale.
// ---------------------------------------------------------------------------
export default function TrailTerrain() {
  const reducedMotion = useReducedMotion();
  const [containerRef, frameloop] = useFrameloopWhenVisible(reducedMotion);

  // Pure decoration — render nothing when user prefers no motion
  if (reducedMotion) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
      style={{ background: SCENE.BACKGROUND_GRADIENT }}
    >
      <Canvas
        camera={{ position: CAMERA.POSITION, fov: CAMERA.FOV }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: false }}
        frameloop={frameloop}
        style={{ pointerEvents: "none" }}
      >
        <TrailScene />
      </Canvas>
    </div>
  );
}
