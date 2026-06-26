import { Renderer, Geometry, Program, Mesh, Triangle, Vec2 } from "ogl";
import { GLSL_NOISE, GLSL_CAUSTICS } from "./shaderlib";

/**
 * "Particle Purification Field" hero (per the locked build spec).
 *
 * Closed-form, INSTANCED particles — the whole simulation lives in the vertex
 * shader (no FBO, no ping-pong, no float render targets → survives mid-range
 * phones). Contaminant specks spawn chaotic + dull up top, fall to a filtration
 * boundary, and cross into ordered, glowing cyan droplets. Drawn in two passes
 * (contaminant alpha-blended, clean additive) around one full-screen membrane
 * pass (glass band + caustics + monogram specular). Cursor exerts an
 * inverse-square force that disturbs the flow; it re-settles when still.
 *
 * Lifecycle mirrors the sibling build: DPR cap, IntersectionObserver pause,
 * resize guard, full teardown (no loseContext → StrictMode-safe), feature-detect
 * → static fallback, and a real frozen frame under reduced motion.
 */

export type ParticleFieldOptions = {
  reduced?: boolean;
  onFps?: (fps: number) => void;
};

export type ParticleFieldHandle = {
  supported: boolean;
  start: () => void;
  stop: () => void;
  resize: () => void;
  renderStatic: () => void;
  destroy: () => void;
};

const PARTICLE_VERT = `
attribute vec2 position;
attribute vec2 uv;
attribute vec4 aSeed;
attribute float aLane;
attribute float aBirth;
uniform float uTime, uBoundary, uCursorActive, uDpr, uReduce;
uniform vec2 uRes, uCursor;
varying vec2 vUv;
varying float vClean;
varying float vSpark;
varying float vRand;
vec2 hash22(vec2 p){ vec3 a = fract(vec3(p.xyx) * vec3(0.1031, 0.103, 0.0973)); a += dot(a, a.yzx + 33.33); return fract((a.xx + a.yz) * a.zy); }
void main(){
  vUv = uv; vRand = aSeed.x;
  float fall = uReduce > 0.5 ? aBirth : fract(aBirth + uTime * 0.06 + aSeed.x * 0.04);
  float y = 1.0 - fall;                                  // top(1) -> bottom(0)
  float chaosX = aLane + (aSeed.y - 0.5) * 0.18;         // wide scatter up top
  float t = smoothstep(uBoundary + 0.05, uBoundary - 0.05, y); // 0 above -> 1 below
  vClean = t;
  float x = mix(chaosX, aLane, t);                       // snap onto lane crossing the line
  float chaos = 1.0 - t;
  vec2 j = hash22(aSeed.zw + floor(uTime * 8.0)) - 0.5;  // ~8Hz reroll = contaminant grit
  x += j.x * 0.06 * chaos; y += j.y * 0.015 * chaos;
  x += sin(uTime * 1.3 + aSeed.w * 6.2831 + y * 9.0) * 0.025 * chaos; // smooth swirl
  x += sin(uTime * 0.8 + aLane * 12.0) * 0.004 * t;      // faint laminar sway below
  vec2 P = vec2(x, y);
  vec2 d = P - uCursor; d.x *= uRes.x / uRes.y;          // aspect-correct
  float r2 = dot(d, d);
  float force = min(uCursorActive * 0.020 / (r2 + 0.004), 0.12); // inverse-square, clamped
  P += normalize(d + 1e-4) * force;
  vSpark = t * smoothstep(0.02, 0.0, abs(P.y - (uBoundary - 0.18))) * step(0.45, abs(P.x - 0.5));
  float size = mix(1.4, 3.0, t) * (0.7 + aSeed.x * 0.6) * uDpr;
  vec2 ndc = P * 2.0 - 1.0;
  vec2 px = position * size / uRes * 2.0;
  gl_Position = vec4(ndc + px, 0.0, 1.0);
}`;

