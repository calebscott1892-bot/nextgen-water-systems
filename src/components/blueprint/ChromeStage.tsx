"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows, Html } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { asset } from "@/lib/asset";

/**
 * THE REAL MACHINE — NGW-01 as it actually is: three 20″×4.5″ vessels on a
 * bracket/manifold, plumbed in series (Clear2O FHWR-3SI-20 architecture, no RO),
 * rendered in the brand's brushed-steel language. ONE scalar (journey progress p)
 * drives everything:
 *   0.00–0.10  hero + slow drift (meet the assembly)
 *   0.10–0.33  front DOCK (held) — the SVG white-ink trace + plate run here
 *   0.33–0.44  re-frame, approach vessel 1
 *   0.44–0.74  THE WATER RUN — visit V1 → V2 → V3; each sump ghosts in turn to
 *              reveal its cartridge; flow guides read the true radial path
 *              (down the annulus → in through the media wall → up the core)
 *   0.74–0.90  pull back + service EXPLODE: heads lift, cartridges rise, labels
 *   0.90–1.00  reassemble + settle
 *
 * Stage order per the client's spec sheet: 1 graded sediment → 2 KDF 55/85 +
 * coconut carbon (the redox bed) → 3 limescale-reduction carbon.
 */
type Props = { progress: MutableRefObject<number>; active: boolean };

// DEV forensic (?nghide=a,b,c): knock out scene elements to bisect a rogue
// frame. Namespaced key so real-world query params can't collide; inert
// in normal use.
const HIDE: string[] =
  typeof window !== "undefined"
    ? (new URLSearchParams(window.location.search).get("nghide") || "").split(",").filter(Boolean)
    : [];
const hidden = (k: string) => HIDE.includes(k);

const ss = (x: number, a: number, b: number) => THREE.MathUtils.smoothstep(x, a, b);
const lerp = THREE.MathUtils.lerp;

/* ---- the three vessels (x spacing 1.9; sump r .62, head r .74) ---- */
const VESSELS = [
  { x: -1.9, n: "01", title: "Sediment", sub: "10/5/1µm 3-layer*", cart: "#e8ecee", cartMetal: 0.05, cartRough: 0.85 },
  { x: 0.0, n: "02", title: "KDF 55/85 + carbon", sub: "heavy metals · chlorine*", cart: "#a97142", cartMetal: 0.65, cartRough: 0.5 },
  { x: 1.9, n: "03", title: "Limescale carbon", sub: "scale · taste · 1µm*", cart: "#232c33", cartMetal: 0.1, cartRough: 0.7 },
] as const;

/** per-vessel interior windows — the camera parks at each vessel while its
 *  sump ghosts. Shared by the assembly, the lights and the camera breath. */
function interiorWindows(p: number): [number, number, number] {
  const w1 = ss(p, 0.44, 0.48) * (1 - ss(p, 0.55, 0.58));
  const w2 = ss(p, 0.55, 0.58) * (1 - ss(p, 0.645, 0.675));
  const w3 = ss(p, 0.645, 0.675) * (1 - ss(p, 0.74, 0.78));
  return [w1, w2, w3];
}
const interiorMax = (p: number) => Math.max(...interiorWindows(p));

/* material recipes — one story: brushed steel sumps, dark machined heads.
   NOTE (review-confirmed): per-material envMapIntensity is a no-op under
   scene.environment (three r163+) — env strength comes solely from
   scene.environmentIntensity (<Environment> prop, scrubbed in JourneyLights). */
const STEEL = { color: "#b1bcc6", metalness: 1, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.09 } as const;
const CAPS = { color: "#79848e", metalness: 1, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.22 } as const;
const MACHINED = { color: "#2b333b", metalness: 0.95, roughness: 0.42 } as const;

/** DEV forensic (?ngdbgray): raycast from screen centre and log what's actually
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

/** Studio lights that DIM while the camera is inside a ghosted vessel —
 *  directionals have no shadows, so without this they flood the interior.
 *  scene.environmentIntensity is the ONE env knob that actually reaches the
 *  GPU under scene.environment. */
