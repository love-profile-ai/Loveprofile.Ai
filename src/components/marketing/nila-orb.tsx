"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

function OrbCore({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    meshRef.current.rotation.y = t * 0.12;
    meshRef.current.rotation.x = Math.sin(t * 0.08) * 0.08 + mouse.current.y * 0.15;
    meshRef.current.position.x = mouse.current.x * 0.25;
    meshRef.current.position.y = mouse.current.y * 0.15;
  });

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.15, 64, 64]} />
        <meshStandardMaterial
          color="#E8A5B0"
          emissive="#B9AEDE"
          emissiveIntensity={0.35}
          roughness={0.35}
          metalness={0.15}
        />
      </mesh>
      <mesh scale={1.22}>
        <sphereGeometry args={[1.15, 32, 32]} />
        <meshBasicMaterial
          color="#E8A5B0"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>
    </Float>
  );
}

function Ribbon({
  offset,
  color,
  mouse,
}: {
  offset: number;
  color: string;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
}) {
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
    ref.current.rotation.y = t * 0.18 + offset;
    ref.current.position.x = mouse.current.x * 0.1;
  });

  return (
    <mesh ref={ref} geometry={geometry}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6}
        transparent
        opacity={0.85}
        roughness={0.2}
      />
    </mesh>
  );
}

function Scene({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  return (
    <>
      <ambientLight intensity={0.45} />
      <pointLight position={[4, 4, 4]} intensity={1.2} color="#F4EFEA" />
      <pointLight position={[-3, -2, 2]} intensity={0.6} color="#B9AEDE" />
      <pointLight position={[0, -4, -2]} intensity={0.4} color="#F2926F" />
      <Stars
        radius={60}
        depth={40}
        count={1200}
        factor={2.5}
        saturation={0.4}
        fade
        speed={0.35}
      />
      <OrbCore mouse={mouse} />
      <Ribbon offset={0} color="#E8A5B0" mouse={mouse} />
      <Ribbon offset={Math.PI} color="#B9AEDE" mouse={mouse} />
    </>
  );
}

interface NilaOrbProps {
  className?: string;
}

export function NilaOrb({ className }: NilaOrbProps) {
  const reduced = useReducedMotion();
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (reduced) return;
    function onMove(e: MouseEvent) {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    }
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [reduced]);

  if (reduced) {
    return (
      <div
        className={className}
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 50% 45%, rgba(232,165,176,0.45), rgba(185,174,222,0.2) 55%, transparent 72%)",
        }}
      />
    );
  }

  return (
    <div className={className} aria-hidden>
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <Scene mouse={mouse} />
      </Canvas>
    </div>
  );
}
