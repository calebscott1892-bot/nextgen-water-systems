"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows, Html, Lightformer } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, ChromaticAberration, DepthOfField } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { asset } from "@/lib/asset";
import { BACKDROP_STOPS, BACKDROP_CENTER, BACKDROP_RADII, BACKDROP_FOG } from "./backdrop";

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
type Props = {
  progress: MutableRefObject<number>;
  active: boolean;
  /** .plate-sheet height / viewport height — drives the dock registration
   *  zoom now that the canvas is full-bleed (Phase 1). */
  sheetRatio?: MutableRefObject<number>;
  /** fires once the suspended scene (env HDR included) has actually mounted —
   *  LivingDrawing holds the SVG still as a poster until then. */
  onReady?: () => void;
};

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

/* ---- the three vessels (x spacing 1.9; sump r .62, head r .74) ----
   spec fields feed the interactive explode cards (Phase 2) */
const VESSELS = [
  {
    x: -1.9, n: "01", title: "Sediment", sub: "10/5/1µm 3-layer*",
    cart: "#e8ecee", cartMetal: 0.05, cartRough: 0.85,
    media: "Graded polypropylene · 3 layers", rating: "10 / 5 / 1 µm*", service: "~6 months*",
    removes: ["Grit", "Rust", "Silt"],
  },
  {
    x: 0.0, n: "02", title: "KDF 55/85 + carbon", sub: "heavy metals · chlorine*",
    cart: "#a97142", cartMetal: 0.65, cartRough: 0.5,
    media: "Copper-zinc granules + coconut carbon", rating: "redox bed", service: "up to 18 months*",
    removes: ["Heavy metals", "Chlorine", "Bacteria control*"],
  },
  {
    x: 1.9, n: "03", title: "Limescale carbon", sub: "scale · taste · 1µm*",
    cart: "#232c33", cartMetal: 0.1, cartRough: 0.7,
    media: "Scale-reduction media + carbon", rating: "1 µm polish", service: "~12 months*",
    removes: ["Scale formation*", "Taste", "Odour"],
  },
] as const;

/** where each vessel's water-run beat parks (mid interior window) — the
 *  click-a-vessel scroll target */
const VESSEL_BEAT_P = [0.5, 0.61, 0.7] as const;

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
const STEEL = { color: "#b1bcc6", metalness: 1, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.09, anisotropy: 0.4, anisotropyRotation: Math.PI / 2 } as const;
const CAPS = { color: "#79848e", metalness: 1, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.22 } as const;
const MACHINED = { color: "#2b333b", metalness: 0.95, roughness: 0.42 } as const;
const CA_OFFSET = new THREE.Vector2(0.0006, 0.0004);

/** Fullscreen pool-of-light INSIDE the GL frame — same stops as the page CSS
 *  (see backdrop.ts), so the canvas cross-fade at the trace beat is seamless.
 *  Raw ShaderMaterial: no tone mapping, no fog — the hexes hit the framebuffer
 *  exactly as CSS renders them. */
