"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows, Html } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";

/**
 * The live NGW-01 + the full POV journey, fused with the blueprint round trip.
 * ONE scalar (raw scroll progress p) drives everything:
 *   0.00–0.10  hero + slow orbit (move around the unit)
 *   0.10–0.33  front DOCK (held) — the SVG white-ink trace + plate run here
 *   0.33–0.42  re-skin to chrome + re-centre/grow to full size
 *   0.42–0.52  rotate onto its SIDE so the lid/top faces the viewer
 *   0.52–0.68  camera dives ON-AXIS down the bore; housing ghosts; stages part
 *   0.68–0.88  the labelled exploded assembly, side-on orbit
 *   0.88–1.00  reassemble + settle
 *
 * The asset is a designed product: conical-shoulder crown + threaded inlet, a
 * cyan level-gauge sight window, sanitary clamp band, an asymmetric bypass
 * valve, drain valve + plinth feet, etch plate. Body-mounted kit fades with the
 * housing ghost; crown/base kit explodes with its cap.
 */
type Props = { progress: MutableRefObject<number>; active: boolean };

// engineered detail kit (gauge, clamp band, bypass, drain, feet, crown, plate)
const KIT_BODY = true;
const KIT_CAPS = false;

const ss = (x: number, a: number, b: number) => THREE.MathUtils.smoothstep(x, a, b);
const lerp = THREE.MathUtils.lerp;

/* ---- camera rail (pos + look target), keyed to p ---- */
type Key = { p: number; pos: [number, number, number]; tgt: [number, number, number] };
const CAM: Key[] = [
  { p: 0.0, pos: [2.6, -0.6, 8.8], tgt: [0, 0.3, 0] }, // hero
  { p: 0.06, pos: [4.8, 0.8, 7.2], tgt: [0, 0, 0] }, // orbit around
  { p: 0.1, pos: [0, 0.0, 8.2], tgt: [0, 0.3, 0] }, // front dock (trace)
  { p: 0.33, pos: [0, 0.0, 8.2], tgt: [0, 0.3, 0] }, // hold dock until the plate fully exits
  { p: 0.42, pos: [0, 0.1, 8.4], tgt: [0, 0, 0] }, // chrome back, full size
  { p: 0.5, pos: [0, 0.2, 7.0], tgt: [0, 0, -1] }, // on its side, top toward us
  { p: 0.57, pos: [0, 0.05, 3.2], tgt: [0, 0, -2.5] }, // dive into the top — the chamber tints
  { p: 0.63, pos: [0, 0.12, 0.6], tgt: [0, 0, -2.5] }, // ON-AXIS down the bore, chambers passing
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
    const t = THREE.MathUtils.clamp((p - a.p) / (b.p - a.p || 1), 0, 1);
    // linear through interior keys (scrub already smooths); cushion only the
    // dock arrival and the final settle — kills the velocity hitch at every key
    const e = b.p === 0.1 || b.p === 1.0 ? ss(t, 0, 1) : t;
    camera.position.set(lerp(a.pos[0], b.pos[0], e), lerp(a.pos[1], b.pos[1], e), lerp(a.pos[2], b.pos[2], e));
    tgt.current.set(lerp(a.tgt[0], b.tgt[0], e), lerp(a.tgt[1], b.tgt[1], e), lerp(a.tgt[2], b.tgt[2], e));
    camera.up.set(0, 1, 0);
    camera.lookAt(tgt.current);
    // subtle dolly-zoom "breath" — the lens pushes in through the on-axis dive
    const cam = camera as THREE.PerspectiveCamera;
    const dive = ss(p, 0.5, 0.62) * (1 - ss(p, 0.66, 0.74));
    const fov = 38 - dive * 7;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
  });
  return null;
}

const STAGES = [
  { y: -1.6, color: "#aab4bc", n: "01", title: "Sediment", sub: "20µm pre-filter*" },
  { y: -0.8, color: "#3c444c", n: "02", title: "Carbon block", sub: "chlorine · taste*" },
  { y: 0.0, color: "#2b6a92", n: "03", title: "RO membrane", sub: "lead · PFAS*" },
  { y: 0.8, color: "#4f93b8", n: "04", title: "Post-carbon", sub: "final polish*" },
  { y: 1.6, color: "#29c2ee", n: "05", title: "Re-mineralise", sub: "balanced pH*" },
];

/* material recipes — one story: brushed steel body, dark machined accents.
   Tuned for the bespoke Lightformer studio: crisper reflections, full
   clearcoat, a whisper of vertical anisotropy to sell the brushed grain. */
