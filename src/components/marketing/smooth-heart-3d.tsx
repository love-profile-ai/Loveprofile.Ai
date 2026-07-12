"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { ORB_THEME, type OrbTheme } from "@/components/marketing/orb-theme";

function createHeartGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.92);
  shape.bezierCurveTo(-0.55, -0.42, -0.95, -0.05, -0.95, 0.32);
  shape.bezierCurveTo(-0.95, 0.66, -0.68, 0.9, -0.4, 0.9);
  shape.bezierCurveTo(-0.18, 0.9, -0.05, 0.78, 0, 0.6);
  shape.bezierCurveTo(0.05, 0.78, 0.18, 0.9, 0.4, 0.9);
  shape.bezierCurveTo(0.68, 0.9, 0.95, 0.66, 0.95, 0.32);
  shape.bezierCurveTo(0.95, -0.05, 0.55, -0.42, 0, -0.92);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.09,
    bevelSegments: 10,
    steps: 1,
    curveSegments: 32,
  });
  geometry.center();
  return geometry;
}

function paintHeartGradient(geometry: THREE.ExtrudeGeometry, theme: OrbTheme) {
  const { rose, coral, lavender, blush, gold } = ORB_THEME[theme].heart.colors;
  const cRose = new THREE.Color(rose);
  const cCoral = new THREE.Color(coral);
  const cLavender = new THREE.Color(lavender);
  const cBlush = new THREE.Color(blush);
  const cGold = new THREE.Color(gold);

  const positions = geometry.attributes.position;
  const colors = new Float32Array(positions.count * 3);
  const tmp = new THREE.Color();

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);

    const height = THREE.MathUtils.clamp((y + 0.55) / 1.1, 0, 1);
    const side = Math.abs(x) / 0.95;
    const depth = THREE.MathUtils.clamp((z + 0.2) / 0.45, 0, 1);

    if (height < 0.35) {
      tmp.lerpColors(cRose, cCoral, height / 0.35);
    } else if (height < 0.68) {
      tmp.lerpColors(cCoral, cLavender, (height - 0.35) / 0.33);
    } else {
      tmp.lerpColors(cLavender, cBlush, (height - 0.68) / 0.32);
    }

    if (side > 0.55) tmp.lerp(cRose, 0.22);
    if (depth > 0.65) tmp.lerp(cGold, 0.12);

    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}

interface SmoothHeart3DProps {
  theme: OrbTheme;
}

/** Vivid gradient 3D heart with romantic pulse */
export function SmoothHeart3D({ theme }: SmoothHeart3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRefs = useRef<(THREE.Mesh | null)[]>([]);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const reduced = useReducedMotion();
  const palette = ORB_THEME[theme];

  const geometry = useMemo(() => {
    const geo = createHeartGeometry();
    paintHeartGradient(geo, theme);
    return geo;
  }, [theme]);

  const baseScale = palette.heart.scale;

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    if (!reduced) {
      meshRef.current.rotation.y = t * 0.34;

      const period = 1.15;
      const frac = (t % period) / period;
      const beat =
        1 +
        0.065 * Math.exp(-Math.pow((frac - 0.12) / 0.07, 2)) +
        0.04 * Math.exp(-Math.pow((frac - 0.34) / 0.06, 2));
      const s = baseScale * beat;
      meshRef.current.scale.set(s, s, s);

      glowRefs.current.forEach((glow, i) => {
        if (!glow) return;
        glow.rotation.y = t * 0.34;
        const spread = 1.06 + i * 0.05;
        glow.scale.set(s * spread, s * spread, s * spread);
      });

      if (materialRef.current) {
        const pulse = 0.85 + 0.15 * Math.sin(t * 1.6);
        materialRef.current.emissiveIntensity = palette.heart.emissiveIntensity * pulse;
        materialRef.current.clearcoat = 0.9 + 0.08 * Math.sin(t * 0.9);
      }
    } else {
      meshRef.current.rotation.set(0, 0, 0);
      meshRef.current.scale.set(baseScale, baseScale, baseScale);
    }
  });

  return (
    <group>
      <pointLight
        position={[0, 0.1, 0.35]}
        intensity={palette.heart.innerLightIntensity}
        color={palette.heart.innerLight}
        distance={4}
      />
      {palette.heart.glowColors.map((glowColor, i) => (
        <mesh
          key={glowColor}
          ref={(el) => {
            glowRefs.current[i] = el;
          }}
          geometry={geometry}
        >
          <meshBasicMaterial
            color={glowColor}
            transparent
            opacity={palette.heart.glowOpacity * (0.55 - i * 0.12)}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
      <mesh ref={meshRef} geometry={geometry}>
        <meshPhysicalMaterial
          ref={materialRef}
          vertexColors
          emissive={palette.heart.emissive}
          emissiveIntensity={palette.heart.emissiveIntensity}
          roughness={0.18}
          metalness={0.12}
          clearcoat={0.95}
          clearcoatRoughness={0.1}
          reflectivity={0.65}
          iridescence={0.35}
          iridescenceIOR={1.3}
          iridescenceThicknessRange={[100, 400]}
        />
      </mesh>
    </group>
  );
}