function Backdrop() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    // one triangle covering NDC — cheaper and simpler than a quad
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    return g;
  }, []);
  const mat = useMemo(() => {
    // the composer's frame buffer is LINEAR (the final pass applies tone
    // mapping + sRGB encode to everything) — feed it linear values or the
    // encode washes the pool-of-light to grey
    const [a, b, c] = BACKDROP_STOPS.map(([, hex]) => {
      const col = new THREE.Color(hex).convertSRGBToLinear();
      return [col.r, col.g, col.b] as [number, number, number];
    });
    const mid = BACKDROP_STOPS[1][0];
    return new THREE.ShaderMaterial({
      depthWrite: false,
      depthTest: false,
      fog: false,
      vertexShader: `varying vec2 vUv; void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 1.0, 1.0); }`,
      fragmentShader: `
        varying vec2 vUv;
        void main(){
          // CSS geometry: centre (${BACKDROP_CENTER.x}, ${BACKDROP_CENTER.y} from top), radii ${BACKDROP_RADII.x}/${BACKDROP_RADII.y}
          vec2 q = vec2((vUv.x - ${BACKDROP_CENTER.x.toFixed(3)}) / ${BACKDROP_RADII.x.toFixed(3)},
                        (vUv.y - ${(1 - BACKDROP_CENTER.y).toFixed(3)}) / ${BACKDROP_RADII.y.toFixed(3)});
          float d = clamp(length(q), 0.0, 1.0);
          vec3 a = vec3(${a.map((v) => v.toFixed(4)).join(",")});
          vec3 b = vec3(${b.map((v) => v.toFixed(4)).join(",")});
          vec3 c = vec3(${c.map((v) => v.toFixed(4)).join(",")});
          vec3 col = d < ${mid.toFixed(3)} ? mix(a, b, d / ${mid.toFixed(3)}) : mix(b, c, (d - ${mid.toFixed(3)}) / ${(1 - mid).toFixed(3)});
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
  }, []);
  return <mesh geometry={geo} material={mat} renderOrder={-1} frustumCulled={false} />;
}

/** Phase 3 — scroll-driven photography: focus rides the vessel being
 *  discussed (weighted by the interior windows), the lens opens up inside the
 *  machine, and the DoF stands down entirely at the trace dock where ink
 *  registration owns a clinically sharp frame. */
function FocusRig({ progress, dof }: { progress: MutableRefObject<number>; dof: MutableRefObject<{ target?: THREE.Vector3; bokehScale: number; cocMaterial?: { worldFocusRange: number } } | null> }) {
  useFrame(() => {
    const eff = dof.current;
    if (!eff) return;
    const p = progress.current;
    const w = interiorWindows(p);
    const through = Math.max(...w);
    const dockW = ss(p, 0.04, 0.1) * (1 - ss(p, 0.36, 0.44));
    const sum = w[0] + w[1] + w[2];
    const x = sum > 0.001 ? (w[0] * VESSELS[0].x + w[1] * VESSELS[1].x + w[2] * VESSELS[2].x) / sum : 0;
    if (eff.target) eff.target.set(x, -0.1, 0);
    if (eff.cocMaterial) eff.cocMaterial.worldFocusRange = 3.4 - through * 1.2;
    eff.bokehScale = (1.3 + through * 1.9) * (1 - dockW);
  });
  return null;
}

/** Mounted INSIDE the Canvas's suspense boundary — its effect can only fire
 *  once every suspended resource (the env HDR) has resolved. */
function Ready({ onReady }: { onReady?: () => void }) {
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  return null;
}

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
  { p: 0.36, pos: [0, 0.12, 8.8], tgt: [0, 0.12, 0] }, // hold dock until the plate exits (widened hold, Phase 2)
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

function segIndex(p: number): number {
  for (let i = 0; i < CAM.length - 1; i++) if (p <= CAM[i + 1].p) return i;
  return CAM.length - 2;
}

/** Catmull-Rom through the rail keys (uniform basis), evaluated per segment so
 *  every key still lands at its EXACT p. Hold segments (identical knots) stay
 *  put, and their zero-length neighbours naturally ease the tangents to rest —
 *  kills the velocity kink at 9 of 11 keys that piecewise lerp had. */
function crAxis(a: number, b: number, c: number, d: number, t: number): number {
  return 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
}
function sampleRail(sel: "pos" | "tgt", i: number, t: number, out: THREE.Vector3) {
  const pick = (j: number) => CAM[Math.min(Math.max(j, 0), CAM.length - 1)][sel];
  const P0 = pick(i - 1), P1 = pick(i), P2 = pick(i + 1), P3 = pick(i + 2);
  const len = Math.hypot(P2[0] - P1[0], P2[1] - P1[1], P2[2] - P1[2]);
  if (len < 1e-5) {
    out.set(P1[0], P1[1], P1[2]); // hold — the camera is parked
    return;
  }
  out.set(
    crAxis(P0[0], P1[0], P2[0], P3[0], t),
    crAxis(P0[1], P1[1], P2[1], P3[1], t),
    crAxis(P0[2], P1[2], P2[2], P3[2], t),
  );
}

function Rig({ progress, sheetRatio }: { progress: MutableRefObject<number>; sheetRatio?: MutableRefObject<number> }) {
  const { camera } = useThree();
  const tgt = useRef(new THREE.Vector3(0, 0.12, 0));
  useFrame((state) => {
    const p = progress.current;
    const i = segIndex(p);
    const a = CAM[i], b = CAM[i + 1];
    const t = THREE.MathUtils.clamp((p - a.p) / (b.p - a.p || 1), 0, 1);
    // cushion the dock arrival and the final settle
    const e = b.p === 0.1 || b.p === 1.0 ? ss(t, 0, 1) : t;
    sampleRail("pos", i, e, camera.position);
    sampleRail("tgt", i, e, tgt.current);
    // portrait rescue — the hero pose frames all three vessels only above
    // ~1.15 aspect; on narrow screens pull back + widen the lens so the whole
    // assembly stays in frame. MUST be gone by p=0.10: the dock's ink
    // registration is derived from the unmodified rail.
    const cam = camera as THREE.PerspectiveCamera;
    const narrow = THREE.MathUtils.clamp((1.15 - cam.aspect) / 0.5, 0, 1);
    const heroW = narrow * (1 - ss(p, 0.07, 0.1));
    if (heroW > 0) {
      camera.position.z += heroW * 4.5;
      camera.position.x *= 1 - heroW * 0.3;
      camera.position.y += heroW * 0.2;
    }
    // dock registration zoom (Phase 1): the canvas is full-bleed but the ink
    // is drawn at SHEET scale — camera.zoom scales the NDC image uniformly
    // about centre (sheet centre == canvas centre), which is an EXACT remap
    // of the calibrated projection. Engages with the dock, releases with reg.
    const zoomW = ss(p, 0.04, 0.1) * (1 - ss(p, 0.36, 0.44));
    // pointer parallax (Phase 2) — the suspended machine answers the cursor
    // everywhere except the trace dock, where registration owns the frame
    const par = 1 - zoomW;
    camera.position.x += state.pointer.x * 0.16 * par;
    camera.position.y += state.pointer.y * 0.09 * par;
    camera.up.set(0, 1, 0);
    camera.lookAt(tgt.current);
    // subtle dolly-zoom "breath" — the lens pushes in at each vessel visit
    const fov = 38 - interiorMax(p) * 5 + heroW * 10;
    const zoom = lerp(1, Math.min(sheetRatio?.current ?? 1, 1), zoomW);
    if (Math.abs(cam.fov - fov) > 0.01 || Math.abs(cam.zoom - zoom) > 0.001) {
      cam.fov = fov;
      cam.zoom = zoom;
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
  // Phase 3: printed label wraps (ghost with their sump) + cartridge end caps
  const labelMatRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const capMatRefs = useRef<(THREE.MeshStandardMaterial | null)[][]>([[], [], []]);
  const actionRefs = useRef<(THREE.Mesh | null)[][]>([[], [], []]);
  const actionGroups = useRef<(THREE.Group | null)[]>([]);
  const sparkRefs = useRef<(THREE.Mesh | null)[]>([]);
  const [labelsOn, setLabelsOn] = useState(false);
  // Phase 2 interactivity: hovered vessel (ring brighten + tooltip) and the
  // explode card currently expanded
  const [hover, setHover] = useState<number | null>(null);
  const [openCard, setOpenCard] = useState<number | null>(null);

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

  // granule bed for the KDF cartridge — black GAC + copper body + glinting
  // brass KDF flecks (the §A-KDF "bed of loose granules" read)
  const granuleMap = useMemo(() => {
    if (typeof document === "undefined") return null;
    const s = 256;
    const cv = document.createElement("canvas");
    cv.width = cv.height = s;
    const g = cv.getContext("2d");
    if (!g) return null;
    g.fillStyle = "#7c4c28";
    g.fillRect(0, 0, s, s);
    for (let k = 0; k < 2400; k++) {
      const r = Math.random();
      g.fillStyle = r < 0.48 ? "#14181d" : r < 0.76 ? "#a97142" : "#e2a55e";
      const sz = 1 + Math.random() * 2.4;
      g.fillRect(Math.random() * s, Math.random() * s, sz, sz);
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 3);
    tex.anisotropy = 4;
    return tex;
  }, []);

  /* ── Phase 3 — the cartridges become MANUFACTURED PARTS, not primitives ── */

  // V1: pleated spun-poly — vertical facet shading + fibre noise (map + bump)
  const pleatMaps = useMemo(() => {
    if (typeof document === "undefined") return null;
    const w = 512, h = 128;
    const mk = () => {
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      return cv;
    };
    const col = mk(), bmp = mk();
    const gc = col.getContext("2d"), gb = bmp.getContext("2d");
    if (!gc || !gb) return null;
    const PLEATS = 36;
    const pw = w / PLEATS;
    for (let i = 0; i < PLEATS; i++) {
      const x0 = i * pw;
      // each pleat: bright ridge → shadowed valley (triangle shading)
      const grad = gc.createLinearGradient(x0, 0, x0 + pw, 0);
      grad.addColorStop(0, "#d9d6cd");
      grad.addColorStop(0.45, "#f4f2ec");
      grad.addColorStop(0.55, "#f4f2ec");
      grad.addColorStop(1, "#c9c6bc");
      gc.fillStyle = grad;
      gc.fillRect(x0, 0, pw, h);
      const bg = gb.createLinearGradient(x0, 0, x0 + pw, 0);
      bg.addColorStop(0, "#404040");
      bg.addColorStop(0.5, "#ffffff");
      bg.addColorStop(1, "#404040");
      gb.fillStyle = bg;
      gb.fillRect(x0, 0, pw, h);
    }
    // fibre speckle
    for (let k = 0; k < 1600; k++) {
      gc.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,0.25)" : "rgba(120,116,105,0.18)";
      gc.fillRect(Math.random() * w, Math.random() * h, 1, 1 + Math.random() * 2);
    }
    const map = new THREE.CanvasTexture(col);
    const bump = new THREE.CanvasTexture(bmp);
    [map, bump].forEach((t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(2, 1);
      t.anisotropy = 8;
    });
    map.colorSpace = THREE.SRGBColorSpace;
    return { map, bump };
  }, []);

  // V3: extruded carbon block — matte black, fine speckle, faint striations
  const carbonMap = useMemo(() => {
    if (typeof document === "undefined") return null;
    const s = 256;
    const cv = document.createElement("canvas");
    cv.width = cv.height = s;
    const g = cv.getContext("2d");
    if (!g) return null;
    g.fillStyle = "#191c20";
    g.fillRect(0, 0, s, s);
    for (let x = 0; x < s; x += 6) {
      g.fillStyle = `rgba(0,0,0,${0.1 + 0.12 * Math.abs(Math.sin(x * 0.7))})`;
      g.fillRect(x, 0, 2, s);
    }
    for (let k = 0; k < 2600; k++) {
      const r = Math.random();
      g.fillStyle = r < 0.55 ? "#0d0f12" : r < 0.85 ? "#262b31" : "#3a4149";
      g.fillRect(Math.random() * s, Math.random() * s, 1, 1 + Math.random());
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 2);
    tex.anisotropy = 8;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  // the hollow core reads as RISING WATER — an animated streak map scrolled
  // upward in useFrame (emissive so it stays luminous through the ghost wall)
  const coreFlowMap = useMemo(() => {
    if (typeof document === "undefined") return null;
    const w = 64, h = 256;
    const cv = document.createElement("canvas");
    cv.width = w;
    cv.height = h;
    const g = cv.getContext("2d");
    if (!g) return null;
    g.fillStyle = "#0f7c9e";
    g.fillRect(0, 0, w, h);
    for (let k = 0; k < 90; k++) {
      const x = Math.random() * w;
      const y0 = Math.random() * h;
      const len = 20 + Math.random() * 70;
      const grad = g.createLinearGradient(0, y0, 0, y0 + len);
      grad.addColorStop(0, "rgba(220,248,255,0)");
      grad.addColorStop(0.5, `rgba(190,240,255,${0.25 + Math.random() * 0.5})`);
      grad.addColorStop(1, "rgba(220,248,255,0)");
      g.fillStyle = grad;
      g.fillRect(x, y0, 1 + Math.random() * 2, len);
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 1.4);
    tex.anisotropy = 4;
    return tex;
  }, []);

  // printed vinyl label wraps on the sumps — "the product has printed text on
  // it" does more for real-not-rendition than any shader
  const labelMaps = useMemo(() => {
    if (typeof document === "undefined") return null;
    return VESSELS.map((v) => {
      // 640×410 ≈ the strip's world aspect (arc 1.19 × height 0.76)
      const w = 640, h = 410;
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      const g = cv.getContext("2d")!;
      g.fillStyle = "#f2f3ee";
      g.fillRect(0, 0, w, h);
      g.strokeStyle = "#12324a";
      g.lineWidth = 6;
      g.strokeRect(10, 10, w - 20, h - 20);
      // header band
      g.fillStyle = "#12324a";
      g.fillRect(10, 10, w - 20, 64);
      g.fillStyle = "#f2f3ee";
      g.font = "700 36px Arial, sans-serif";
      g.fillText("NEXT GEN", 30, 56);
      g.font = "400 26px Arial, sans-serif";
      g.textAlign = "right";
      g.fillText("NGW-01", w - 30, 55);
      g.textAlign = "left";
      // stage number + title
      g.fillStyle = "#12324a";
      g.font = "800 92px Arial, sans-serif";
      g.fillText(`STAGE ${Number(v.n)}`, 28, 186);
      g.font = "600 34px Arial, sans-serif";
      g.fillText(v.title.toUpperCase(), 28, 246);
      g.font = "400 24px monospace";
      g.fillStyle = "#3c5a70";
      g.fillText(v.sub, 28, 292);
      // divider + footer row
      g.strokeStyle = "#c9ccc2";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(28, 330);
      g.lineTo(w - 28, 330);
      g.stroke();
      g.fillStyle = "#3c5a70";
      g.font = "400 22px monospace";
      g.fillText("MAX 100 PSI*  ·  4.5″ × 20″  ·  FLOW →", 28, 372);
      const tex = new THREE.CanvasTexture(cv);
      tex.anisotropy = 8;
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    });
  }, []);

  /* ---- per-vessel interior ACTIONS (the doc's "what working looks like") ----
     V1: rust/silt particles spiral inward and decelerate INTO the fibre mat.
     V2: contaminant ions drift onto the granule bed while redox sparks fire
         (electron-transfer micro-events on the copper-zinc surface).
     V3: pale scale flecks shrink away as the media captures them. */
  // depthWrite:false everywhere (review-confirmed): invisible transparent
  // spheres must not write depth into the pass and punch holes in ghosts
  const actionMats = useMemo(
    () => [
      [
        new THREE.MeshStandardMaterial({ color: "#b3552e", roughness: 0.8, transparent: true, opacity: 0, depthWrite: false }),
        new THREE.MeshStandardMaterial({ color: "#8a8378", roughness: 0.85, transparent: true, opacity: 0, depthWrite: false }),
      ],
      [
        new THREE.MeshStandardMaterial({ color: "#3a4149", roughness: 0.6, transparent: true, opacity: 0, depthWrite: false }),
        new THREE.MeshStandardMaterial({
          color: "#7fe4ff",
          emissive: "#29c2ee",
          emissiveIntensity: 2.4,
          toneMapped: false,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
      ],
      [new THREE.MeshStandardMaterial({ color: "#e8ecef", roughness: 0.5, transparent: true, opacity: 0, depthWrite: false })],
    ],
    [],
  );
  type ASpec = { angle: number; phase: number; speed: number; y: number; size: number; mi: number };
  const actionSpecs = useMemo<ASpec[][]>(() => {
    const R = Math.random;
    const mk = (n: number, speed: [number, number], size: [number, number], twoMats: boolean): ASpec[] =>
      Array.from({ length: n }, () => ({
        angle: R() * Math.PI * 2,
        phase: R(),
        speed: speed[0] + R() * (speed[1] - speed[0]),
        y: -1.15 + R() * 1.45,
        size: size[0] + R() * (size[1] - size[0]),
        mi: twoMats && R() > 0.55 ? 1 : 0,
      }));
    return [mk(12, [0.1, 0.18], [0.022, 0.046], true), mk(10, [0.12, 0.2], [0.02, 0.04], false), mk(8, [0.07, 0.12], [0.024, 0.044], false)];
  }, []);
  const sparkSpecs = useMemo(
    () =>
      Array.from({ length: 8 }, (_, k) => ({
        angle: (k / 8) * Math.PI * 2 + Math.random() * 0.5,
        y: -1.05 + (k / 8) * 1.35 + Math.random() * 0.15,
        phase: Math.random() * Math.PI * 2,
        freq: 1.6 + Math.random() * 1.3,
      })),
    [],
  );
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(1, 10, 8), []);

  useFrame((state, delta) => {
    const p = progress.current;
    const g = assy.current;
    const dock = ss(p, 0.04, 0.1); // settled to dock (drift stops BEFORE the trace)
    const reg = ss(p, 0.36, 0.44); // dock framing → journey framing (plate exited; widened hold)
    const w = interiorWindows(p);
    const through = Math.max(...w);
    // Phase 2 — genuine time-staggered deconstruction: heads lift first (in a
    // slight wave), cartridges follow per-vessel; reassembly mirrors it (carts
    // seat, then heads close) as the transition into the settle
    const reformCarts = ss(p, 0.92, 0.96);
    const reformHeads = ss(p, 0.94, 0.99);
    const reform = ss(p, 0.92, 0.99);
    const explode = ss(p, 0.76, 0.9) * (1 - reform); // overall scalar (opacities/labels)

    // hysteresis: on at 0.5, off at 0.38 — parking the scrub near a single
    // threshold used to strobe the labels against their 0.45s CSS transition
    const wantLabels = labelsOn ? explode > 0.38 : explode > 0.5;
    if (wantLabels !== labelsOn) {
      setLabelsOn(wantLabels);
      if (!wantLabels) setOpenCard(null); // cards never linger past the beat
    }

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
      // cap in-window cartridge opacity below 1 so the emissive core reads
      // through the media wall (full opacity only for the service explode)
      const cm = cartMats.current[i];
      if (cm) cm.opacity = Math.max(w[i] * 0.85, explode);
      capMatRefs.current[i].forEach((m) => {
        if (m) m.opacity = Math.max(w[i] * 0.85, explode);
      });
      // the printed label ghosts in step with its sump wall
      const lm = labelMatRefs.current[i];
      if (lm) {
        lm.opacity = lerp(1, 0.1, w[i]);
        lm.depthWrite = lm.opacity > 0.5;
      }
      const km = coreMats.current[i];
      if (km) km.opacity = w[i] * 0.85;
      const fg = flowGroups.current[i];
      if (fg) fg.visible = w[i] > 0.05;
      // interior action particles (radial capture motion, per the reference doc)
      // — the whole group is visibility-gated so 0-opacity spheres don't draw
      actionMats[i].forEach((m) => (m.opacity = w[i]));
      const ag = actionGroups.current[i];
      if (ag) ag.visible = w[i] > 0.02;
      if (w[i] > 0.02) {
        const tt = state.clock.elapsedTime;
        actionSpecs[i].forEach((s, k) => {
          const mesh = actionRefs.current[i][k];
          if (!mesh) return;
          const t01 = (tt * s.speed + s.phase) % 1;
          const eased = 1 - (1 - t01) * (1 - t01); // decelerates INTO the media wall
          const r = lerp(0.6, 0.415, eased);
          mesh.position.set(Math.sin(s.angle) * r, s.y - t01 * 0.1, Math.cos(s.angle) * r);
          const sc = i === 2 ? s.size * (1 - eased * 0.85) : s.size; // V3: flecks dissolve
          mesh.scale.setScalar(Math.max(sc, 1e-4));
        });
      }
      const rm = ringMats.current[i];
      if (rm) rm.emissiveIntensity = hover === i && p > 0.33 ? 2.2 : lerp(1.1, 0.15, through);
      // service explode, staggered in TIME: heads lead in a wave, cartridges
      // follow each a beat later — parts stay suspended for the whole dwell
      const headLift = ss(p, 0.76 + i * 0.012, 0.84 + i * 0.012) * (1 - reformHeads);
      const cartLift = ss(p, 0.79 + i * 0.015, 0.9) * (1 - reformCarts);
      const hg = headGroups.current[i];
      if (hg) hg.position.y = headLift * 1.15;
      const cg = cartGroups.current[i];
      if (cg) cg.position.y = cartLift * (0.95 + i * 0.12);
    }

    // the core water RISES — scroll the streak map while any interior is open
    if (coreFlowMap && through > 0.01) coreFlowMap.offset.y -= delta * 0.55;

    // KDF redox sparks — brief electron-transfer flashes on the granule bed
    // (only animated while V2's window is open; the group is hidden otherwise)
    if (w[1] > 0.02) {
      const tt = state.clock.elapsedTime;
      sparkSpecs.forEach((s, k) => {
        const m = sparkRefs.current[k];
        if (!m) return;
        const pulse = Math.max(0, Math.sin(tt * s.freq + s.phase));
        m.scale.setScalar(0.01 + Math.pow(pulse, 8) * 0.055);
      });
    }

    // interior glow tracks the active vessel (soft, breathing), and its colour
    // tells the water's story: murky at V1, coppery-neutral at V2, clean at V3
    if (boreLight.current) {
      const sum = w[0] + w[1] + w[2];
      const x = sum > 0.001 ? (w[0] * VESSELS[0].x + w[1] * VESSELS[1].x + w[2] * VESSELS[2].x) / sum : 0;
      boreLight.current.position.x = x;
      const breathe = 1 + Math.sin(state.clock.elapsedTime * 2.1) * 0.12;
      boreLight.current.intensity = through * 0.5 * breathe;
      if (through > 0.02)
        boreLight.current.color.set(w[0] >= w[1] && w[0] >= w[2] ? "#e3c39a" : w[1] >= w[2] ? "#cfeef8" : "#bfe9ff");
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
        <group
          key={v.n}
          position={[v.x, 0, 0]}
          // Phase 2 — the machine answers touch: hover brightens this vessel's
          // ring + raises its label; click flies the scroll to its beat.
          // Gated past the dock so nothing fights the ink trace.
          onPointerOver={(e) => {
            if (progress.current < 0.33) return;
            e.stopPropagation();
            setHover(i);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHover((h) => (h === i ? null : h));
            document.body.style.cursor = "";
          }}
          onClick={(e) => {
            if (progress.current < 0.33 || progress.current > 0.76) return;
            e.stopPropagation();
            const el = document.getElementById("drawing");
            if (!el) return;
            const y = el.offsetTop + VESSEL_BEAT_P[i] * (el.offsetHeight - window.innerHeight);
            window.scrollTo({ top: y, behavior: "smooth" });
          }}
        >
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
              {/* Phase 3: printed vinyl label wrap (~109° facing front) —
                  ghosts with its sump during the interior dive */}
              {labelMaps && (
                <mesh position={[0, -0.34, 0]}>
                  <cylinderGeometry args={[0.625, 0.625, 0.76, 48, 1, true, -0.95, 1.9]} />
                  <meshStandardMaterial
                    ref={(el) => {
                      labelMatRefs.current[i] = el;
                    }}
                    map={labelMaps[i]}
                    roughness={0.5}
                    metalness={0}
                    transparent
                    side={THREE.FrontSide}
                  />
                </mesh>
              )}
            </>
          )}

          {/* cartridge (revealed in-window; rises out on the explode).
              depthWrite OFF + core renderOrder (review-confirmed): otherwise the
              cartridge depth-occludes the core and "up the core" never renders. */}
          {!hidden("stages") && (
            <group
              ref={(el) => {
                cartGroups.current[i] = el;
              }}
            >
              <mesh position={[0, -0.42, 0]}>
                <cylinderGeometry args={[0.4, 0.4, 2.05, 40]} />
                {/* Phase 3: three visibly DIFFERENT manufactured parts —
                    white pleated poly / copper-zinc granules / carbon block */}
                <meshStandardMaterial
                  ref={(el) => {
                    cartMats.current[i] = el;
                  }}
                  color={(i === 0 && pleatMaps) || (i === 1 && granuleMap) || (i === 2 && carbonMap) ? "#ffffff" : v.cart}
                  map={i === 0 ? pleatMaps?.map ?? undefined : i === 1 ? granuleMap ?? undefined : carbonMap ?? undefined}
                  bumpMap={i === 0 ? pleatMaps?.bump ?? undefined : undefined}
                  bumpScale={i === 0 ? 0.035 : 0}
                  metalness={i === 1 ? v.cartMetal : 0.02}
                  roughness={i === 0 ? 0.9 : i === 1 ? v.cartRough : 0.82}
                  transparent
                  depthWrite={false}
                  opacity={0}
                />
              </mesh>
              {/* moulded end caps — the "this is a replaceable part" cue */}
              {[1.02, -1.02].map((dy, ci) => (
                <mesh key={dy} position={[0, -0.42 + dy, 0]}>
                  <cylinderGeometry args={[0.43, 0.43, 0.07, 40]} />
                  <meshStandardMaterial
                    ref={(el) => {
                      capMatRefs.current[i][ci] = el;
                    }}
                    color={["#e3e1d8", "#23282e", "#0e1114"][i]}
                    roughness={0.55}
                    metalness={0.05}
                    transparent
                    depthWrite={false}
                    opacity={0}
                  />
                </mesh>
              ))}
              {/* hollow core the filtered water rises through (draws after the
                  cartridge so its glow reads through the ghosted media wall) */}
              <mesh position={[0, -0.42, 0]} renderOrder={2}>
                <cylinderGeometry args={[0.085, 0.085, 2.08, 20]} />
                {/* Phase 3: the core is RISING WATER — animated streak map,
                    scrolled in useFrame, not a flat glowing stick */}
                <meshStandardMaterial
                  ref={(el) => {
                    coreMats.current[i] = el;
                  }}
                  color="#8fd8ec"
                  map={coreFlowMap ?? undefined}
                  emissive="#29c2ee"
                  emissiveMap={coreFlowMap ?? undefined}
                  emissiveIntensity={1.15}
                  transparent
                  depthWrite={false}
                  opacity={0}
                />
              </mesh>
              {/* Phase 2 — the label RIDES the lifted cartridge and is a real
                  interactive text space: leader draws → tag letters → the tag
                  expands into a spec card on click/keyboard */}
              <Html position={[0.55, 0.2, 0.4]} zIndexRange={[30, 10]} className="xlabel-wrap">
                <div
                  className={`xlabel ${labelsOn || (hover === i && progress.current > 0.33) ? "on" : ""} ${openCard === i ? "is-open" : ""}`.trim()}
                  aria-hidden={!labelsOn && hover !== i}
                >
                  <span className="xl-leader" aria-hidden="true" />
                  <button
                    type="button"
                    className="xl-tag"
                    tabIndex={labelsOn ? 0 : -1}
                    aria-expanded={openCard === i}
                    onClick={() => setOpenCard(openCard === i ? null : i)}
                  >
                    <b>{v.n}</b>
                    <span>{v.title}</span>
                    <i className="xl-plus" aria-hidden="true">
                      {openCard === i ? "–" : "+"}
                    </i>
                  </button>
                  <div className="xl-card">
                    <dl>
                      <div>
                        <dt>MEDIA</dt>
                        <dd>{v.media}</dd>
                      </div>
                      <div>
                        <dt>RATING</dt>
                        <dd>{v.rating}</dd>
                      </div>
                      <div>
                        <dt>SERVICE</dt>
                        <dd>{v.service}</dd>
                      </div>
                    </dl>
                    <div className="xl-chips">
                      {v.removes.map((r) => (
                        <span key={r}>{r}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </Html>
            </group>
          )}

          {/* radial-flow guides: DOWN the annulus, IN through the wall, UP the
              core — Phase 3: soft water STREAKS (capsules), not bare cones */}
          {!hidden("flow") && (
            <group
              ref={(el) => {
                flowGroups.current[i] = el;
              }}
              visible={false}
            >
              {/* annulus streaks (staggered around the front half) */}
              {[
                [0.52, 0.42, 0.12],
                [-0.44, -0.02, 0.3],
                [0.28, -0.5, 0.45],
              ].map((pos, k) => (
                <mesh key={k} position={pos as [number, number, number]}>
                  <capsuleGeometry args={[0.028, 0.17, 4, 12]} />
                  <meshStandardMaterial
                    color="#9fe8ff"
                    emissive="#29c2ee"
                    emissiveIntensity={0.8}
                    transparent
                    opacity={0.8}
                    depthWrite={false}
                  />
                </mesh>
              ))}
              {/* inward streaks punching through the media wall */}
              {[
                [0.5, -0.85, 0.0],
                [-0.5, -0.85, 0.0],
              ].map((pos, k) => (
                <mesh key={k} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
                  <capsuleGeometry args={[0.024, 0.13, 4, 12]} />
                  <meshStandardMaterial
                    color="#bfeefb"
                    emissive="#7fd8f5"
                    emissiveIntensity={0.6}
                    transparent
                    opacity={0.75}
                    depthWrite={false}
                  />
                </mesh>
              ))}
              {/* core up-streak */}
              <mesh position={[0, 0.62, 0]}>
                <capsuleGeometry args={[0.04, 0.24, 4, 12]} />
                <meshStandardMaterial
                  color="#9fe8ff"
                  emissive="#29c2ee"
                  emissiveIntensity={1.0}
                  transparent
                  opacity={0.85}
                  depthWrite={false}
                />
              </mesh>
            </group>
          )}

          {/* interior actions — the "what working looks like" micro-events
              (visibility-gated per window in useFrame) */}
          {!hidden("actions") && (
            <group
              ref={(el) => {
                actionGroups.current[i] = el;
              }}
              visible={false}
            >
              {actionSpecs[i].map((s, k) => (
                <mesh
                  key={`a${k}`}
                  ref={(el) => {
                    actionRefs.current[i][k] = el;
                  }}
                  geometry={sphereGeo}
                  material={actionMats[i][s.mi]}
                  scale={s.size}
                />
              ))}
              {i === 1 &&
                sparkSpecs.map((s, k) => (
                  <mesh
                    key={`sp${k}`}
                    ref={(el) => {
                      sparkRefs.current[k] = el;
                    }}
                    geometry={sphereGeo}
                    material={actionMats[1][1]}
                    position={[Math.sin(s.angle) * 0.415, s.y, Math.cos(s.angle) * 0.415]}
                    scale={0.01}
                  />
                ))}
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

export default function ChromeStage({ progress, active, sheetRatio, onReady }: Props) {
  const dofRef = useRef<{ target?: THREE.Vector3; bokehScale: number; cocMaterial?: { worldFocusRange: number } } | null>(null);
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, 2]}
      camera={{ position: [0, 0.12, 8.8], fov: 38 }}
      // OPAQUE canvas: blending ghosted layers against an alpha framebuffer and
      // letting the BROWSER composite produces a milky wash. The full-bleed
      // canvas paints its own pool-of-light (Backdrop) from the SAME stops as
      // the page CSS — one continuous space, no seam at the cross-fade.
      gl={{ alpha: false, antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl, scene }) => {
        // Phase 3: Khronos PBR Neutral — ACES washed the metals into "CG
        // chrome"; Neutral keeps colour and contrast like product photography
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.12;
        gl.setClearColor("#0a121b", 1);
        // far edges of the machine melt into the space's ambient tone —
        // barely reaches the assembly, only the pipe extremities at distance
        scene.fog = new THREE.Fog(BACKDROP_FOG, 12, 28);
      }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Backdrop />
      {/* Studio HDRI softbox reflections — SELF-HOSTED (public/hdri) so the 3D
          never depends on a third-party CDN. The SVG plate is the no-WebGL /
          reduced-motion fallback. */}
      <Environment files={asset("/hdri/studio_small_03_1k.hdr")} environmentIntensity={0.82}>
        {/* in-scene softbox accents composited over the HDRI: two tall strips give
            the sump flanks continuous vertical highlights (the anisotropy stretches
            them further), one dim warm top-light rounds the head shoulders. All
            baked into the env map, so the window-dive env scrub dims them too. */}
        <Lightformer form="rect" position={[-6, 1, 4]} rotation-y={Math.PI / 2.6} scale={[0.9, 6.5, 1]} intensity={0.55} color="#eaf3fa" />
        <Lightformer form="rect" position={[6, 1, 4]} rotation-y={-Math.PI / 2.6} scale={[0.9, 6.5, 1]} intensity={0.55} color="#eaf3fa" />
        <Lightformer form="rect" position={[0, 8, 1]} rotation-x={-Math.PI / 2} scale={[9, 4, 1]} intensity={0.3} color="#fff2e2" />
      </Environment>

      <JourneyLights progress={progress} />

      <VesselAssembly progress={progress} />
      <Rig progress={progress} sheetRatio={sheetRatio} />
      <FocusRig progress={progress} dof={dofRef} />
      <Ready onReady={onReady} />
      {typeof window !== "undefined" && new URLSearchParams(window.location.search).has("ngdbgray") && <DebugRay />}

      {!hidden("shadows") && (
        <ContactShadows position={[0, -1.72, 0]} opacity={0.55} scale={14} blur={3} far={5} color="#000000" />
      )}

      {!hidden("post") && (
        <EffectComposer>
          {/* Phase 3 lens: focus rides the discussed part (FocusRig), off at
              the trace dock */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <DepthOfField ref={dofRef as any} target={[0, -0.1, 0]} focalLength={0.004} bokehScale={1.3} />
          {/* bloom OFF the metal speculars (the #1 CG tell) — only genuinely
              emissive things (rings, redox sparks) may glow */}
          <Bloom intensity={0.34} luminanceThreshold={0.92} luminanceSmoothing={0.3} mipmapBlur />
          {/* lens fringe kept to the frame edges — dead-centre chrome stays clinically sharp */}
          <ChromaticAberration offset={CA_OFFSET} radialModulation modulationOffset={0.3} />
          <Vignette eskil={false} offset={0.26} darkness={0.55} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