const STEEL = { color: "#b1bcc6", metalness: 1, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.09, envMapIntensity: 1.3 } as const;
const CAPS = { color: "#828d97", metalness: 1, roughness: 0.27, clearcoat: 0.65, clearcoatRoughness: 0.2, envMapIntensity: 1.3 } as const;
const MACHINED = { color: "#2b333b", metalness: 0.95, roughness: 0.42, envMapIntensity: 1.05 } as const;

function ChromeColumn({ progress }: { progress: MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const housingMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const glassMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const stageRefs = useRef<(THREE.Group | null)[]>([]);
  const stageMatRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const kitMats = useRef<(THREE.Material & { opacity: number; transparent: boolean; depthWrite: boolean })[]>([]);
  const topCap = useRef<THREE.Group>(null);
  const botCap = useRef<THREE.Group>(null);
  const [labelsOn, setLabelsOn] = useState(false);

  const kitMat = (el: THREE.Material | null) => {
    if (el && !kitMats.current.includes(el as never)) kitMats.current.push(el as never);
  };

  const housingGeo = useMemo(() => {
    // KNOWN-GOOD committed profile. Do NOT reprofile this lathe casually: two
    // separate attempts (exact duplicate corner points, and a micro-chamfered
    // conical-crown variant) both blanked the ENTIRE frame deterministically in
    // every browser — bisected to this array alone. Root cause unresolved;
    // investigate in isolation before touching these points again.
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

  // procedural micro-roughness — the biggest realism lever: real steel is never a
  // perfect mirror. Fine grayscale noise + faint vertical brush streaks break the
  // reflection into physical brushed metal (multiplies the roughness scalar).
  const roughMap = useMemo(() => {
    if (typeof document === "undefined") return null;
    const s = 512;
    const cv = document.createElement("canvas");
    cv.width = cv.height = s;
    const g = cv.getContext("2d");
    if (!g) return null;
    const img = g.createImageData(s, s);
    for (let i = 0; i < s * s; i++) {
      const v = 168 + Math.floor(Math.random() * 66); // ~0.66–0.92
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    g.globalAlpha = 0.045;
    g.strokeStyle = "#d2d2d2";
    for (let x = 0; x < s; x++)
      if (Math.random() < 0.22) {
        g.beginPath();
        g.moveTo(x + 0.5, 0);
        g.lineTo(x + 0.5, s);
        g.stroke();
      }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 6);
    tex.anisotropy = 4;
    return tex;
  }, []);

  useFrame((state) => {
    const p = progress.current;
    const g = group.current;
    const dock = ss(p, 0.04, 0.1); // settled to dock (spin stops BEFORE the trace)
    const reg = ss(p, 0.33, 0.42); // dock framing → journey framing (after the plate exits)
    const onSide = ss(p, 0.42, 0.52); // rotate onto its side, lid toward viewer
    const through = ss(p, 0.52, 0.58) * (1 - ss(p, 0.66, 0.72)); // chambers stay see-through until the pull-back
    const ex = ss(p, 0.58, 0.82); // split apart (parts already parting as the camera arrives)
    const reform = ss(p, 0.88, 0.98); // reassemble + right itself
    const explode = ex * (1 - reform);

    const wantLabels = explode > 0.4;
    if (wantLabels !== labelsOn) setLabelsOn(wantLabels);

    if (g) {
      g.position.x = lerp(-0.71, 0, reg);
      g.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.03 * (1 - dock) * (1 - onSide);
      g.scale.setScalar(lerp(0.77, 1, reg));
      g.rotation.y = (1 - dock) * 0.5 + state.clock.elapsedTime * 0.05 * (1 - dock);
      g.rotation.x = (onSide - reform * onSide) * (Math.PI / 2);
    }

    // hold solid chrome until the camera is committed to the inlet
    const fade = ss(p, 0.55, 0.63) * (1 - ss(p, 0.88, 0.98));
    if (housingMat.current) {
      const m = housingMat.current;
      m.opacity = lerp(1, 0.06, fade);
      m.transparent = m.opacity < 0.995;
      m.depthWrite = m.opacity > 0.5;
      m.envMapIntensity = lerp(STEEL.envMapIntensity, 0, fade);
      m.clearcoat = lerp(STEEL.clearcoat, 0, fade);
      m.metalness = lerp(1, 0.15, fade);
    }
    if (glassMat.current) {
      const gm = glassMat.current;
      gm.opacity = lerp(0.9, 0.04, fade);
      gm.depthWrite = gm.opacity > 0.5;
    }
    kitMats.current.forEach((m) => {
      m.opacity = lerp(1, 0.05, fade);
      m.transparent = m.opacity < 0.995;
      m.depthWrite = m.opacity > 0.5;
    });

    // fly-through: stages go translucent so each chamber tints the pass
    stageMatRefs.current.forEach((m) => {
      if (m) {
        m.opacity = lerp(1, 0.32, through);
        m.transparent = m.opacity < 0.995;
        m.depthWrite = m.opacity > 0.5;
      }
    });

    // split the stack apart along the column axis; caps travel FURTHER than the
    // outermost stages (±1.6 + 2·1.2 spread) so the stack never interpenetrates
    stageRefs.current.forEach((sg, i) => {
      if (sg) sg.position.y = STAGES[i].y + (i - 2) * explode * 1.2;
    });
    if (topCap.current) topCap.current.position.y = 2.52 + explode * 2.4;
    if (botCap.current) botCap.current.position.y = -2.05 - explode * 2.9;
  });

  return (
    <group ref={group}>
      {/* housing shell */}
      <mesh geometry={housingGeo}>
        <meshPhysicalMaterial ref={housingMat} {...STEEL} roughnessMap={roughMap ?? undefined} transparent opacity={1} />
      </mesh>

      {/* glass sleeve (revealed as the shell ghosts) */}
      <mesh>
        <cylinderGeometry args={[0.82, 0.82, 3.6, 64, 1, true]} />
        <meshPhysicalMaterial ref={glassMat} color="#dff3fb" metalness={0} roughness={0.04} transmission={1} thickness={0.5} ior={1.45} transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>

      {KIT_BODY && (
        <>
          {/* ── body-mounted kit (fades with the shell) ── */}
          {/* level-gauge sight window: dark inset + glowing cyan gauge bar */}
          <group rotation={[0, 0.12, 0]}>
            <mesh rotation={[0, -0.26, 0]}>
              <cylinderGeometry args={[0.925, 0.925, 1.9, 24, 1, true, -0.26, 0.52]} />
              <meshStandardMaterial ref={kitMat} color="#10161c" metalness={0.6} roughness={0.55} side={THREE.DoubleSide} transparent />
            </mesh>
            <mesh position={[0, -0.1, 0.94]}>
              <boxGeometry args={[0.05, 1.55, 0.02]} />
              <meshStandardMaterial ref={kitMat} color="#29c2ee" emissive="#29c2ee" emissiveIntensity={0.75} toneMapped={false} transparent />
            </mesh>
            {[-0.6, -0.2, 0.2, 0.6].map((y) => (
              <mesh key={y} position={[0.09, y, 0.935]}>
                <boxGeometry args={[0.07, 0.012, 0.015]} />
                <meshStandardMaterial ref={kitMat} color="#9fb4c2" metalness={0.4} roughness={0.5} transparent />
              </mesh>
            ))}
          </group>

          {/* sanitary clamp band + bolts at the waist */}
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.945, 0.945, 0.13, 96]} />
            <meshPhysicalMaterial ref={kitMat} {...CAPS} transparent />
          </mesh>
          {[0.9, 3.0, 5.1].map((a) => (
            <mesh key={a} position={[Math.sin(a) * 0.96, 0.02, Math.cos(a) * 0.96]} rotation={[0, a, Math.PI / 2]}>
              <cylinderGeometry args={[0.035, 0.035, 0.16, 12]} />
              <meshStandardMaterial ref={kitMat} {...MACHINED} transparent />
            </mesh>
          ))}

          {/* bypass valve assembly (one side — deliberate asymmetry) */}
          <group position={[0.92, 1.66, 0]} rotation={[0, 0, Math.PI / 2]}>
            <mesh>
              <cylinderGeometry args={[0.1, 0.1, 0.55, 24]} />
              <meshPhysicalMaterial ref={kitMat} {...CAPS} transparent />
            </mesh>
            <mesh position={[0, -0.34, 0]}>
              <sphereGeometry args={[0.15, 24, 18]} />
              <meshStandardMaterial ref={kitMat} {...MACHINED} transparent />
            </mesh>
            <mesh position={[0, -0.34, 0.16]} rotation={[0.35, 0, 0]}>
              <boxGeometry args={[0.055, 0.055, 0.3]} />
              <meshStandardMaterial ref={kitMat} color="#29c2ee" metalness={0.3} roughness={0.4} transparent />
            </mesh>
          </group>

          {/* serial etch plate (back-left clock) */}
          <mesh position={[Math.sin(2.5) * 0.905, 0.95, Math.cos(2.5) * 0.905]} rotation={[0, 2.5, 0]}>
            <boxGeometry args={[0.42, 0.26, 0.015]} />
            <meshStandardMaterial ref={kitMat} color="#8a949c" metalness={0.8} roughness={0.45} transparent />
          </mesh>
        </>
      )}

      {/* ── media stages ── */}
      {STAGES.map((s, i) => (
        <group
          key={s.y}
          ref={(el) => {
            stageRefs.current[i] = el;
          }}
          position={[0, s.y, 0]}
        >
          <mesh>
            <cylinderGeometry args={[0.7, 0.7, 0.74, 64]} />
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
          <Html position={[0, 0, -1.05]} center zIndexRange={[12, 0]} className="stage-label-wrap">
            <div className={`stage-label ${labelsOn ? "on" : ""}`.trim()}>
              <span className="sl-n">{s.n}</span>
              <span className="sl-t">{s.title}</span>
              <span className="sl-s">{s.sub}</span>
            </div>
          </Html>
        </group>
      ))}

      {/* ── base assembly (explodes with the bottom cap) ── */}
      <group ref={botCap} position={[0, -2.05, 0]}>
        <mesh>
          <cylinderGeometry args={[0.99, 0.99, 0.3, 96]} />
          <meshPhysicalMaterial {...CAPS} />
        </mesh>
        {KIT_CAPS && (
          <>
            <mesh position={[0, -0.18, 0]}>
              <cylinderGeometry args={[1.04, 1.06, 0.07, 96]} />
              <meshStandardMaterial {...MACHINED} />
            </mesh>
            {[0.5, 2.6, 4.7].map((a) => (
              <mesh key={a} position={[Math.sin(a) * 0.72, -0.27, Math.cos(a) * 0.72]}>
                <cylinderGeometry args={[0.09, 0.11, 0.1, 16]} />
                <meshStandardMaterial {...MACHINED} />
              </mesh>
            ))}
            <group position={[0.98, 0.02, 0.3]} rotation={[0, 0.3, Math.PI / 2]}>
              <mesh>
                <cylinderGeometry args={[0.06, 0.06, 0.3, 16]} />
                <meshStandardMaterial {...MACHINED} />
              </mesh>
              <mesh position={[0, -0.18, 0]} rotation={[0, 0, 0.9]}>
                <boxGeometry args={[0.04, 0.22, 0.05]} />
                <meshStandardMaterial color="#9aa6af" metalness={0.8} roughness={0.35} />
              </mesh>
            </group>
          </>
        )}
      </group>

      {/* ── crown assembly (explodes with the top cap) ── */}
      <group ref={topCap} position={[0, 2.52, 0]}>
        <mesh>
          <cylinderGeometry args={[0.36, 0.36, 0.42, 64]} />
          <meshPhysicalMaterial {...CAPS} />
        </mesh>
        {KIT_CAPS && (
          <>
            <mesh position={[0, -0.16, 0]}>
              <cylinderGeometry args={[0.46, 0.5, 0.15, 64]} />
              <meshStandardMaterial {...MACHINED} />
            </mesh>
            {[0.09, -0.05].map((y) => (
              <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.365, 0.016, 8, 64]} />
                <meshStandardMaterial {...MACHINED} />
              </mesh>
            ))}
            <mesh position={[0, 0.32, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 0.26, 32]} />
              <meshPhysicalMaterial {...CAPS} />
            </mesh>
            {[0.26, 0.32, 0.38].map((y) => (
              <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.155, 0.008, 6, 32]} />
                <meshStandardMaterial {...MACHINED} />
              </mesh>
            ))}
            <mesh position={[0.24, 0.14, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.045, 0.045, 0.14, 12]} />
              <meshStandardMaterial {...MACHINED} />
            </mesh>
          </>
        )}
      </group>

      {/* cyan diffusion ring — SEATED into the lower flange band (an engineered
          inset, not a floating hoop), and the ONLY thing that blooms */}
      <mesh position={[0, -1.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.99, 0.018, 14, 96]} />
        <meshStandardMaterial color="#29c2ee" emissive="#29c2ee" emissiveIntensity={1.6} toneMapped={false} />
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
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.98;
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      {/* Studio HDRI softbox reflections — clean, product-photography chrome, and
          (unlike an in-scene Lightformer bake) it renders reliably on real GPUs.
          ACES tone-mapping + refined metal + directional cyan brand rims do the
          rest. The SVG plate is the no-WebGL / reduced-motion fallback. */}
      <Environment preset="studio" environmentIntensity={0.82} />

      <ambientLight intensity={0.12} />
      {/* warm key for form; two cyan rims rake the edges as brand accent */}
      <directionalLight position={[4, 6, 5]} intensity={0.85} color="#eaf6ff" />
      <directionalLight position={[-5.5, 1.5, -3]} intensity={0.6} color="#29c2ee" />
      <directionalLight position={[-1.5, -1, 4.5]} intensity={0.22} color="#7fd8f5" />

      <ChromeColumn progress={progress} />
      <Rig progress={progress} />

      <ContactShadows position={[0, -2.38, 0]} opacity={0.55} scale={13} blur={3} far={5} color="#000000" />

      <EffectComposer>
        <Bloom intensity={0.42} luminanceThreshold={0.82} luminanceSmoothing={0.28} mipmapBlur />
        <Vignette eskil={false} offset={0.26} darkness={0.55} />
      </EffectComposer>
    </Canvas>
  );
}