function JourneyLights({ progress }: { progress: MutableRefObject<number> }) {
  const amb = useRef<THREE.AmbientLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.DirectionalLight>(null);
  const { scene } = useThree();
  useFrame(() => {
    const through = interiorMax(progress.current);
    const dimmed = 1 - through * 0.8;
    if (amb.current) amb.current.intensity = 0.12 * dimmed;
    if (key.current) key.current.intensity = 0.85 * dimmed;
    if (rim.current) rim.current.intensity = 0.6 * dimmed;
    if (fill.current) fill.current.intensity = 0.22 * dimmed;
    scene.environmentIntensity = 0.82 * (1 - through * 0.95);
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

/* ---- camera rail (pos + look target), keyed to p ---- */
type Key = { p: number; pos: [number, number, number]; tgt: [number, number, number] };
const CAM: Key[] = [
  { p: 0.0, pos: [3.4, -0.5, 8.6], tgt: [0, 0.15, 0] }, // hero ¾
  { p: 0.06, pos: [5.2, 1.0, 6.6], tgt: [0, 0, 0] }, // drift around
  { p: 0.1, pos: [0, 0.12, 8.8], tgt: [0, 0.12, 0] }, // front dock (trace)
  { p: 0.33, pos: [0, 0.12, 8.8], tgt: [0, 0.12, 0] }, // hold dock until the plate exits
  { p: 0.4, pos: [0, 0.1, 6.8], tgt: [0, 0, 0] }, // re-frame, push in
  { p: 0.44, pos: [-1.9, 0.05, 4.6], tgt: [-1.9, -0.1, 0] }, // arrive V1
  { p: 0.55, pos: [-1.9, -0.05, 4.1], tgt: [-1.9, -0.15, 0] }, // slow push through V1
  { p: 0.58, pos: [0, 0.05, 4.6], tgt: [0, -0.1, 0] }, // slide to V2 (KDF)
  { p: 0.645, pos: [0, -0.05, 4.1], tgt: [0, -0.15, 0] }, // push through V2
  { p: 0.675, pos: [1.9, 0.05, 4.6], tgt: [1.9, -0.1, 0] }, // slide to V3
  { p: 0.74, pos: [1.9, -0.05, 4.1], tgt: [1.9, -0.15, 0] }, // push through V3
  { p: 0.8, pos: [5.4, 1.6, 5.6], tgt: [0, 0.3, 0] }, // pull back
  { p: 0.84, pos: [5.0, 2.6, 6.2], tgt: [0, 0.35, 0] }, // rise…
  { p: 0.88, pos: [4.2, 3.2, 6.0], tgt: [0, 0.4, 0] }, // …to the elevated service view (all three, parts lifted)
  { p: 1.0, pos: [2.8, 0.15, 8.8], tgt: [0, 0.12, 0] }, // settle front, reassembled
];

function seg(p: number): [Key, Key] {
  for (let i = 0; i < CAM.length - 1; i++) if (p <= CAM[i + 1].p) return [CAM[i], CAM[i + 1]];
  return [CAM[CAM.length - 2], CAM[CAM.length - 1]];
}

function Rig({ progress }: { progress: MutableRefObject<number> }) {
  const { camera } = useThree();
  const tgt = useRef(new THREE.Vector3(0, 0.12, 0));
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
    // subtle dolly-zoom "breath" — the lens pushes in at each vessel visit
    const cam = camera as THREE.PerspectiveCamera;
    const fov = 38 - interiorMax(p) * 5;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
  });
  return null;
}

function VesselAssembly({ progress }: { progress: MutableRefObject<number> }) {
  const assy = useRef<THREE.Group>(null);
  const sumpMats = useRef<(THREE.MeshPhysicalMaterial | null)[]>([]);
  const domeMats = useRef<(THREE.MeshPhysicalMaterial | null)[]>([]);
  const cartMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const coreMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const flowGroups = useRef<(THREE.Group | null)[]>([]);
  const ringMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const headGroups = useRef<(THREE.Group | null)[]>([]);
  const cartGroups = useRef<(THREE.Group | null)[]>([]);
  const boreLight = useRef<THREE.PointLight>(null);
  const [labelsOn, setLabelsOn] = useState(false);

  // procedural micro-roughness — real steel is never a perfect mirror. Fine
  // grayscale noise + faint vertical brush streaks break the reflection into
  // physical brushed metal (multiplies the roughness scalar).
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
    tex.repeat.set(2, 3);
    tex.anisotropy = 4;
    return tex;
  }, []);

  // brushed-grain bump — hairline vertical strokes give the steel a tactile
  // machined grain (light catches individual brush lines)
  const bumpMap = useMemo(() => {
    if (typeof document === "undefined") return null;
    const s = 512;
    const cv = document.createElement("canvas");
    cv.width = cv.height = s;
    const g = cv.getContext("2d");
    if (!g) return null;
    g.fillStyle = "#808080";
    g.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x++) {
      if (Math.random() < 0.6) {
        const tone = 128 + (Math.random() - 0.5) * 44;
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
    tex.repeat.set(3, 2);
    tex.anisotropy = 4;
    return tex;
  }, []);

  useFrame((state) => {
    const p = progress.current;
    const g = assy.current;
    const dock = ss(p, 0.04, 0.1); // settled to dock (drift stops BEFORE the trace)
    const reg = ss(p, 0.33, 0.42); // dock framing → journey framing (plate exited)
    const w = interiorWindows(p);
    const through = Math.max(...w);
    const reform = ss(p, 0.92, 0.99);
    const explode = ss(p, 0.76, 0.9) * (1 - reform);

    const wantLabels = explode > 0.45;
    if (wantLabels !== labelsOn) setLabelsOn(wantLabels);

    if (g) {
      // dock registration: the SVG plate draws the assembly at ~0.78 scale,
      // centred 60px left of the sheet centre and higher than world origin —
      // computed from the camera projection, then tuned against ink overlays
      g.position.x = lerp(-0.4, 0, reg);
      g.position.y = lerp(0.56, 0, reg) + Math.sin(state.clock.elapsedTime * 0.4) * 0.025 * (1 - dock);
      g.scale.setScalar(lerp(0.781, 1, reg));
      g.rotation.y = (1 - dock) * 0.35 + state.clock.elapsedTime * 0.04 * (1 - dock);
    }

    // per-vessel: sump ghosts in its window; cartridge fades in (and stays
    // visible through the service explode); flow guides live only in-window
    for (let i = 0; i < 3; i++) {
      const sm = sumpMats.current[i];
      if (sm) {
        sm.opacity = lerp(1, 0.12, w[i]);
        sm.depthWrite = sm.opacity > 0.5;
      }
      const dm = domeMats.current[i];
      if (dm) {
        dm.opacity = lerp(1, 0.12, w[i]);
        dm.depthWrite = dm.opacity > 0.5;
      }
      const cm = cartMats.current[i];
      if (cm) cm.opacity = Math.max(w[i], explode);
      const km = coreMats.current[i];
      if (km) km.opacity = w[i] * 0.85;
      const fg = flowGroups.current[i];
      if (fg) fg.visible = w[i] > 0.05;
      const rm = ringMats.current[i];
      if (rm) rm.emissiveIntensity = lerp(1.1, 0.15, through);
      // service explode: heads lift off, cartridges rise out of the sumps
      const hg = headGroups.current[i];
      if (hg) hg.position.y = explode * 1.15;
      const cg = cartGroups.current[i];
      if (cg) cg.position.y = explode * (0.95 + i * 0.12);
    }

    // interior glow tracks the active vessel (soft cyan, breathing)
    if (boreLight.current) {
      const sum = w[0] + w[1] + w[2];
      const x = sum > 0.001 ? (w[0] * VESSELS[0].x + w[1] * VESSELS[1].x + w[2] * VESSELS[2].x) / sum : 0;
      boreLight.current.position.x = x;
      const breathe = 1 + Math.sin(state.clock.elapsedTime * 2.1) * 0.12;
      boreLight.current.intensity = through * 0.5 * breathe;
    }
  });

  return (
    <group ref={assy}>
      {/* interior glow (window-driven; slides to the active vessel) */}
      {!hidden("borelight") && (
        // cool white-cyan, not saturated cyan — saturated cyan × copper = green
        <pointLight ref={boreLight} position={[0, -0.3, 0.5]} color="#cfeef8" intensity={0} distance={3.2} decay={2} />
      )}

      {/* ── mounting bracket + series pipework (mains → V1 → V2 → V3 → house) ── */}
      {!hidden("kit") && (
        <>
          <mesh position={[0, 1.02, -0.6]}>
            <boxGeometry args={[5.4, 0.26, 0.1]} />
            <meshStandardMaterial {...MACHINED} />
          </mesh>
          {[-2.94, -0.95, 0.95, 2.94].map((x, i) => (
            <mesh key={x} position={[x, 1.0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.11, 0.11, i === 0 || i === 3 ? 0.6 : 0.44, 20]} />
              <meshPhysicalMaterial {...CAPS} />
            </mesh>
          ))}
          {/* mains-in / house-out elbows */}
          {[-3.22, 3.22].map((x) => (
            <mesh key={x} position={[x, 0.9, 0]}>
              <sphereGeometry args={[0.14, 18, 14]} />
              <meshStandardMaterial {...MACHINED} />
            </mesh>
          ))}
        </>
      )}

      {VESSELS.map((v, i) => (
        <group key={v.n} position={[v.x, 0, 0]}>
          {/* head / cap (lifts on the service explode) */}
          {!hidden("caps") && (
            <group
              ref={(el) => {
                headGroups.current[i] = el;
              }}
            >
              <mesh position={[0, 1.0, 0]}>
                <cylinderGeometry args={[0.74, 0.74, 0.52, 48]} />
                <meshPhysicalMaterial {...CAPS} />
              </mesh>
              {/* pressure-release button */}
              <mesh position={[0, 1.32, 0]}>
                <cylinderGeometry args={[0.09, 0.09, 0.14, 16]} />
                <meshStandardMaterial {...MACHINED} />
              </mesh>
              {/* head collar detail */}
              <mesh position={[0, 0.78, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.68, 0.028, 10, 48]} />
                <meshStandardMaterial {...MACHINED} />
              </mesh>
            </group>
          )}

          {/* sump (ghosts during this vessel's window) */}
          {!hidden("housing") && (
            <>
              <mesh position={[0, -0.4, 0]}>
                <cylinderGeometry args={[0.62, 0.62, 2.3, 48]} />
                <meshPhysicalMaterial
                  ref={(el) => {
                    sumpMats.current[i] = el;
                  }}
                  {...STEEL}
                  roughnessMap={roughMap ?? undefined}
                  bumpMap={bumpMap ?? undefined}
                  bumpScale={0.012}
                  transparent
                  opacity={1}
                />
              </mesh>
              {/* shallow domed base (flattened to match the GA's rounded foot) */}
              <mesh position={[0, -1.55, 0]} scale={[1, 0.32, 1]}>
                <sphereGeometry args={[0.62, 40, 18, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
                <meshPhysicalMaterial
                  ref={(el) => {
                    domeMats.current[i] = el;
                  }}
                  {...CAPS}
                  transparent
                />
              </mesh>
            </>
          )}

          {/* cartridge (revealed in-window; rises out on the explode) */}
          {!hidden("stages") && (
            <group
              ref={(el) => {
                cartGroups.current[i] = el;
              }}
            >
              <mesh position={[0, -0.42, 0]}>
                <cylinderGeometry args={[0.4, 0.4, 2.05, 40]} />
                <meshStandardMaterial
                  ref={(el) => {
                    cartMats.current[i] = el;
                  }}
                  color={v.cart}
                  metalness={v.cartMetal}
                  roughness={v.cartRough}
                  bumpMap={i === 0 ? bumpMap ?? undefined : undefined}
                  bumpScale={i === 0 ? 0.02 : 0}
                  transparent
                  opacity={0}
                />
              </mesh>
              {/* hollow core the filtered water rises through */}
              <mesh position={[0, -0.42, 0]}>
                <cylinderGeometry args={[0.085, 0.085, 2.08, 20]} />
                <meshStandardMaterial
                  ref={(el) => {
                    coreMats.current[i] = el;
                  }}
                  color="#0f6f8e"
                  emissive="#29c2ee"
                  emissiveIntensity={0.5}
                  transparent
                  opacity={0}
                />
              </mesh>
              <Html position={[0, -2.15, 0]} center zIndexRange={[12, 0]} className="stage-label-wrap">
                <div className={`stage-label ${labelsOn ? "on" : ""}`.trim()}>
                  <span className="sl-n">{v.n}</span>
                  <span className="sl-t">{v.title}</span>
                  <span className="sl-s">{v.sub}</span>
                </div>
              </Html>
            </group>
          )}

          {/* radial-flow guides: DOWN the annulus, IN through the wall, UP the core */}
          {!hidden("flow") && (
            <group
              ref={(el) => {
                flowGroups.current[i] = el;
              }}
              visible={false}
            >
              {/* annulus down-arrows (staggered around the front half) */}
              {[
                [0.52, 0.42, 0.12],
                [-0.44, -0.02, 0.3],
                [0.28, -0.5, 0.45],
              ].map((pos, k) => (
                <mesh key={k} position={pos as [number, number, number]} rotation={[Math.PI, 0, 0]}>
                  <coneGeometry args={[0.06, 0.17, 12]} />
                  <meshStandardMaterial color="#29c2ee" emissive="#29c2ee" emissiveIntensity={0.55} />
                </mesh>
              ))}
              {/* inward arrows punching through the media wall */}
              {[
                [0.5, -0.85, 0.0],
                [-0.5, -0.85, 0.0],
              ].map((pos, k) => (
                <mesh key={k} position={pos as [number, number, number]} rotation={[0, 0, pos[0] > 0 ? Math.PI / 2 : -Math.PI / 2]}>
                  <coneGeometry args={[0.05, 0.14, 12]} />
                  <meshStandardMaterial color="#7fd8f5" emissive="#7fd8f5" emissiveIntensity={0.45} />
                </mesh>
              ))}
              {/* core up-arrow */}
              <mesh position={[0, 0.62, 0]}>
                <coneGeometry args={[0.07, 0.2, 12]} />
                <meshStandardMaterial color="#29c2ee" emissive="#29c2ee" emissiveIntensity={0.7} />
              </mesh>
            </group>
          )}

          {/* cyan brand ring seated at the sump base */}
          <mesh position={[0, -1.5, 0]} rotation={[Math.PI / 2, 0, 0]} visible={!hidden("ring")}>
            <torusGeometry args={[0.655, 0.015, 12, 64]} />
            <meshStandardMaterial
              ref={(el) => {
                ringMats.current[i] = el;
              }}
              color="#29c2ee"
              emissive="#29c2ee"
              emissiveIntensity={1.1}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function ChromeStage({ progress, active }: Props) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 2]}
      camera={{ position: [0, 0.12, 8.8], fov: 38 }}
      // OPAQUE canvas: blending ghosted layers against an alpha framebuffer and
      // letting the BROWSER composite produces a milky wash. The canvas sits
      // UNDER the SVG plate, so it can own its dark studio backdrop.
      gl={{ alpha: false, antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 0.98;
        gl.setClearColor("#0a121b", 1);
        scene.background = new THREE.Color("#0a121b");
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      {/* Studio HDRI softbox reflections — SELF-HOSTED (public/hdri) so the 3D
          never depends on a third-party CDN. The SVG plate is the no-WebGL /
          reduced-motion fallback. */}
      <Environment files={asset("/hdri/studio_small_03_1k.hdr")} environmentIntensity={0.82} />

      <JourneyLights progress={progress} />

      <VesselAssembly progress={progress} />
      <Rig progress={progress} />
      {typeof window !== "undefined" && new URLSearchParams(window.location.search).has("ngdbgray") && <DebugRay />}

      {!hidden("shadows") && (
        <ContactShadows position={[0, -1.72, 0]} opacity={0.55} scale={14} blur={3} far={5} color="#000000" />
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
