"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";
import {
  ASSEMBLY_PATHS,
  ASSEMBLY_CONSTRUCTION,
  ASSEMBLY_D,
  ASSEMBLY_BALLOONS,
  VESSEL_BEDS,
  VESSEL_CX,
  BOM_ROWS,
  REVISIONS,
} from "./columnPaths";

// the live chrome asset — client-only (three touches window at module load)
const ChromeStage = dynamic(() => import("./ChromeStage"), { ssr: false });

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * THE TURN — the asset becomes its own drawing, in one continuous move. A shaded
 * steel column floats in the void; cyan construction lines measure it; paper
 * materialises as the shading dissolves and the column is traced on in ink,
 * stroke-by-stroke, with construction geometry, a riding pencil-tip, hand-jitter,
 * hatched media beds, snapping dimensions and an accruing revision table. ONE
 * pinned ScrollTrigger drives all of it (reverse-clean). Reduced motion → the
 * fully-drawn static plate.
 *
 * ⚠️ Every figure is PLACEHOLDER, flagged (*). GA of the real 3-vessel machine.
 */
const INK = [...ASSEMBLY_PATHS].filter((p) => p.id !== "dim-width").sort((a, b) => a.order - b.order);
const DIM = ASSEMBLY_PATHS.find((p) => p.id === "dim-width")!;

const STROKE: Record<string, [string, number]> = {
  centre: ["#86a8c3", 1],
  heavy: ["#0d2738", 2.4],
  hair: ["#2f6e9c", 1.3],
};

// DEV/CAPTURE aid: ?ngjp=0.62 freezes the 3D journey scalar at that value so any
// beat can be framed and captured in isolation. Read once on mount; null in
// normal use, so the scroll owns the scalar.
let DBG_JP: number | null = null;