const PARTICLE_FRAG = `
precision highp float;
varying vec2 vUv;
varying float vClean;
varying float vSpark;
varying float vRand;
uniform float uPass; // 0 contaminant, 1 clean
void main(){
  if (uPass < 0.5 && vClean > 0.5) discard;   // contaminant pass: only specks
  if (uPass > 0.5 && vClean <= 0.5) discard;  // clean pass: only droplets
  float r = length(vUv - 0.5) * 2.0;
  float disc = smoothstep(1.0, 0.0, r);
  vec3 steel = vec3(0.682, 0.725, 0.761);
  vec3 cyan = vec3(0.161, 0.760, 0.933);
  vec3 deep = vec3(0.059, 0.435, 0.690);
  if (uPass < 0.5){                            // CONTAMINANT: matte steel speck, no glow
    float speck = disc * disc;
    vec3 col = steel * (0.32 + 0.22 * vRand);
    gl_FragColor = vec4(col * speck, speck * 0.55);
  } else {                                     // CLEAN: cyan core + deep rim + additive bloom
    float core = exp(-r * r * 4.5);
    float halo = exp(-r * r * 1.3);
    vec3 col = mix(deep, cyan, core) + cyan * halo * 0.6;
    col += vec3(1.0) * vSpark * 0.8;
    float a = core + halo * 0.7;
    gl_FragColor = vec4(col * a, a);           // premultiplied; additive blend
  }
}`;

