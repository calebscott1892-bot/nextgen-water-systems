"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows, Html } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

type SceneProps = { progress: MutableRefObject<number>; active: boolean; beat: number };

/* ---- twisting camera path (beats 0–5): emerge → orbit → under → over → through → cut → explode ---- */
type Key = { p: number; pos: [number, number, number]; tgt: [number, number, number]; roll: number };
const CAM: Key[] = [
  { p: 0.0, pos: [0, -1.8, 3.0], tgt: [0, 0.4, 0], roll: 0.05 },
  { p: 0.09, pos: [0.5, 0.3, 6.7], tgt: [0, 0, 0], roll: -0.04 },
  { p: 0.16, pos: [5.3, 1.1, 3.7], tgt: [0, 0, 0], roll: 0.08 },
  { p: 0.24, pos: [3.4, -1.4, -3.6], tgt: [0, 0, 0], roll: -0.07 }, // swing under/behind
  { p: 0.32, pos: [-4.8, 1.7, -1.8], tgt: [0, 0.4, 0], roll: 0.1 }, // far side, high
  { p: 0.4, pos: [0.0, 3.1, 1.3], tgt: [0, 0.6, 0], roll: 0.0 }, // over the top
  { p: 0.48, pos: [0.0, -0.2, 1.85], tgt: [0, 0, 0], roll: 0.0 }, // down the axis (inside)
  { p: 0.56, pos: [4.7, 0.6, 4.6], tgt: [0, 0, 0], roll: -0.05 }, // pull back 3/4 (cross-section)
  { p: 0.66, pos: [6.6, 2.1, 5.2], tgt: [0, 0.2, 0], roll: 0.05 }, // explode, wide
  { p: 0.74, pos: [5.0, 0.4, 6.4], tgt: [0, 0, 0], roll: -0.03 }, // settle on exploded
];

function seg(p: number): [Key, Key] {
  for (let i = 0; i < CAM.length - 1; i++) if (p <= CAM[i + 1].p) return [CAM[i], CAM[i + 1]];
  return [CAM[CAM.length - 2], CAM[CAM.length - 1]];
}

function Rig({ progress }: { progress: MutableRefObject<number> }) {
  const { camera } = useThree();
  const tgt = useRef(new THREE.Vector3());
  useFrame(() => {
    const p = progress.current;
    const [a, b] = seg(p);
    const span = b.p - a.p || 1;
    const t = THREE.MathUtils.clamp((p - a.p) / span, 0, 1);
    const e = t * t * (3 - 2 * t);
    camera.position.set(
      THREE.MathUtils.lerp(a.pos[0], b.pos[0], e),
      THREE.MathUtils.lerp(a.pos[1], b.pos[1], e),
      THREE.MathUtils.lerp(a.pos[2], b.pos[2], e),
    );
    tgt.current.set(
      THREE.MathUtils.lerp(a.tgt[0], b.tgt[0], e),
      THREE.MathUtils.lerp(a.tgt[1], b.tgt[1], e),
      THREE.MathUtils.lerp(a.tgt[2], b.tgt[2], e),
    );
    camera.lookAt(tgt.current);
    camera.rotateZ(THREE.MathUtils.lerp(a.roll, b.roll, e)); // twist
  });
  return null;
}

const STAGES = [
  { y: -1.6, color: "#9aa3ab", n: "01", title: "Sediment", sub: "20μm pre-filter", beats: [3, 4, 5] },
  { y: -0.8, color: "#0d1116", n: "02", title: "Carbon block", sub: "chlorine · taste · odour", beats: [3, 4, 5] },
  { y: 0.0, color: "#15425e", n: "03", title: "RO membrane", sub: "lead · PFAS · fluoride*", beats: [3, 4, 5] },
  { y: 0.8, color: "#1c5f86", n: "04", title: "Post-carbon", sub: "final polish", beats: [4, 5] },
  { y: 1.6, color: "#29c2ee", n: "05", title: "Re-mineralise", sub: "balanced pH", beats: [3, 4, 5] },
];

