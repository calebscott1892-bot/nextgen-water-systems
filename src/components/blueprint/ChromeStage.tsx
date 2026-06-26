"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

/**
 * The live chrome NGW-01 + the full POV journey, fused with the blueprint round
 * trip. ONE scalar (raw scroll progress p) drives everything:
 *   0.00–0.14  hero + slow orbit (move around the unit)
 *   0.14–0.30  settle to a front DOCK (held) — the SVG white-ink trace runs here
 *   0.30–0.42  blueprint hold (SVG plate covers; chrome mostly hidden)
 *   0.42–0.50  re-skin to chrome + re-centre/grow to full size
 *   0.50–0.62  rotate onto its SIDE so the lid/top faces the viewer
 *   0.62–0.76  camera flies THROUGH the top inlet, down the axis (housing fades)
 *   0.76–0.90  the column SPLITS APART (stages separate), camera pulls to 3/4
 *   0.90–1.00  reassemble + settle
 * Visuals are tuned on real hardware (R3F renders headless so frames screenshot).
 */
type Props = { progress: MutableRefObject<number>; active: boolean };

const ss = (x: number, a: number, b: number) => THREE.MathUtils.smoothstep(x, a, b);
const lerp = THREE.MathUtils.lerp;

/* ---- camera rail (pos + look target), keyed to p ---- */
type Key = { p: number; pos: [number, number, number]; tgt: [number, number, number] };
const CAM: Key[] = [
  { p: 0.0, pos: [2.6, -0.6, 8.8], tgt: [0, 0.3, 0] }, // hero
  { p: 0.06, pos: [4.8, 0.8, 7.2], tgt: [0, 0, 0] }, // orbit around
  { p: 0.1, pos: [0, 0.0, 8.2], tgt: [0, 0.3, 0] }, // front dock (trace)
  { p: 0.3, pos: [0, 0.0, 8.2], tgt: [0, 0.3, 0] }, // hold dock through the drawing
  { p: 0.4, pos: [0, 0.1, 8.4], tgt: [0, 0, 0] }, // chrome back, full size
  { p: 0.5, pos: [0, 0.2, 7.0], tgt: [0, 0, -1] }, // on its side, top toward us
  { p: 0.57, pos: [0, 0.05, 3.2], tgt: [0, 0, -2.5] }, // dive into the top — the chamber tints
  { p: 0.63, pos: [1.5, 0.5, 2.6], tgt: [0, 0, -0.3] }, // among the parting stages (media up close)
  { p: 0.72, pos: [6.0, 1.1, 5.6], tgt: [0, 0, 0] }, // pull back through the split
  { p: 0.8, pos: [9.2, 1.4, 4.0], tgt: [0, 0, 0] }, // arc out side-on — the split reads across
  { p: 0.88, pos: [9.6, 2.6, -2.2], tgt: [0, 0, 0] }, // orbit around the exploded assembly
  { p: 1.0, pos: [3.2, 0.4, 8.6], tgt: [0, 0.2, 0] }, // settle front, reassembled
];

function seg(p: number): [Key, Key] {
  for (let i = 0; i < CAM.length - 1; i++) if (p <= CAM[i + 1].p) return [CAM[i], CAM[i + 1]];
  return [CAM[CAM.length - 2], CAM[CAM.length - 1]];
}

function Rig({ progress }: { progress: MutableRefObject<number> }) {
  const { camera } = useThree();
  const tgt = useRef(new THREE.Vector3(0, 0.3, 0));
  useFrame(() => {
    const p = progress.current;
    const [a, b] = seg(p);
    const e = ss(THREE.MathUtils.clamp((p - a.p) / (b.p - a.p || 1), 0, 1), 0, 1);
    camera.position.set(lerp(a.pos[0], b.pos[0], e), lerp(a.pos[1], b.pos[1], e), lerp(a.pos[2], b.pos[2], e));
    tgt.current.set(lerp(a.tgt[0], b.tgt[0], e), lerp(a.tgt[1], b.tgt[1], e), lerp(a.tgt[2], b.tgt[2], e));
    camera.up.set(0, 1, 0);
    camera.lookAt(tgt.current);
  });
  return null;
}

const STAGES = [
  { y: -1.6, color: "#aab4bc" }, // sediment
  { y: -0.8, color: "#3c444c" }, // carbon (lifted off black so it reads)
  { y: 0.0, color: "#2b6a92" }, // RO membrane
  { y: 0.8, color: "#4f93b8" }, // post-carbon
  { y: 1.6, color: "#29c2ee" }, // re-mineralise
];

