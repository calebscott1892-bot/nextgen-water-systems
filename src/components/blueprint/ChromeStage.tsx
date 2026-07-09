"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows, Html } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { asset } from "@/lib/asset";

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

// DEV forensic (?hide=a,b,c): knock out scene elements to bisect a rogue frame.
// Inert in normal use.
const HIDE: string[] =
  typeof window !== "undefined"
    ? (new URLSearchParams(window.location.search).get("hide") || "").split(",").filter(Boolean)
    : [];
const hidden = (k: string) => HIDE.includes(k);

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

/** DEV forensic (?dbgray): raycast from screen centre and log what's actually
 *  in front of the camera — for diagnosing "mystery surface" frames. */
function DebugRay() {
  const { camera, scene } = useThree();
  const done = useRef(false);
  useFrame((state) => {
    if (done.current || state.clock.elapsedTime < 3) return;
    done.current = true;
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0, 0), camera);
    const hits = ray.intersectObjects(scene.children, true);
    // eslint-disable-next-line no-console
    console.log(
      "DBGRAY",
      JSON.stringify(
        hits.slice(0, 8).map((h) => {
          const o = h.object as THREE.Mesh;
          const geo = o.geometry as THREE.BufferGeometry & { type?: string; parameters?: Record<string, unknown> };
          const mat = (Array.isArray(o.material) ? o.material[0] : o.material) as THREE.MeshStandardMaterial | undefined;
          return {
            d: +h.distance.toFixed(2),
            g: geo?.type,
            p: geo?.parameters ? JSON.stringify(geo.parameters).slice(0, 60) : "",
            op: mat?.opacity,
            t: mat?.transparent,
            c: mat?.color?.getHexString?.(),
          };
        }),
      ),
    );
  });
  return null;
}

/** Studio lights that DIM during the interior dive — directionals have no
 *  shadows, so without this they flood the vessel interior and five stacked
 *  translucent stages wash out to milk. Inside a sealed steel vessel it should
 *  be dark: the cyan bore-glow becomes the only meaningful source. */