export function LivingDrawing() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const u3d = useRef(0); // the there-and-back scalar, shared with the 3D stage
  const [webgl, setWebgl] = useState(false);
  // start rendering immediately — the journey is the first thing on screen, so
  // don't wait on the IntersectionObserver (which also fires unreliably under
  // headless virtual-time). The observer below still PAUSES it once off-screen.
  const [active, setActive] = useState(true);

  useEffect(() => {
    setWebgl(!reduced && hasWebGL());
  }, [reduced]);

  useEffect(() => {
    // namespaced key: a real-world "?jp=…" query param must not freeze the site
    const raw = new URLSearchParams(window.location.search).get("ngjp");
    const v = raw === null ? NaN : parseFloat(raw);
    if (!Number.isNaN(v)) {
      DBG_JP = Math.min(1, Math.max(0, v));
      u3d.current = DBG_JP;
    }
    return () => {
      DBG_JP = null;
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const svg = svgRef.current;
    if (!root || !svg) return;

    const ink = Array.from(svg.querySelectorAll<SVGPathElement>("path[data-ink]"));
    const con = Array.from(svg.querySelectorAll<SVGPathElement>("path[data-con]"));
    const dim = Array.from(svg.querySelectorAll<SVGPathElement>("path[data-dim]"));
    [...ink, ...con, ...dim].forEach((p) => {
      p.style.strokeDasharray = "1";
      p.style.strokeDashoffset = reduced ? "0" : "1";
    });

    const q = <T extends Element>(s: string) => svg.querySelector<T>(s);
    const paper = Array.from(svg.querySelectorAll<SVGElement>("[data-paper]"));
    const shade = q<SVGGElement>(".jd-shade");
    const beds = q<SVGGElement>(".jd-beds");
    const bom = q<SVGGElement>(".jd-bom");
    const tip = q<SVGGElement>(".jd-tip");
    const construct = q<SVGGElement>(".jd-construct");
    const col = q<SVGGElement>(".jd-col");
    const dimG = q<SVGGElement>(".jd-dim");
    const inkG = q<SVGGElement>(".jd-ink");
    const revRows = Array.from(root.querySelectorAll<HTMLElement>(".jd-rev-row"));
    const furniture = [".jd-note", ".jd-titleblock", ".jd-bomlist", ".jd-revtable"]
      .map((s) => root.querySelector<HTMLElement>(s))
      .filter(Boolean) as HTMLElement[];

    // static fully-drawn plate for reduced motion
    if (reduced) {
      paper.forEach((e) => (e.style.opacity = "1"));
      if (shade) shade.style.opacity = "0";
      if (beds) beds.style.opacity = "1";
      if (bom) bom.style.opacity = "1";
      if (dimG) dimG.style.opacity = "1";
      if (construct) construct.style.opacity = "0.16";
      if (inkG) inkG.style.color = "#15324a";
      if (tip) tip.style.opacity = "0";
      furniture.forEach((f) => (f.style.opacity = "1"));
      revRows.forEach((r) => (r.style.opacity = "1"));
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(paper, { opacity: 0 });
      gsap.set(shade, { opacity: webgl ? 0 : 1 }); // 3D chrome replaces the SVG still
      gsap.set([beds, bom, dimG], { opacity: 0 });
      gsap.set(construct, { opacity: 1 });
      gsap.set(furniture, { opacity: 0 });
      gsap.set(inkG, { color: "#f4f9fc" }); // white ink, traced over the chrome
      revRows.forEach((r) => gsap.set(r, { opacity: 0 }));

      // ONE-WAY "build" timeline: chrome still → traced in white over it → paper
      // rises, ink settles to navy → fully detailed plate. The round trip comes
      // from driving tl.progress with a there-and-back scalar (see onUpdate).
      const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });

      // 0 — the cyan scan-line reads the unit off into the drawing.
      // immediateRender:false is load-bearing: without it the from-state (a
      // visible cyan line) renders the moment the paused timeline is built —
      // the "clumsy pre-roll line" a design review rightly called out.
      const scan = q<SVGRectElement>(".jd-scan");
      if (scan)
        tl.fromTo(
          scan,
          { attr: { y: 210 }, opacity: 0.85 },
          { attr: { y: 600 }, opacity: 0, duration: 0.08, ease: "none", immediateRender: false },
          0.02,
        );
      // 1 — construction "measuring" lays down over the chrome on the void
      con.forEach((p, i) => tl.to(p, { strokeDashoffset: 0, duration: 0.05, ease: "power1.out" }, 0.04 + i * 0.018));
      // 2 — WHITE ink traces over the live chrome, STRICTLY sequential so the
      // pen-tip rides one stroke at a time (reads hand-drawn, never jumps)
      const span = 0.34 / ink.length;
      ink.forEach((p, i) => tl.to(p, { strokeDashoffset: 0, duration: span * 0.95, ease: "power2.inOut" }, 0.12 + i * span));
      // 3 — the world turns: paper rises, chrome dissolves, white ink settles to navy
      tl.to(paper, { opacity: 1, duration: 0.12, ease: "power1.inOut" }, 0.4);
      tl.to(furniture, { opacity: 1, duration: 0.12, ease: "power1.inOut" }, 0.42);
      if (!webgl) tl.to(shade, { opacity: 0, duration: 0.12, ease: "power1.inOut" }, 0.4);
      tl.to(inkG, { color: "#15324a", duration: 0.14, ease: "power1.inOut" }, 0.4);
      // 4 — construction geometry dims once the ink carries the form
      tl.to(construct, { opacity: 0.16, duration: 0.08, ease: "power1.inOut" }, 0.52);
      // 5 — media beds hatch in, dimensions + balloons snap on
      tl.to(beds, { opacity: 1, duration: 0.12 }, 0.6);
      tl.to(dimG, { opacity: 1, duration: 0.02 }, 0.66);
      dim.forEach((p, i) => tl.to(p, { strokeDashoffset: 0, duration: 0.06, ease: "power2.out" }, 0.66 + i * 0.03));
      tl.to(bom, { opacity: 1, duration: 0.1 }, 0.7);
      // 6 — revision rows accrue (the progress spine, driven from the data)
      revRows.forEach((r, i) => tl.to(r, { opacity: 1, duration: 0.04 }, REVISIONS[i]?.at ?? 0.5));

      // one frame-state function drives everything (scroll AND the ?ngjp freeze,
      // which must apply without any scroll event ever firing)
      const applyFrame = (p: number) => {
        {
          // The 3D journey owns the whole scroll (orbit → dock → rotate → through
          // → split → settle). The blueprint round trip is ONE early act: a
          // windowed there-and-back over p∈[0.10, 0.33] — starting only once the
          // camera has DOCKED, so the ink never traces over a moving model.
          const bp = gsap.utils.clamp(0, 1, gsap.utils.mapRange(0.1, 0.33, 0, 1, p));
          // trapezoid, not triangle: draw in over the first 38%, HOLD the finished
          // plate through the middle, un-draw over the last 38%
          const bpU = gsap.utils.clamp(0, 1, Math.min(bp / 0.38, (1 - bp) / 0.38));
          tl.progress(bpU);

          // 3D reads the raw journey scalar; the canvas hides only while the
          // vellum plate is full (so the drawing reads as ink, not ink-over-chrome)
          u3d.current = p;
          if (canvasWrapRef.current) {
            canvasWrapRef.current.style.opacity = String(
              gsap.utils.clamp(0, 1, gsap.utils.mapRange(0.46, 0.62, 1, 0, bpU)),
            );
          }

          // fallback-only parallax tilt on the SVG still (when there's no live 3D
          // chrome to register against); with WebGL the ink must stay un-skewed.
          // The else-branch is load-bearing (review-confirmed): the effect first
          // runs with webgl=false and leaves a raw stale transform attribute that
          // ctx.revert() cannot undo — the webgl run must actively clear it.
          if (col) {
            if (!webgl) {
              const t = gsap.utils.clamp(0, 1, gsap.utils.mapRange(0, 0.24, 1, 0, bpU));
              col.setAttribute(
                "transform",
                `translate(540 440) skewY(${-2.4 * t}) scale(${1 + 0.05 * t}, ${1 + 0.02 * t}) translate(-540 -440)`,
              );
            } else {
              col.removeAttribute("transform");
            }
          }

          // pen-tip rides the active stroke head (and rides it backward on revert)
          if (tip) {
            const active = ink.find((pp) => {
              const o = parseFloat(pp.style.strokeDashoffset || "0");
              return o > 0.001 && o < 0.999;
            });
            if (!active) {
              tip.style.opacity = "0";
            } else {
              const len = active.getTotalLength();
              const off = parseFloat(active.style.strokeDashoffset || "0");
              const pt = active.getPointAtLength(len * (1 - off));
              tip.style.opacity = "1";
              tip.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
            }
          }
        }
      };

      const st = ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        invalidateOnRefresh: true,
        // ?ngjp freezes the WHOLE frame state (ink + cross-fade + 3D) at one
        // scalar, so a capture is WYSIWYG of the real scroll at that point
        onUpdate: (self) => applyFrame(DBG_JP ?? self.progress),
      });
      // apply the initial frame immediately — ScrollTrigger doesn't fire
      // onUpdate at creation, and the ?ngjp freeze must work with zero scroll.
      // Seed from st.progress (not 0) so scroll-restored loads land mid-journey.
      applyFrame(DBG_JP ?? st.progress);
    }, root);

    return () => ctx.revert();
  }, [reduced, webgl]);

  // pause the 3D frameloop when the section is off-screen
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !webgl) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0 });
    io.observe(root);
    return () => io.disconnect();
  }, [webgl]);

  return (
    <section ref={rootRef} className="plate" id="drawing" data-sheet="01" data-rev="C" data-name="GENERAL ARRANGEMENT">
      <div className="plate-stick">
        <div className="plate-sheet">
          {webgl && (
            <div className="plate-canvas" ref={canvasWrapRef}>
              <ChromeStage progress={u3d} active={active} />
            </div>
          )}
          <svg ref={svgRef} className="plate-svg" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid meet">
            <defs>
              <radialGradient id="vellum" cx="46%" cy="40%" r="75%">
                <stop offset="0%" stopColor="#f6f9fb" />
                <stop offset="62%" stopColor="#ede4cf" />
                <stop offset="100%" stopColor="#e3dcc8" />
              </radialGradient>
              <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#161f27" />
                <stop offset="26%" stopColor="#56656f" />
                <stop offset="48%" stopColor="#9aa7b0" />
                <stop offset="60%" stopColor="#6c7a84" />
                <stop offset="100%" stopColor="#141d24" />
              </linearGradient>
              <linearGradient id="steelCap" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2a343c" />
                <stop offset="50%" stopColor="#aebac2" />
                <stop offset="100%" stopColor="#222d35" />
              </linearGradient>
              <pattern id="h-vert" width="7" height="7" patternUnits="userSpaceOnUse">
                <path d="M2 0V7" stroke="#28506f" strokeWidth="0.8" opacity="0.5" />
              </pattern>
              <pattern id="h-diag" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <path d="M2 0V8" stroke="#28506f" strokeWidth="0.8" opacity="0.45" />
              </pattern>
              <pattern id="h-grid" width="9" height="9" patternUnits="userSpaceOnUse">
                <path d="M9 0H0V9" fill="none" stroke="#28506f" strokeWidth="0.7" opacity="0.4" />
              </pattern>
              <pattern id="h-dots" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="3" cy="3" r="1" fill="#28506f" opacity="0.5" />
              </pattern>
              <pattern id="h-stipple" width="12" height="12" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="3" r="0.9" fill="#28506f" opacity="0.5" />
                <circle cx="8" cy="7" r="0.9" fill="#28506f" opacity="0.5" />
                <circle cx="5" cy="10" r="0.9" fill="#28506f" opacity="0.5" />
              </pattern>
              <clipPath id="bodyClip">
                <path d={ASSEMBLY_D} />
              </clipPath>
              <pattern id="grid5" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M20 0H0V20" fill="none" stroke="#0f2c3b" strokeWidth="0.4" opacity="0.10" />
              </pattern>
              <pattern id="grid25" width="100" height="100" patternUnits="userSpaceOnUse">
                <path d="M100 0H0V100" fill="none" stroke="#0f2c3b" strokeWidth="0.7" opacity="0.16" />
              </pattern>
              <filter id="pencil" x="-5%" y="-5%" width="110%" height="110%">
                <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="1" seed="7" result="n" />
                <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
              </filter>
              <filter id="scanblur" x="-20%" y="-400%" width="140%" height="900%">
                <feGaussianBlur stdDeviation="1.4" />
              </filter>
            </defs>

            {/* paper sheet (fades in as the metal dissolves) */}
            <rect data-paper className="jd-vellum" x="0" y="0" width="1200" height="900" fill="url(#vellum)" />
            <rect data-paper x="0" y="0" width="1200" height="900" fill="url(#grid5)" />
            <rect data-paper x="0" y="0" width="1200" height="900" fill="url(#grid25)" />
            <rect data-paper x="22" y="22" width="1156" height="856" fill="none" stroke="#0f2c3b" strokeWidth="1" opacity="0.55" />
            <rect data-paper x="30" y="30" width="1140" height="840" fill="none" stroke="#0f2c3b" strokeWidth="1.6" opacity="0.8" />

            <g className="jd-col">
              {/* shaded metal asset — what we meet before it becomes a drawing */}
              <g className="jd-shade">
                <path d={ASSEMBLY_D} fill="url(#steel)" />
                {VESSEL_CX.map((cx) => (
                  <ellipse key={cx} cx={cx - 28} cy="470" rx="9" ry="130" fill="#cfd8de" opacity="0.35" />
                ))}
              </g>

              {/* construction geometry — the faint cyan set-up */}
              <g className="jd-construct">
                {ASSEMBLY_CONSTRUCTION.map((c) => (
                  <path
                    key={c.id}
                    data-con
                    d={c.d}
                    pathLength={1}
                    fill="none"
                    stroke="#29c2ee"
                    strokeWidth="0.9"
                    strokeDasharray="1"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </g>

              {/* hatched cartridge zones, one per vessel */}
              <g className="jd-beds" clipPath="url(#bodyClip)">
                {VESSEL_BEDS.map((b) => (
                  <rect key={b.id} x={b.x0} y={b.y0} width={b.x1 - b.x0} height={b.y1 - b.y0} fill={`url(#${b.hatch})`} />
                ))}
              </g>

              {/* the ink — traced on, with hand-jitter */}
              <g className="jd-ink" filter="url(#pencil)">
                {INK.map((p) => (
                  <path
                    key={p.id}
                    data-ink
                    d={p.d}
                    pathLength={1}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={STROKE[p.weight][1]}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </g>

              {/* the one active dimension */}
              <g className="jd-dim">
                <path
                  data-dim
                  d={DIM.d}
                  pathLength={1}
                  fill="none"
                  stroke="#2f6e9c"
                  strokeWidth="1.3"
                  vectorEffect="non-scaling-stroke"
                />
                <rect x="498" y="623" width="84" height="24" fill="url(#vellum)" />
                <text x="540" y="640" className="jd-dim-t" textAnchor="middle">
                  1120 mm*
                </text>
              </g>

              {/* BOM balloons — above each vessel head, leader dropping to the cap */}
              <g className="jd-bom">
                {ASSEMBLY_BALLOONS.map((b) => (
                  <g key={b.n}>
                    <line x1={b.x} y1={b.y + 14} x2={b.x} y2={222} stroke="#2f6e9c" strokeWidth="0.8" />
                    <circle cx={b.x} cy={b.y} r="13" fill="url(#vellum)" stroke="#0f2c3b" strokeWidth="1.2" />
                    <text x={b.x} y={b.y + 4} className="jd-balloon-t" textAnchor="middle">
                      {b.n}
                    </text>
                  </g>
                ))}
              </g>
            </g>

            {/* establishing scan-line + pencil tip */}
            <rect className="jd-scan" x="22" y="96" width="1156" height="2" fill="#29c2ee" filter="url(#scanblur)" opacity="0" />
            <g className="jd-tip" opacity="0">
              <circle r="3.4" fill="none" stroke="#29c2ee" strokeWidth="1.4" />
              <path d="M-9 0H9 M0 -9V9" stroke="#29c2ee" strokeWidth="0.8" opacity="0.7" />
            </g>
          </svg>

          {/* draughtsman's note — the one permitted lowercase line */}
          <div className="jd-note">
            <span className="jd-eyebrow">NGW-01 · GENERAL ARRANGEMENT</span>
            <p>you can&rsquo;t photograph the inside of a sealed vessel. so we drew it.</p>
          </div>

          {/* revision table — accrues rows as you scroll */}
          <div className="jd-revtable" aria-hidden="true">
            <div className="jd-rev">
              <div className="jd-rev-head">
                <span>REV</span>
                <span>DESCRIPTION</span>
              </div>
              {REVISIONS.map((r) => (
                <div className="jd-rev-row" key={r.rev}>
                  <span>{r.rev}</span>
                  <span>{r.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* title block */}
          <div className="jd-titleblock" aria-hidden="true">
            <div className="jd-tb-grid">
              <div className="jd-tb-co">NEXT GEN WATER SYSTEMS</div>
              <div className="jd-tb-title">WHOLE-HOME FILTRATION — 3-VESSEL ASSEMBLY</div>
              <div className="jd-tb-cell">
                <i>DWG NO</i>NGW-01 · 1 / 4
              </div>
              <div className="jd-tb-cell">
                <i>SCALE</i>1:2*
              </div>
              <div className="jd-tb-cell">
                <i>MATERIAL</i>316L*
              </div>
              <div className="jd-tb-cell">
                <i>DATE</i>26.06.26
              </div>
              <div className="jd-tb-stamp">INDICATIVE · PLACEHOLDER*</div>
            </div>
          </div>

          {/* bill of materials */}
          <div className="jd-bomlist" aria-hidden="true">
            <div className="jd-bomlist-head">BILL OF MATERIALS</div>
            {BOM_ROWS.map((r) => (
              <div className="jd-bomlist-row" key={r[0]}>
                <span>{r[0]}</span>
                <span>{r[1]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