const MEMBRANE_VERT = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`;

const MEMBRANE_FRAG = `
precision highp float;
varying vec2 vUv;
uniform float uTime, uBoundary;
uniform vec2 uRes;
${GLSL_NOISE}
${GLSL_CAUSTICS}
void main(){
  vec2 uv = vUv;
  float aspect = uRes.x / max(uRes.y, 1.0);
  vec3 cyan = vec3(0.161, 0.760, 0.933);
  vec3 ice = vec3(0.957, 0.976, 0.988);

  // wavy glass band pinned at the boundary
  float wob = 0.008 * sin(uv.x * 12.0 + uTime * 1.1) + 0.006 * (fbm(vec2(uv.x * 4.0, uTime * 0.3)) - 0.5);
  float band = exp(-pow((uv.y - (uBoundary + wob)) * 20.0, 2.0));
  vec3 col = cyan * band * 0.5;

  // caustics in a thin band just below the line
  float below = smoothstep(0.0, 0.12, uBoundary - uv.y);
  float ca = caustics(vec2(uv.x * aspect, uv.y) * 1.5 + vec2(0.0, uTime * 0.05), uTime * 0.4);
  col += ca * cyan * below * (1.0 - below) * 0.6;

  // monogram specular "catch" — a soft glint at centre that sweeps with the flow
  float mono = smoothstep(0.13, 0.0, length((uv - vec2(0.5, uBoundary)) * vec2(aspect, 1.0)));
  float sweep = pow(sin(uv.x * 3.0 - uTime * 0.7) * 0.5 + 0.5, 8.0);
  col += ice * mono * sweep * 0.55;

  float a = clamp(band * 0.6 + below * (1.0 - below) * ca * 0.5 + mono * sweep * 0.55, 0.0, 0.9);
  gl_FragColor = vec4(col, a);
}`;

function pickCount(): { count: number; dprCap: number } {
  const coarse =
    typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const w = typeof window !== "undefined" ? window.innerWidth : 1280;
  if (coarse) return { count: 7000, dprCap: 1.5 };
  if (w < 1024) return { count: 12000, dprCap: 1.75 };
  return { count: 20000, dprCap: 2 };
}

export function createParticleField(
  canvas: HTMLCanvasElement,
  opts: ParticleFieldOptions = {},
): ParticleFieldHandle {
  const noop: ParticleFieldHandle = {
    supported: false,
    start() {},
    stop() {},
    resize() {},
    renderStatic() {},
    destroy() {},
  };

  const { count, dprCap } = pickCount();
  const dpr = Math.min(typeof devicePixelRatio === "number" ? devicePixelRatio : 1, dprCap);

  let renderer: Renderer;
  try {
    renderer = new Renderer({
      canvas,
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
      dpr,
    });
  } catch {
    return noop;
  }
  const gl = renderer.gl;
  if (!gl) return noop;
  renderer.autoClear = false;

  // ---- shared uniforms (same {value} refs across programs) ----
  const uTime = { value: 0 };
  const uBoundary = { value: 0.58 };
  const uCursor = { value: new Vec2(0.5, 0.5) };
  const uCursorActive = { value: 0 };
  const uRes = { value: new Vec2(1, 1) };
  const uDpr = { value: dpr };
  const uReduce = { value: opts.reduced ? 1 : 0 };

  // ---- instanced particle geometry ----
  const aSeed = new Float32Array(count * 4);
  const aLane = new Float32Array(count);
  const aBirth = new Float32Array(count);
  const LANES = 48;
  for (let i = 0; i < count; i++) {
    aSeed[i * 4 + 0] = Math.random();
    aSeed[i * 4 + 1] = Math.random();
    aSeed[i * 4 + 2] = Math.random();
    aSeed[i * 4 + 3] = Math.random();
    const lane = Math.floor(Math.random() * LANES) / (LANES - 1);
    aLane[i] = 0.09 + lane * 0.82;
    aBirth[i] = Math.random();
  }

  const geometry = new Geometry(gl, {
    position: { size: 2, data: new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5]) },
    uv: { size: 2, data: new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]) },
    index: { data: new Uint16Array([0, 1, 2, 1, 3, 2]) },
    aSeed: { instanced: 1, size: 4, data: aSeed },
    aLane: { instanced: 1, size: 1, data: aLane },
    aBirth: { instanced: 1, size: 1, data: aBirth },
  });

  const particleProgram = new Program(gl, {
    vertex: PARTICLE_VERT,
    fragment: PARTICLE_FRAG,
    uniforms: { uTime, uBoundary, uCursor, uCursorActive, uRes, uDpr, uReduce, uPass: { value: 0 } },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    cullFace: false,
  });
  const particleMesh = new Mesh(gl, { geometry, program: particleProgram });

  const membraneProgram = new Program(gl, {
    vertex: MEMBRANE_VERT,
    fragment: MEMBRANE_FRAG,
    uniforms: { uTime, uBoundary, uRes },
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const membraneMesh = new Mesh(gl, { geometry: new Triangle(gl), program: membraneProgram });

  // ---- pointer ----
  let targetX = 0.5;
  let targetY = 0.5;
  let targetActive = 0;
  const move = (clientX: number, clientY: number) => {
    const r = canvas.getBoundingClientRect();
    targetX = (clientX - r.left) / r.width;
    targetY = 1 - (clientY - r.top) / r.height; // y-up to match shader space
    targetActive = 1;
  };
  const onMouse = (e: MouseEvent) => {
    if (e.clientY >= window.innerHeight) return;
    if ((e.target as Element | null)?.closest?.("header, [data-no-fluid]")) return;
    move(e.clientX, e.clientY);
  };
  const onTouch = (e: TouchEvent) => {
    const t = e.touches[0];
    if (t) move(t.clientX, t.clientY);
  };

  function resize() {
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (!cw || !ch) return;
    renderer.setSize(cw, ch);
    uRes.value.set(canvas.width, canvas.height);
  }

  function draw() {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    particleProgram.uniforms.uPass.value = 0;
    particleProgram.setBlendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    renderer.render({ scene: particleMesh });
    renderer.render({ scene: membraneMesh });
    particleProgram.uniforms.uPass.value = 1;
    particleProgram.setBlendFunc(gl.SRC_ALPHA, gl.ONE);
    renderer.render({ scene: particleMesh });
  }

  let running = false;
  let raf = 0;
  let t0 = performance.now();
  let fpsAcc = 0;
  let fpsFrames = 0;

  function frame(now: number) {
    if (!running) return;
    const dt = Math.min((now - t0) / 1000, 0.05);
    uTime.value = (now - tStart) / 1000;

    const c = uCursor.value;
    c.x += (targetX - c.x) * 0.12;
    c.y += (targetY - c.y) * 0.12;
    uCursorActive.value += (targetActive - uCursorActive.value) * 0.1;
    targetActive *= 0.94; // decay toward stillness

    if (opts.onFps) {
      fpsAcc += dt;
      fpsFrames++;
      if (fpsAcc >= 0.5) {
        opts.onFps(Math.round(fpsFrames / fpsAcc));
        fpsAcc = 0;
        fpsFrames = 0;
      }
    }
    t0 = now;
    draw();
    raf = requestAnimationFrame(frame);
  }

  let tStart = performance.now();

  resize();
  window.addEventListener("mousemove", onMouse);
  window.addEventListener("touchmove", onTouch, { passive: true });

  function start() {
    if (running || opts.reduced) return;
    running = true;
    t0 = performance.now();
    tStart = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }
  function renderStatic() {
    uReduce.value = 1;
    uCursorActive.value = 0;
    uTime.value = 0;
    resize();
    draw();
  }
  function destroy() {
    stop();
    window.removeEventListener("mousemove", onMouse);
    window.removeEventListener("touchmove", onTouch as EventListener);
    try {
      particleProgram.remove();
      membraneProgram.remove();
      geometry.remove();
      (membraneMesh.geometry as Geometry).remove();
    } catch {
      /* GC will reclaim if remove() is unavailable */
    }
  }

  return { supported: true, start, stop, resize, renderStatic, destroy };
}