function JourneyLights({ progress }: { progress: MutableRefObject<number> }) {
  const amb = useRef<THREE.AmbientLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const { scene } = useThree();
  useFrame(() => {
    const p = progress.current;
    const through = ss(p, 0.52, 0.58) * (1 - ss(p, 0.66, 0.72));
    const dimmed = 1 - through * 0.82;
    if (amb.current) amb.current.intensity = 0.12 * dimmed;
    if (key.current) key.current.intensity = 0.85 * dimmed;
    if (rim.current) rim.current.intensity = 0.6 * dimmed;
    if (fill.current) fill.current.intensity = 0.22 * dimmed;
    // the ONE global knob that actually kills the interior wash: HDR softboxes
    // in the env map are tens of units bright, so even tiny per-material
    // envMapIntensity residues re-light the ghosted stack. Kill env globally
    // inside the vessel; everything restores on the pull-out.
    scene.environmentIntensity = 0.82 * (1 - through * 0.97);
  });
  return (
    <>
      <ambientLight ref={amb} intensity={0.12} />
      {/* warm key for form; two cyan rims rake the edges as brand accent */}
      <directionalLight ref={key} position={[4, 6, 5]} intensity={0.85} color="#eaf6ff" />
      <directionalLight ref={rim} position={[-5.5, 1.5, -3]} intensity={0.6} color="#29c2ee" />
      <directionalLight ref={fill} position={[-1.5, -1, 4.5]} intensity={0.22} color="#7fd8f5" />
    </>
  );
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
  const topCapMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const botCapMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const ringMat = useRef<THREE.MeshStandardMaterial>(null);
  const boreLight = useRef<THREE.PointLight>(null);
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

  // brushed-grain bump — hairline vertical strokes of varying strength give the
  // steel a tactile machined grain (light catches individual brush lines). Kept
  // as a classic bumpMap (cheap, universally supported — no anisotropy ext).
  const bumpMap = useMemo(() => {
    if (typeof document === "undefined") return null;
    const s = 512;
    const cv = document.createElement("canvas");
    cv.width = cv.height = s;
    const g = cv.getContext("2d");
    if (!g) return null;
    g.fillStyle = "#808080"; // neutral height
    g.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x++) {
      if (Math.random() < 0.6) {
        const tone = 128 + (Math.random() - 0.5) * 44; // ±22 around neutral
        g.globalAlpha = 0.25 + Math.random() * 0.5;
        g.strokeStyle = `rgb(${tone | 0},${tone | 0},${tone | 0})`;
        g.beginPath();
        const seg0 = Math.random() * s * 0.5;
        g.moveTo(x + 0.5, seg0);
        g.lineTo(x + 0.5, seg0 + s * (0.3 + Math.random() * 0.7));
        g.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 4);
    tex.anisotropy = 4;
    return tex;
  }, []);

  useFrame((state) => {
    const p = progress.current;
    const g = group.current;
    const dock = ss(p, 0.04, 0.1); // settled to dock (spin stops BEFORE the trace)
    const reg = ss(p, 0.33, 0.42); // dock framing → journey framing (after the plate exits)
    const onSide = ss(p, 0.42, 0.52); // rotate onto its side, lid toward viewer
    const through = ss(p, 0.52, 0.58) * (1 - ss(p, 0.66, 0.72)); // interior-pass window
    const ex = ss(p, 0.58, 0.82); // split apart (parts already parting as the camera arrives)
    const reform = ss(p, 0.88, 0.98); // reassemble + right itself
    const explode = ex * (1 - reform);

    const wantLabels = explode > 0.4;
    if (wantLabels !== labelsOn) setLabelsOn(wantLabels);

    // interior bore-glow — ignites only for the on-axis dive so the chambers
    // read as a lit passage instead of a black void, with a soft breath
    if (boreLight.current) {
      const breathe = 1 + Math.sin(state.clock.elapsedTime * 2.1) * 0.12;
      boreLight.current.intensity = through * 0.3 * breathe;
    }
    // the ring's HDR bloom (mipmapBlur) floods the whole frame with a pale wash
    // once the camera is inside it — dim it to a line for the interior pass
    if (ringMat.current) ringMat.current.emissiveIntensity = lerp(1.6, 0.18, through);

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
      // transmission ignores opacity — with the camera INSIDE the sleeve during
      // the dive, the transmission pass resamples the bright scene into a milky
      // wash no matter how low opacity goes. The camera is inside the sleeve
      // anyway, so simply hide it for the interior pass.
      gm.visible = through < 0.5;
    }
    kitMats.current.forEach((m) => {
      m.opacity = lerp(1, 0.05, fade);
      m.transparent = m.opacity < 0.995;
      m.depthWrite = m.opacity > 0.5;
      // the ghosted kit must stop catching the softbox too — the clamp band's
      // env-lit inner face otherwise glows around the camera during the dive
      const mm = m as unknown as THREE.MeshStandardMaterial & { userData: { baseEnv?: number } };
      if (mm.envMapIntensity !== undefined) {
        mm.userData.baseEnv ??= mm.envMapIntensity;
        mm.envMapIntensity = lerp(mm.userData.baseEnv, 0.05, fade);
      }
    });

    // the caps ghost ONLY through the dive window — the camera flies toward the
    // base cap, which otherwise dead-ends the bore as an opaque env-lit disc.
    // through→0 by the pull-back, so the explode beat gets solid flying caps.
    [topCapMat.current, botCapMat.current].forEach((m) => {
      if (m) {
        m.opacity = lerp(1, 0.05, through);
        m.depthWrite = m.opacity > 0.5;
        m.envMapIntensity = lerp(CAPS.envMapIntensity, 0.08, through);
      }
    });

    // fly-through: stages go translucent AND drop their studio-env reflection —
    // otherwise the bright softbox washes the near puck into a pale disc. Dark,
    // cyan-lit chambers read as a passage instead.
    stageMatRefs.current.forEach((m, i) => {
      if (m) {
        m.opacity = lerp(1, 0.3, through);
        m.depthWrite = m.opacity > 0.5;
        m.envMapIntensity = lerp(1, 0.06, through);
        m.color.set(STAGES[i].color).multiplyScalar(1 - through * 0.7);
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
      {/* interior bore-glow (fly-through only — intensity driven in useFrame) */}
      {!hidden("borelight") && (
        <pointLight ref={boreLight} position={[0, 0.2, 0]} color="#29c2ee" intensity={0} distance={2.2} decay={2} />
      )}

      {/* housing shell */}
      <mesh geometry={housingGeo} visible={!hidden("housing")}>
        <meshPhysicalMaterial
          ref={housingMat}
          {...STEEL}
          roughnessMap={roughMap ?? undefined}
          bumpMap={bumpMap ?? undefined}
          bumpScale={0.012}
          transparent
          opacity={1}
        />
      </mesh>

      {/* glass sleeve (revealed as the shell ghosts) */}
      <mesh>
        <cylinderGeometry args={[0.82, 0.82, 3.6, 64, 1, true]} />
        <meshPhysicalMaterial ref={glassMat} color="#dff3fb" metalness={0} roughness={0.04} transmission={1} thickness={0.5} ior={1.45} transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>

      {KIT_BODY && !hidden("kit") && (
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
      {!hidden("stages") &&
      STAGES.map((s, i) => (
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
              transparent
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
          <meshPhysicalMaterial ref={botCapMat} {...CAPS} transparent /></mesh>
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
          <meshPhysicalMaterial ref={topCapMat} {...CAPS} transparent />
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
      <mesh position={[0, -1.6, 0]} rotation={[Math.PI / 2, 0, 0]} visible={!hidden("ring")}>
        <torusGeometry args={[0.99, 0.018, 14, 96]} />
        <meshStandardMaterial ref={ringMat} color="#29c2ee" emissive="#29c2ee" emissiveIntensity={1.6} toneMapped={false} />
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
      // OPAQUE canvas: blending transparent chrome/stage layers against an
      // alpha framebuffer and letting the BROWSER composite produces the classic
      // milky wash (alpha mismatch, worst during the ghosted fly-through). The
      // canvas sits UNDER the SVG plate, so it can own its dark studio backdrop.
      gl={{ alpha: false, antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.98;
        gl.setClearColor("#0a121b", 1);
        scene.background = new THREE.Color("#0a121b");
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      {/* Studio HDRI softbox reflections — clean, product-photography chrome, and
          (unlike an in-scene Lightformer bake) it renders reliably on real GPUs.
          SELF-HOSTED (public/hdri) so the 3D never depends on a third-party CDN.
          ACES tone-mapping + refined metal + directional cyan brand rims do the
          rest. The SVG plate is the no-WebGL / reduced-motion fallback. */}
      <Environment files={asset("/hdri/studio_small_03_1k.hdr")} environmentIntensity={0.82} />

      <JourneyLights progress={progress} />

      <ChromeColumn progress={progress} />
      <Rig progress={progress} />
      {typeof window !== "undefined" && window.location.search.includes("dbgray") && <DebugRay />}

      {!hidden("shadows") && (
        <ContactShadows position={[0, -2.38, 0]} opacity={0.55} scale={13} blur={3} far={5} color="#000000" />
      )}

      {!hidden("post") && (
        <EffectComposer>
          <Bloom intensity={0.42} luminanceThreshold={0.82} luminanceSmoothing={0.28} mipmapBlur />
          <Vignette eskil={false} offset={0.26} darkness={0.55} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