function ChromeColumn({ progress }: { progress: MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const housingMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const glassMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const stageRefs = useRef<(THREE.Group | null)[]>([]);
  const stageMatRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const topCap = useRef<THREE.Group>(null);
  const botCap = useRef<THREE.Group>(null);

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
    const g = group.current;
    const dock = ss(p, 0.04, 0.1); // settled to dock
    const reg = ss(p, 0.3, 0.4); // dock framing → full-size journey framing
    const onSide = ss(p, 0.4, 0.52); // rotate onto its side, lid toward viewer
    const through = ss(p, 0.52, 0.58) * (1 - ss(p, 0.62, 0.68)); // brief chamber tint on entry
    const ex = ss(p, 0.58, 0.82); // split apart (overlaps entry so parts are already parting)
    const reform = ss(p, 0.88, 0.98); // reassemble + right itself (solid before the end)
    const explode = ex * (1 - reform);

    if (g) {
      // registration offset/scale for the trace, released into the journey
      g.position.x = lerp(-0.71, 0, reg);
      g.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.03 * (1 - dock) * (1 - onSide);
      g.scale.setScalar(lerp(0.77, 1, reg));
      g.rotation.y = (1 - dock) * 0.5 + state.clock.elapsedTime * 0.05 * (1 - dock);
      g.rotation.x = (onSide - reform * onSide) * (Math.PI / 2); // on side, then right itself
    }

    // housing fades to a faint ghost to reveal the interior (kill the clearcoat/
    // env reflections too, or a low-alpha mirror still reads as solid chrome)
    const fade = ss(p, 0.5, 0.58) * (1 - ss(p, 0.88, 0.98));
    if (housingMat.current) {
      const m = housingMat.current;
      m.opacity = lerp(1, 0.06, fade);
      m.transparent = m.opacity < 0.995;
      m.depthWrite = m.opacity > 0.5;
      m.envMapIntensity = lerp(1.3, 0, fade);
      m.clearcoat = lerp(1, 0, fade);
      m.metalness = lerp(1, 0.15, fade);
    }
    if (glassMat.current) {
      const gm = glassMat.current;
      gm.opacity = lerp(0.9, 0.04, fade);
      gm.depthWrite = gm.opacity > 0.5;
    }

    // during the fly-through the stages turn translucent so the camera passes
    // down the bore and each chamber TINTS the view (a journey through, not a
    // wall of solid discs); opaque again for the readable exploded view
    stageMatRefs.current.forEach((m) => {
      if (m) {
        m.opacity = lerp(1, 0.32, through);
        m.transparent = m.opacity < 0.995;
        m.depthWrite = m.opacity > 0.5;
      }
    });

    // split the stack apart along the column axis (even, generous spacing)
    stageRefs.current.forEach((sg, i) => {
      if (sg) sg.position.y = STAGES[i].y + (i - 2) * explode * 1.2;
    });
    if (topCap.current) topCap.current.position.y = 2.52 + explode * 1.7;
    if (botCap.current) botCap.current.position.y = -2.05 - explode * 1.45;
  });

  return (
    <group ref={group}>
      <mesh geometry={housingGeo}>
        <meshPhysicalMaterial ref={housingMat} color="#aeb9c2" metalness={1} roughness={0.16} clearcoat={1} clearcoatRoughness={0.06} envMapIntensity={1.3} transparent opacity={1} />
      </mesh>

      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.42, 2.32, 0]} rotation={[0, 0, (s * Math.PI) / 2.4]}>
          <cylinderGeometry args={[0.12, 0.12, 0.5, 24]} />
          <meshPhysicalMaterial color="#9aa6af" metalness={1} roughness={0.3} />
        </mesh>
      ))}

      <mesh>
        <cylinderGeometry args={[0.82, 0.82, 3.6, 64, 1, true]} />
        <meshPhysicalMaterial ref={glassMat} color="#dff3fb" metalness={0} roughness={0.04} transmission={1} thickness={0.5} ior={1.45} transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>

      {STAGES.map((s, i) => (
        <group
          key={s.y}
          ref={(el) => {
            stageRefs.current[i] = el;
          }}
          position={[0, s.y, 0]}
        >
          <mesh>
            <cylinderGeometry args={[0.7, 0.7, 0.74, 40]} />
            <meshStandardMaterial
              ref={(el) => {
                stageMatRefs.current[i] = el;
              }}
              color={s.color}
              metalness={i === 2 || i === 4 ? 0.35 : 0.1}
              roughness={0.62}
              emissive={i === 4 ? "#0c4a61" : "#000000"}
              emissiveIntensity={i === 4 ? 0.25 : 0}
            />
          </mesh>
        </group>
      ))}

      <group ref={botCap} position={[0, -2.05, 0]}>
        <mesh>
          <cylinderGeometry args={[0.99, 0.99, 0.3, 96]} />
          <meshPhysicalMaterial color="#9aa6af" metalness={1} roughness={0.4} clearcoat={0.6} />
        </mesh>
      </group>
      <group ref={topCap} position={[0, 2.52, 0]}>
        <mesh>
          <cylinderGeometry args={[0.36, 0.36, 0.42, 64]} />
          <meshPhysicalMaterial color="#9aa6af" metalness={1} roughness={0.4} clearcoat={0.6} />
        </mesh>
      </group>

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
      camera={{ position: [0, 0, 8.8], fov: 38 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Environment preset="warehouse" environmentIntensity={0.85} />
      <ambientLight intensity={0.22} />
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
