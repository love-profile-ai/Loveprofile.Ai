"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import * as THREE from "three";
import { SmoothHeart3D } from "@/components/marketing/smooth-heart-3d";
import { ORB_THEME, type OrbTheme } from "@/components/marketing/orb-theme";

function OrbCore({ theme }: { theme: OrbTheme }) {
  const groupRef = useRef<THREE.Group>(null);
  const palette = ORB_THEME[theme];

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.y = t * 0.1;
    groupRef.current.rotation.x = Math.sin(t * 0.06) * 0.06;
  });

  return (
    <Float speed={0.9} rotationIntensity={0.1} floatIntensity={0.32}>
      <group ref={groupRef}>
        <SmoothHeart3D theme={theme} />

        <mesh>
          <sphereGeometry args={[1.15, 64, 64]} />
          <meshPhysicalMaterial
            color={palette.shell.color}
            emissive={palette.shell.emissive}
            emissiveIntensity={palette.shell.emissiveIntensity}
            roughness={0.14}
            metalness={0.06}
            clearcoat={0.78}
            clearcoatRoughness={0.18}
            transparent
            opacity={palette.shell.opacity}
            depthWrite={false}
            iridescence={0.2}
            iridescenceIOR={1.25}
          />
        </mesh>

        <mesh scale={1.24}>
          <sphereGeometry args={[1.15, 32, 32]} />
          <meshBasicMaterial
            color={palette.halo.color}
            transparent
            opacity={palette.halo.opacity}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      </group>
    </Float>
  );
}

function Ribbon({ offset, color }: { offset: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const curve = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 80; i++) {
      const t = (i / 80) * Math.PI * 2;
      const r = 1.55 + Math.sin(t * 3 + offset) * 0.18;
      points.push(
        new THREE.Vector3(
          Math.cos(t + offset) * r,
          Math.sin(t * 2 + offset) * 0.35,
          Math.sin(t + offset) * r
        )
      );
    }
    return new THREE.CatmullRomCurve3(points, true);
  }, [offset]);

  const geometry = useMemo(
    () => new THREE.TubeGeometry(curve, 120, 0.025, 8, true),
    [curve]
  );

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * 0.14 + offset;
  });

  return (
    <mesh ref={ref} geometry={geometry}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.82}
        transparent
        opacity={0.92}
        roughness={0.14}
      />
    </mesh>
  );
}

function Scene({ theme }: { theme: OrbTheme }) {
  const palette = ORB_THEME[theme];
  const { ambient, key, fill, rim, accent } = palette.lights;

  return (
    <>
      <ambientLight intensity={ambient.intensity} color={ambient.color} />
      <directionalLight position={[3, 4, 6]} intensity={key.intensity} color={key.color} />
      <pointLight position={[-4, -1, 4]} intensity={fill.intensity} color={fill.color} distance={20} />
      <pointLight position={[4, 4, 4]} intensity={rim.intensity} color={rim.color} distance={20} />
      <pointLight position={[-3, -2, 2]} intensity={accent.intensity} color={accent.color} distance={20} />
      <Stars
        radius={60}
        depth={40}
        count={palette.stars.count}
        factor={palette.stars.factor}
        saturation={palette.stars.saturation}
        fade
        speed={0.28}
      />
      <OrbCore theme={theme} />
      <Ribbon offset={0} color={palette.ribbons.rose} />
      <Ribbon offset={(Math.PI * 2) / 3} color={palette.ribbons.lavender} />
      <Ribbon offset={(Math.PI * 4) / 3} color={palette.ribbons.coral} />
    </>
  );
}

interface NilaOrbCanvasProps {
  theme: OrbTheme;
  width: number;
  height: number;
}

export default function NilaOrbCanvas({ theme, width, height }: NilaOrbCanvasProps) {
  return (
    <Canvas
      className="touch-none"
      camera={{ position: [0, 0, 4.2], fov: 42 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      style={{ width, height, background: "transparent" }}
      resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
    >
      <Scene theme={theme} />
    </Canvas>
  );
}
