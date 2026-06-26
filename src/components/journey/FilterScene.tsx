"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows, Html } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

type SceneProps = { progress: MutableRefObject<number>; active: boolean; beat: number };

/** Blueprint mode runs through the labelled deconstruction (beats 3–5). */
const isBlueprint = (beat: number) => beat >= 3 && beat <= 5;
const BP = "#1f5c8a"; // blueprint line colour

/* ---- camera path (beats 0–5), pulled back for natural product framing ---- */
type Key = { p: number; pos: [number, number, number]; tgt: [number, number, number]; roll: number };
const CAM: Key[] = [
  { p: 0.0, pos: [0, -1.6, 7.0], tgt: [0, 0.3, 0], roll: 0.015 },
  { p: 0.09, pos: [0.6, 0.4, 9.0], tgt: [0, 0, 0], roll: -0.012 },
  { p: 0.16, pos: [7.2, 1.4, 5.6], tgt: [0, 0, 0], roll: 0.025 },
  { p: 0.24, pos: [4.8, -1.8, -5.4], tgt: [0, 0, 0], roll: -0.02 }, // swing under/behind
  { p: 0.32, pos: [-6.6, 2.2, -3.0], tgt: [0, 0.3, 0], roll: 0.03 }, // far side, high
  { p: 0.4, pos: [0.0, 4.2, 4.0], tgt: [0, 0.4, 0], roll: 0.0 }, // over the top
  { p: 0.48, pos: [0.0, 0.4, 5.4], tgt: [0, 0, 0], roll: 0.0 }, // look into the axis
  { p: 0.56, pos: [6.4, 0.9, 6.6], tgt: [0, 0, 0], roll: -0.015 }, // 3/4, cross-section
  { p: 0.66, pos: [8.6, 2.6, 7.0], tgt: [0, 0.2, 0], roll: 0.018 }, // explode, wide
  { p: 0.74, pos: [6.8, 0.6, 8.4], tgt: [0, 0, 0], roll: -0.01 }, // settle exploded
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
    const e = (() => {
      const t = THREE.MathUtils.clamp((p - a.p) / span, 0, 1);
      return t * t * (3 - 2 * t);
    })();
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
    camera.rotateZ(THREE.MathUtils.lerp(a.roll, b.roll, e));
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
  const bp = isBlueprint(beat);
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
    return new THREE.LatheGeometry(pts, 96);
  }, []);

  useFrame((state) => {
    const p = progress.current;
    const ex = THREE.MathUtils.smoothstep(p, 0.6, 0.74);
    if (group.current) {
      group.current.rotation.y = p * Math.PI * 0.35 + state.clock.elapsedTime * 0.04;
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.03 * (1 - ex);
    }
    if (housingMat.current) {
      const reveal = THREE.MathUtils.smoothstep(p, 0.3, 0.38) - THREE.MathUtils.smoothstep(p, 0.46, 0.52);
      const op = (1 - reveal * 0.8) * (1 - ex * 0.85);
      housingMat.current.opacity = op;
      housingMat.current.transparent = op < 0.995;
    }
    if (glassMat.current) glassMat.current.opacity = (bp ? 0.4 : 0.9) * (1 - ex);
    clip.constant = THREE.MathUtils.lerp(2.0, 0.0, THREE.MathUtils.smoothstep(p, 0.48, 0.6) * (1 - ex));
    stageRefs.current.forEach((g, i) => {
      if (g) g.position.y = STAGES[i].y + (i - 2) * ex * 1.05;
    });
    if (topCap.current) topCap.current.position.y = 2.52 + ex * 1.6;
    if (botCap.current) botCap.current.position.y = -2.05 - ex * 1.2;
  });

  return (
    <group ref={group}>
      <mesh geometry={housingGeo}>
        <meshPhysicalMaterial
          ref={housingMat}
          color={bp ? BP : "#aeb9c2"}
          metalness={bp ? 0 : 1}
          roughness={bp ? 1 : 0.16}
          clearcoat={bp ? 0 : 1}
          clearcoatRoughness={0.06}
          envMapIntensity={1.3}
          wireframe={bp}
          clippingPlanes={[clip]}
          clipShadows
        />
      </mesh>

      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.42, 2.32, 0]} rotation={[0, 0, (s * Math.PI) / 2.4]}>
          <cylinderGeometry args={[0.12, 0.12, 0.5, 24]} />
          <meshPhysicalMaterial color={bp ? BP : "#9aa6af"} metalness={bp ? 0 : 1} roughness={bp ? 1 : 0.3} wireframe={bp} />
        </mesh>
      ))}

      <mesh>
        <cylinderGeometry args={[0.82, 0.82, 3.6, 64, 1, true]} />
        <meshPhysicalMaterial
          ref={glassMat}
          color={bp ? BP : "#dff3fb"}
          metalness={0}
          roughness={bp ? 1 : 0.04}
          transmission={bp ? 0 : 1}
          thickness={0.5}
          ior={1.45}
          transparent
          opacity={0.9}
          wireframe={bp}
          side={THREE.DoubleSide}
        />
      </mesh>

      {STAGES.map((s, i) => (
        <group
          key={s.n}
          ref={(el) => {
            stageRefs.current[i] = el;
          }}
          position={[0, s.y, 0]}
        >
          <mesh>
            <cylinderGeometry args={[0.7, 0.7, 0.74, 40]} />
            <meshStandardMaterial
              color={bp ? BP : s.color}
              metalness={bp ? 0 : i === 2 || i === 4 ? 0.35 : 0.1}
              roughness={bp ? 1 : 0.62}
              emissive={!bp && i === 4 ? "#0c4a61" : "#000000"}
              emissiveIntensity={!bp && i === 4 ? 0.25 : 0}
              wireframe={bp}
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

      <group ref={botCap} position={[0, -2.05, 0]}>
        <mesh>
          <cylinderGeometry args={[0.99, 0.99, 0.3, 96]} />
          <meshPhysicalMaterial color={bp ? BP : "#9aa6af"} metalness={bp ? 0 : 1} roughness={bp ? 1 : 0.4} clearcoat={bp ? 0 : 0.6} wireframe={bp} />
        </mesh>
      </group>
      <group ref={topCap} position={[0, 2.52, 0]}>
        <mesh>
          <cylinderGeometry args={[0.36, 0.36, 0.42, 64]} />
          <meshPhysicalMaterial color={bp ? BP : "#9aa6af"} metalness={bp ? 0 : 1} roughness={bp ? 1 : 0.4} clearcoat={bp ? 0 : 0.6} wireframe={bp} />
        </mesh>
      </group>

      <mesh position={[0, -1.34, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.99, 0.018, 14, 96]} />
        <meshStandardMaterial color={bp ? BP : "#29c2ee"} emissive={bp ? "#000000" : "#29c2ee"} emissiveIntensity={bp ? 0 : 0.9} toneMapped={false} wireframe={bp} />
      </mesh>
    </group>
  );
}

export default function FilterScene({ progress, active, beat }: SceneProps) {
  const bp = isBlueprint(beat);
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 2]}
      camera={{ position: [0, 0, 8], fov: 36 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Environment preset="warehouse" environmentIntensity={bp ? 0.05 : 0.85} />
      <ambientLight intensity={bp ? 0.9 : 0.2} />
      <directionalLight position={[4, 6, 5]} intensity={bp ? 0.4 : 1.0} color="#eaf6ff" />
      <directionalLight position={[-5, 1, -3]} intensity={bp ? 0 : 0.35} color="#29c2ee" />

      <FilterModel progress={progress} beat={beat} />
      <Rig progress={progress} />

      <ContactShadows position={[0, -2.3, 0]} opacity={bp ? 0 : 0.5} scale={13} blur={2.8} far={5} color="#000000" />

      <EffectComposer>
        <Bloom intensity={bp ? 0 : 0.32} luminanceThreshold={0.6} luminanceSmoothing={0.3} mipmapBlur />
        <Vignette eskil={false} offset={0.3} darkness={bp ? 0.3 : 0.7} />
      </EffectComposer>
    </Canvas>
  );
}
