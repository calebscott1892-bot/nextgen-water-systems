/**
 * FLOW TEST — a self-contained raw-WebGL strip for Plate 04. Dirty water enters
 * at the top (murky, grime motes) and clarifies stage by stage to clean, faintly
 * cyan water with a caustic shimmer at the base. Loops while in view. Same
 * lifecycle discipline as the hero WebGL: feature-detect → handle, DPR cap, full
 * teardown (StrictMode-safe), loud shader-compile logging.
 *
 * Visual only — the per-stage reduction story is illustrative; all real figures
 * live (flagged *) on Plate 05.
 */
export type CleanseHandle = {
  supported: boolean;
  start(): void;
  stop(): void;
  resize(): void;
  destroy(): void;
};

const VERT = `attribute vec2 p; varying vec2 vUv; void main(){ vUv = p*0.5+0.5; gl_Position = vec4(p,0.0,1.0); }`;

const FRAG = `precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uRes;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y);
}
float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<4;i++){ v+=a*noise(p); p*=2.0; a*=0.5; } return v; }

void main(){
  vec2 uv = vUv;                 // y: 0 = outlet (base), 1 = inlet (top)
  float aspect = uRes.x / max(uRes.y, 1.0);

  // purity rises toward the base, stepping at five media beds
  float p = smoothstep(0.96, 0.04, uv.y);
  float stepped = floor(p * 5.0) / 5.0;
  float purity = clamp(mix(p, stepped + 0.1, 0.55), 0.0, 1.0);

  vec3 dirty = vec3(0.30, 0.285, 0.17);
  vec3 clean = vec3(0.36, 0.79, 0.93);
  vec3 col = mix(dirty, clean, purity);

  // drifting grime, gated out as it clarifies
  float g = fbm(vec2(uv.x * aspect * 7.0, uv.y * 16.0 + uTime * 0.55));
  float mote = smoothstep(0.62, 0.68, g) * (1.0 - purity);
  col = mix(col, vec3(0.13, 0.11, 0.06), mote * 0.85);

  // slow vertical flow streaks in the turbid region
  float streak = fbm(vec2(uv.x * aspect * 3.0, uv.y * 5.0 + uTime * 0.8));
  col += (streak - 0.5) * (1.0 - purity) * 0.16;

  // caustic shimmer where the water has cleared
  float ca = max(sin(uv.x * aspect * 9.0 + uTime * 1.4) * sin(uv.y * 11.0 - uTime * 1.1), 0.0);
  col += ca * vec3(0.30, 0.55, 0.66) * purity * 0.22;

  gl_FragColor = vec4(col, 0.96);
}`;

export function createCleanseStrip(canvas: HTMLCanvasElement, opts: { maxDPR?: number } = {}): CleanseHandle {
  const noop: CleanseHandle = { supported: false, start() {}, stop() {}, resize() {}, destroy() {} };
  const glCtx = (canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: false, depth: false }) ||
    canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
  if (!glCtx) return noop;
  const gl: WebGLRenderingContext = glCtx;

  const maxDPR = opts.maxDPR ?? 2;
  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error("[cleanse] compile:", gl.getShaderInfoLog(sh));
    return sh;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) console.error("[cleanse] link:", gl.getProgramInfoLog(prog));

  const quad = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const locP = gl.getAttribLocation(prog, "p");
  const uTime = gl.getUniformLocation(prog, "uTime");
  const uRes = gl.getUniformLocation(prog, "uRes");

  let running = false;
  let raf = 0;
  let t0 = performance.now();

  function resize() {
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (!cw || !ch) return;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDPR);
    const w = Math.floor(cw * dpr);
    const h = Math.floor(ch * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  function frame(now: number) {
    if (!running) return;
    const t = (now - t0) / 1000;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(locP);
    gl.vertexAttribPointer(locP, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1f(uTime, t);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    raf = requestAnimationFrame(frame);
  }

  resize();
  return {
    supported: true,
    start() {
      if (running) return;
      resize();
      running = true;
      t0 = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
    resize,
    destroy() {
      this.stop();
      gl.deleteBuffer(quad);
      gl.deleteProgram(prog);
    },
  };
}
