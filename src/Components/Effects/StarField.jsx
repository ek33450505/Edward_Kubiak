import { useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

/**
 * Nebula cloud — colored particles drifting in space with additive blending.
 * Each cloud is a Points object with randomized positions in a spherical shell.
 */
function NebulaCloud({ count = 300, radius = 6, color, speed = 0.0002 }) {
  const ref = useRef();

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * 0.4 + Math.random() * radius * 0.6;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count, radius]);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += speed;
      ref.current.rotation.x += speed * 0.3;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <PointMaterial
        color={color}
        size={0.06}
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/**
 * Core galaxy scene — dense star clusters with spiral-arm-inspired distribution
 * and colored nebula clouds. Slowly rotates and follows mouse for parallax.
 */
function GalaxyCore() {
  const groupRef = useRef();
  const mouse = useRef({ x: 0, y: 0 });

  // Track mouse position normalized to -1..1
  useFrame((state) => {
    const { pointer } = state;
    mouse.current.x = pointer.x;
    mouse.current.y = pointer.y;

    if (groupRef.current) {
      // Gentle mouse parallax
      groupRef.current.rotation.y +=
        (mouse.current.x * 0.05 - groupRef.current.rotation.y) * 0.02;
      groupRef.current.rotation.x +=
        (mouse.current.y * 0.03 - groupRef.current.rotation.x) * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Dense background stars — white, tiny, many */}
      <Stars
        radius={50}
        depth={80}
        count={6000}
        factor={4}
        saturation={0}
        fade
        speed={0.5}
      />

      {/* Amber nebula — warm glow, positioned off-center left */}
      <group position={[-2, 0.5, -3]}>
        <NebulaCloud
          count={250}
          radius={5}
          color="#00FFC2"
          speed={0.00025}
        />
      </group>

      {/* Sky-blue nebula — cool accent, upper right */}
      <group position={[3, 1.5, -4]}>
        <NebulaCloud
          count={200}
          radius={4}
          color="#38bdf8"
          speed={0.00018}
        />
      </group>

      {/* Violet nebula — subtle depth, lower center */}
      <group position={[0, -2, -5]}>
        <NebulaCloud
          count={150}
          radius={4.5}
          color="#a78bfa"
          speed={0.00015}
        />
      </group>

      {/* Rose accent — sparse, far back */}
      <group position={[4, -1, -6]}>
        <NebulaCloud
          count={80}
          radius={3}
          color="#fb7185"
          speed={0.0002}
        />
      </group>

      {/* Emerald accent — sparse, far back */}
      <group position={[-3, -1.5, -5]}>
        <NebulaCloud
          count={80}
          radius={3}
          color="#34d399"
          speed={0.00022}
        />
      </group>


    </group>
  );
}

/**
 * StarField — the full-screen 3D galactic background.
 * Wrapped in Suspense with a transparent fallback so it loads gracefully.
 * Uses a fixed position behind all page content.
 */
export default function StarField() {
  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <GalaxyCore />
        </Suspense>
        <ambientLight intensity={0.1} />
      </Canvas>
    </div>
  );
}
