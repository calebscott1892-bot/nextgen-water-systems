"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

type P = { progress: MutableRefObject<number> };

/* ---- camera keyframes (beats 0–4): emerge → dolly → orbit → through → 3/4 cut ---- */
type Key = { p: number; pos: [number, number, number]; tgt: [number, number, number] };
const CAM: Key[] = [
  { p: 0.0, pos: [0, -1.7, 3.0], tgt: [0, 0.3, 0] }, // 0 low, close, looking up
  { p: 0.09, pos: [0, 0.2, 6.4], tgt: [0, 0, 0] }, // 1 dolly back, full frame
  { p: 0.16, pos: [4.8, 0.7, 4.3], tgt: [0, 0, 0] }, // 2 orbit begins
  { p: 0.3, pos: [5.8, 1.4, 0.8], tgt: [0, 0.4, 0] }, // 2→3 around toward intake
  { p: 0.39, pos: [0.0, 2.8, 1.7], tgt: [0, 0.6, 0] }, // 3 over the top
  { p: 0.48, pos: [0.0, -0.2, 2.1], tgt: [0, 0, 0] }, // 3 down the axis (inside)
  { p: 0.6, pos: [4.4, 0.9, 5.1], tgt: [0, 0, 0] }, // 4 pull back, cross-section
];

function segment(p: number): [Key, Key] {
  for (let i = 0; i < CAM.length - 1; i++) {
    if (p <= CAM[i + 1].p) return [CAM[i], CAM[i + 1]];
  }
  return [CAM[CAM.length - 2], CAM[CAM.length - 1]];
}

function Rig({ progress }: P) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());
  useFrame(() => {
    const p = progress.current;
    const [a, b] = segment(p);
    const span = b.p - a.p || 1;
    const t = THREE.MathUtils.clamp((p - a.p) / span, 0, 1);
    const e = t * t * (3 - 2 * t); // smoothstep
    camera.position.set(
      THREE.MathUtils.lerp(a.pos[0], b.pos[0], e),
      THREE.MathUtils.lerp(a.pos[1], b.pos[1], e),
      THREE.MathUtils.lerp(a.pos[2], b.pos[2], e),
    );
    target.current.set(
      THREE.MathUtils.lerp(a.tgt[0], b.tgt[0], e),
      THREE.MathUtils.lerp(a.tgt[1], b.tgt[1], e),
      THREE.MathUtils.lerp(a.tgt[2], b.tgt[2], e),
    );
    camera.lookAt(target.current);
  });
  return null;
}

function FilterModel({ progress }: P) {
  const group = useRef<THREE.Group>(null);
  const housingMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const clip = useMemo(() => new THREE.Plane(new THREE.Vector3(-1, 0, 0), 2.0), []);

  // chrome canister silhouette, revolved
  const housingGeo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.0, -2.0),
      new THREE.Vector2(0.92, -2.0),
      new THREE.Vector2(0.96, -1.82),
      new THREE.Vector2(0.96, 1.8),
      new THREE.Vector2(0.82, 2.02),
      new THREE.Vector2(0.42, 2.08),
      new THREE.Vector2(0.36, 2.34), // neck
      new THREE.Vector2(0.34, 2.5),
      new THREE.Vector2(0.0, 2.52),
    ];
    return new THREE.LatheGeometry(pts, 120);
  }, []);

  const STAGES = useMemo(
    () => [
      { y: -1.25, color: "#8a949c" }, // sediment (steel grey)
      { y: -0.42, color: "#0d1116" }, // carbon block (near-black)
      { y: 0.42, color: "#1c5f86" }, // RO membrane (deep)
      { y: 1.25, color: "#29c2ee" }, // re-mineralise (cyan)
    ],
    [],
  );

  useFrame((state) => {
    const p = progress.current;
    if (group.current) {
      group.current.rotation.y = p * Math.PI * 0.5 + state.clock.elapsedTime * 0.06;
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.04; // idle bob
    }
    if (housingMat.current) {
      // fade the housing to glassy while travelling through (beat 3)
      const reveal =
        THREE.MathUtils.smoothstep(p, 0.3, 0.38) - THREE.MathUtils.smoothstep(p, 0.46, 0.52);
      const op = 1 - reveal * 0.82;
      housingMat.current.opacity = op;
      housingMat.current.transparent = op < 0.995;
    }
    // cross-section sweep (beat 4): constant 2 (no clip) → 0 (removes +x half)
    clip.constant = THREE.MathUtils.lerp(2.0, 0.0, THREE.MathUtils.smoothstep(p, 0.48, 0.6));
  });

  return (
    <group ref={group}>
      {/* chrome housing (clipped for the cross-section) */}
      <mesh geometry={housingGeo} castShadow>
        <meshPhysicalMaterial
          ref={housingMat}
          color="#aeb9c2"
          metalness={1}
          roughness={0.18}
          clearcoat={1}
          clearcoatRoughness={0.08}
          envMapIntensity={1.15}
          clippingPlanes={[clip]}
          clipShadows
        />
      </mesh>

      {/* inner glass sleeve */}
      <mesh>
        <cylinderGeometry args={[0.8, 0.8, 3.7, 64, 1, true]} />
        <meshPhysicalMaterial
          color="#dff3fb"
          metalness={0}
          roughness={0.05}
          transmission={1}
          thickness={0.4}
          ior={1.45}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* filter media stages */}
      {STAGES.map((s, i) => (
        <mesh key={i} position={[0, s.y, 0]}>
          <cylinderGeometry args={[0.7, 0.7, 0.78, 48]} />
          <meshStandardMaterial
            color={s.color}
            metalness={i === 3 ? 0.4 : 0.1}
            roughness={0.6}
            emissive={i === 3 ? "#0a3a4d" : "#000000"}
            emissiveIntensity={i === 3 ? 0.4 : 0}
          />
        </mesh>
      ))}

      {/* brushed end caps */}
      <mesh position={[0, -2.05, 0]}>
        <cylinderGeometry args={[0.97, 0.97, 0.3, 96]} />
        <meshPhysicalMaterial color="#9aa6af" metalness={1} roughness={0.42} clearcoat={0.6} envMapIntensity={1} />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 0.42, 64]} />
        <meshPhysicalMaterial color="#9aa6af" metalness={1} roughness={0.42} clearcoat={0.6} envMapIntensity={1} />
      </mesh>

      {/* cyan accent ring */}
      <mesh position={[0, 1.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.97, 0.022, 16, 120]} />
        <meshStandardMaterial color="#29c2ee" emissive="#29c2ee" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function FilterScene({ progress, active }: { progress: MutableRefObject<number>; active: boolean }) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 2]}
      camera={{ position: [0, 0, 6], fov: 42 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      {/* synthetic studio env for chrome reflections — no HDR file shipped */}
      <Environment frames={1} resolution={256}>
        <Lightformer intensity={2.2} position={[3, 3, 4]} scale={[7, 7, 1]} color="#dbf2ff" />
        <Lightformer intensity={1.3} position={[-5, 1, 2]} scale={[4, 9, 1]} color="#29c2ee" />
        <Lightformer intensity={0.9} position={[0, -4, -3]} scale={[9, 5, 1]} color="#0f6fb0" />
        <Lightformer intensity={0.6} position={[0, 5, -2]} scale={[10, 3, 1]} color="#ffffff" />
      </Environment>
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 6, 5]} intensity={1.3} color="#eaf6ff" />

      <FilterModel progress={progress} />
      <Rig progress={progress} />
    </Canvas>
  );
}
