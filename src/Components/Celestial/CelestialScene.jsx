/**
 * CelestialScene.jsx — Root component for the Celestial art scene.
 *
 * REDUCED-MOTION CONTRACT:
 *   useReducedMotion() is checked BEFORE the Canvas is imported or evaluated.
 *   When true, this component renders CelestialFallback (a CSS-gradient div)
 *   and returns early — no Three.js, no Canvas, no WebGL context.
 *
 * WEBGL FALLBACK (independent of reduced-motion):
 *   isWebGLAvailable() probes for a WebGL/WebGL2 context at mount time.
 *   When false (headless browser, old device, VM with no GPU), this component
 *   also renders CelestialFallback instead of crashing. Either gate condition
 *   alone is sufficient to skip the Canvas.
 *
 * FRAMELOOP CONTROL:
 *   useFrameloopWhenVisible pauses the render loop (frameloop="demand") when
 *   the container is scrolled off-screen. frameloop="always" when visible.
 *   This prevents GPU spin when the hero section is not in view.
 *
 * ACCESSIBILITY:
 *   Container div: aria-hidden="true", pointer-events: none, position: fixed,
 *   z-index: 0 — purely decorative, never receives focus or input events.
 */

import { useMemo } from "react";
import { useReducedMotion } from "motion/react";
import { ACCENT } from "../../lib/tokens";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useFrameloopWhenVisible } from "../../hooks/useFrameloopWhenVisible";
import { isWebGLAvailable } from "../../lib/three/webgl";
import { STARS, CAMERA, BLOOM } from "./constants";
import NebulaLayer from "./NebulaLayer";
import ShootingStars from "./ShootingStars";
import CameraRig from "./CameraRig";

// ---------------------------------------------------------------------------
// CelestialFallback — static CSS-gradient substitute for reduced-motion users.
// No Three.js, no Canvas — just a decorative gradient div matching the palette.
// ---------------------------------------------------------------------------
function CelestialFallback() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        background:
          `radial-gradient(ellipse at 30% 40%, ${ACCENT}15 0%, transparent 55%), ` +
          "radial-gradient(ellipse at 70% 60%, #38bdf810 0%, transparent 50%), " +
          "#0a0f1a",
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// CelestialScene — WebGL hero background.
// Must be Suspense-wrapped by the caller (HeroSection).
// ---------------------------------------------------------------------------
export default function CelestialScene() {
  // Reduced-motion check BEFORE any Canvas is referenced.
  // This is the sole gating mechanism — CameraRig, NebulaLayer, ShootingStars
  // all assume motion is permitted (no internal guard needed in those components).
  const prefersReducedMotion = useReducedMotion();

  // WebGL availability check — computed once at mount. A device or browser without
  // WebGL (headless, old mobile, VM) would crash the Canvas; return the static
  // gradient fallback instead. This gate is INDEPENDENT of the reduced-motion gate:
  // either condition alone is sufficient to skip the Canvas.
  const webglOK = useMemo(() => isWebGLAvailable(), []);

  // useFrameloopWhenVisible returns [containerRef, frameloop].
  // When reducedMotion=true, the hook skips IntersectionObserver setup;
  // the returned containerRef and frameloop are unused (we return early below).
  const [containerRef, frameloop] = useFrameloopWhenVisible(prefersReducedMotion ?? false);

  if (prefersReducedMotion || !webglOK) {
    return <CelestialFallback />;
  }

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: false }}
        frameloop={frameloop}
        camera={{
          position: CAMERA.POSITION,
          fov: 60,
        }}
      >
        {/* THREE.Clock: upstream drei internals, not actionable — deprecation warning
            originates inside @react-three/drei Stars / useFrame internals, not this codebase. */}
        {/* Base star field — drei Stars, no custom geometry needed */}
        <Stars
          radius={STARS.RADIUS}
          depth={STARS.DEPTH}
          count={STARS.COUNT}
          factor={STARS.FACTOR}
          saturation={STARS.SATURATION}
          fade={STARS.FADE}
        />

        {/* Layered nebula point clouds with mouse parallax */}
        <NebulaLayer />

        {/* Comet trails pool (dual-buffer pattern) */}
        <ShootingStars />

        {/* Lissajous camera breath */}
        <CameraRig />

        {/* Post-processing: selective bloom + vignette */}
        <EffectComposer multisampling={BLOOM.MULTISAMPLING}>
          <Bloom
            intensity={BLOOM.INTENSITY}
            luminanceThreshold={BLOOM.LUMINANCE_THRESHOLD}
            luminanceSmoothing={BLOOM.LUMINANCE_SMOOTHING}
            radius={BLOOM.RADIUS}
            levels={BLOOM.LEVELS}
          />
          <Vignette
            offset={BLOOM.VIGNETTE_OFFSET}
            darkness={BLOOM.VIGNETTE_DARKNESS}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