function FilterModel({ progress, beat }: { progress: MutableRefObject<number>; beat: number }) {
  const group = useRef<THREE.Group>(null);
  const housingMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const glassMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const stageRefs = useRef<(THREE.Group | null)[]>([]);
  const topCap = useRef<THREE.Group>(null);
  const botCap = useRef<THREE.Group>(null);
  const clip = useMemo(() => new THREE.Plane(new THREE.Vector3(-1, 0, 0), 2.0), []);

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
    return new THREE.LatheGeometry(pts, 128);
  }, []);

  useFrame((state) => {
    const p = progress.current;
    const ex = THREE.MathUtils.smoothstep(p, 0.6, 0.74); // explode amount

    if (group.current) {
      group.current.rotation.y = p * Math.PI * 0.35 + state.clock.elapsedTime * 0.05;
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.035 * (1 - ex);
    }
    if (housingMat.current) {
      const reveal = THREE.MathUtils.smoothstep(p, 0.3, 0.38) - THREE.MathUtils.smoothstep(p, 0.46, 0.52);
      const op = (1 - reveal * 0.85) * (1 - ex * 0.85);
      housingMat.current.opacity = op;
      housingMat.current.transparent = op < 0.995;
    }
    if (glassMat.current) glassMat.current.opacity = 0.9 * (1 - ex);
    clip.constant = THREE.MathUtils.lerp(2.0, 0.0, THREE.MathUtils.smoothstep(p, 0.48, 0.6) * (1 - ex));

    // explode: stages spread along Y, caps fly out
    stageRefs.current.forEach((g, i) => {
      if (g) g.position.y = STAGES[i].y + (i - 2) * ex * 1.05;
    });
    if (topCap.current) topCap.current.position.y = 2.52 + ex * 1.6;
    if (botCap.current) botCap.current.position.y = -2.05 - ex * 1.2;
  });

  return (
    <group ref={group}>
      {/* chrome housing (clipped for the cross-section) */}
      <mesh geometry={housingGeo}>
        <meshPhysicalMaterial
          ref={housingMat}
          color="#aeb9c2"
          metalness={1}
          roughness={0.16}
          clearcoat={1}
          clearcoatRoughness={0.06}
          envMapIntensity={1.4}
          clippingPlanes={[clip]}
          clipShadows
        />
      </mesh>

      {/* inlet / outlet ports on the manifold */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.42, 2.32, 0]} rotation={[0, 0, (s * Math.PI) / 2.4]}>
          <cylinderGeometry args={[0.12, 0.12, 0.5, 24]} />
          <meshPhysicalMaterial color="#9aa6af" metalness={1} roughness={0.3} envMapIntensity={1.2} />
        </mesh>
      ))}

      {/* glass sleeve */}
      <mesh>
        <cylinderGeometry args={[0.82, 0.82, 3.6, 80, 1, true]} />
        <meshPhysicalMaterial
          ref={glassMat}
          color="#dff3fb"
          metalness={0}
          roughness={0.04}
          transmission={1}
          thickness={0.5}
          ior={1.45}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* media stages (each in a group so it explodes + carries its label) */}
      {STAGES.map((s, i) => (
        <group
          key={s.n}
          ref={(el) => {
            stageRefs.current[i] = el;
          }}
          position={[0, s.y, 0]}
        >
          <mesh>
            <cylinderGeometry args={[0.7, 0.7, 0.74, 48]} />
            <meshStandardMaterial
              color={s.color}
              metalness={i === 2 || i === 4 ? 0.35 : 0.1}
              roughness={0.62}
              emissive={i === 4 ? "#0c4a61" : "#000000"}
              emissiveIntensity={i === 4 ? 0.5 : 0}
            />
          </mesh>
          {s.beats.includes(beat) && (
            <Html position={[1.15, 0, 0]} className="jlabel" center={false} zIndexRange={[20, 0]}>
              <span className="jlabel-line" />
              <span className="jlabel-n">{s.n}</span>
              <span className="jlabel-t">{s.title}</span>
              <span className="jlabel-s">{s.sub}</span>
            </Html>
          )}
        </group>
      ))}

      {/* brushed caps */}
      <group ref={botCap} position={[0, -2.05, 0]}>
        <mesh>
          <cylinderGeometry args={[0.99, 0.99, 0.3, 96]} />
          <meshPhysicalMaterial color="#9aa6af" metalness={1} roughness={0.4} clearcoat={0.6} envMapIntensity={1.2} />
        </mesh>
      </group>
      <group ref={topCap} position={[0, 2.52, 0]}>
        <mesh>
          <cylinderGeometry args={[0.36, 0.36, 0.42, 64]} />
          <meshPhysicalMaterial color="#9aa6af" metalness={1} roughness={0.4} clearcoat={0.6} envMapIntensity={1.2} />
        </mesh>
      </group>

      {/* cyan accent ring */}
      <mesh position={[0, -1.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.99, 0.02, 16, 120]} />
        <meshStandardMaterial color="#29c2ee" emissive="#29c2ee" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function FilterScene({ progress, active, beat }: SceneProps) {
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
      {/* real HDRI reflections for the chrome (swap preset to taste: warehouse/studio/city) */}
      <Environment preset="warehouse" environmentIntensity={0.9} />
      <ambientLight intensity={0.18} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} color="#eaf6ff" />
      <directionalLight position={[-5, 1, -3]} intensity={0.5} color="#29c2ee" />

      <FilterModel progress={progress} beat={beat} />
      <Rig progress={progress} />

      <ContactShadows position={[0, -2.3, 0]} opacity={0.55} scale={12} blur={2.6} far={5} color="#000000" />

      <EffectComposer>
        <Bloom intensity={0.9} luminanceThreshold={0.55} luminanceSmoothing={0.32} mipmapBlur />
        <Vignette eskil={false} offset={0.28} darkness={0.72} />
      </EffectComposer>
    </Canvas>
  );
}
