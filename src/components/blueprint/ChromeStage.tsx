"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

/**
 * The live chrome NGW-01 — the real asset behind the round trip. Driven by the
 * SAME there-and-back scalar (u) the SVG plate reads: the column orbits while u
 * is small, then DOCKS to a front pose by u≈0.3 so its silhouette sits under the
 * SVG white-ink trace; past the handoff the SVG plate covers it. Chrome only —
 * the blueprint look is the SVG's job. Visuals are tuned on real hardware.
 */
type Props = { progress: MutableRefObject<number>; active: boolean };

const smooth = (x: number, a: number, b: number) => THREE.MathUtils.smoothstep(x, a, b);

function Rig({ progress }: { progress: MutableRefObject<number> }) {
  const { camera } = useThree();
  useFrame(() => {
    const u = progress.current;
    const dock = smooth(u, 0.1, 0.3); // 0 = orbiting, 1 = docked front
    const ang = (1 - dock) * (0.55 + u * 1.6); // azimuth unwinds to 0 at the dock
    const rad = THREE.MathUtils.lerp(8.9, 8.2, dock);
    camera.position.set(
      Math.sin(ang) * rad,
      THREE.MathUtils.lerp(0.7, 0.0, dock),
      Math.cos(ang) * rad,
    );
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0.3, 0);
  });
  return null;
}

const STAGES = [
  { y: -1.6, color: "#9aa3ab" },
  { y: -0.8, color: "#0d1116" },
  { y: 0.0, color: "#15425e" },
  { y: 0.8, color: "#1c5f86" },
  { y: 1.6, color: "#29c2ee" },
];

function ChromeColumn({ progress }: { progress: MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);

  const housingGeo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.0, -2.0),
      new THREE.Vector2(0.94, -2.0),
      new THREE.Vector2(0.98, -1.82),
      new THREE.Vector2(0.98, -1.5),
      new THREE.Vector2(0.9, -1.42),
      new THREE.Vector2(0.9, 1.42),
      new THREE.Vector2(0.98, 1.5),
      new THREE.Vector2(0.98, 1.82),
      new THREE.Vector2(0.82, 2.04),
      new THREE.Vector2(0.42, 2.1),
      new THREE.Vector2(0.36, 2.36),
      new THREE.Vector2(0.34, 2.52),
      new THREE.Vector2(0.0, 2.54),
    ];
    return new THREE.LatheGeometry(pts, 96);
  }, []);

  useFrame((state) => {
    const u = progress.current;
    const dock = smooth(u, 0.1, 0.3);
    if (group.current) {
      group.current.rotation.y = (1 - dock) * 0.5 + state.clock.elapsedTime * 0.05 * (1 - dock);
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.03 * (1 - dock);
    }
  });

  return (
    <group ref={group} position={[-0.71, 0, 0]} scale={0.77}>
      <mesh geometry={housingGeo}>
        <meshPhysicalMaterial color="#aeb9c2" metalness={1} roughness={0.16} clearcoat={1} clearcoatRoughness={0.06} envMapIntensity={1.3} />
      </mesh>

      {/* inlet stubs */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.42, 2.32, 0]} rotation={[0, 0, (s * Math.PI) / 2.4]}>
          <cylinderGeometry args={[0.12, 0.12, 0.5, 24]} />
          <meshPhysicalMaterial color="#9aa6af" metalness={1} roughness={0.3} />
        </mesh>
      ))}

      {/* glass sleeve */}
      <mesh>
        <cylinderGeometry args={[0.82, 0.82, 3.6, 64, 1, true]} />
        <meshPhysicalMaterial color="#dff3fb" metalness={0} roughness={0.04} transmission={1} thickness={0.5} ior={1.45} transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* media stages */}
      {STAGES.map((s, i) => (
        <mesh key={s.y} position={[0, s.y, 0]}>
          <cylinderGeometry args={[0.7, 0.7, 0.74, 40]} />
          <meshStandardMaterial
            color={s.color}
            metalness={i === 2 || i === 4 ? 0.35 : 0.1}
            roughness={0.62}
            emissive={i === 4 ? "#0c4a61" : "#000000"}
            emissiveIntensity={i === 4 ? 0.25 : 0}
          />
        </mesh>
      ))}

      {/* caps */}
      <mesh position={[0, -2.05, 0]}>
        <cylinderGeometry args={[0.99, 0.99, 0.3, 96]} />
        <meshPhysicalMaterial color="#9aa6af" metalness={1} roughness={0.4} clearcoat={0.6} />
      </mesh>
      <mesh position={[0, 2.52, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 0.42, 64]} />
        <meshPhysicalMaterial color="#9aa6af" metalness={1} roughness={0.4} clearcoat={0.6} />
      </mesh>

      {/* cyan accent ring */}
      <mesh position={[0, -1.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.99, 0.018, 14, 96]} />
        <meshStandardMaterial color="#29c2ee" emissive="#29c2ee" emissiveIntensity={0.9} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function ChromeStage({ progress, active }: Props) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 2]}
      camera={{ position: [0, 0, 8.6], fov: 36 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Environment preset="warehouse" environmentIntensity={0.85} />
      <ambientLight intensity={0.2} />
      <directionalLight position={[4, 6, 5]} intensity={1.0} color="#eaf6ff" />
      <directionalLight position={[-5, 1, -3]} intensity={0.35} color="#29c2ee" />

      <ChromeColumn progress={progress} />
      <Rig progress={progress} />

      <ContactShadows position={[0, -2.3, 0]} opacity={0.5} scale={13} blur={2.8} far={5} color="#000000" />

      <EffectComposer>
        <Bloom intensity={0.32} luminanceThreshold={0.6} luminanceSmoothing={0.3} mipmapBlur />
        <Vignette eskil={false} offset={0.3} darkness={0.7} />
      </EffectComposer>
    </Canvas>
  );
}
