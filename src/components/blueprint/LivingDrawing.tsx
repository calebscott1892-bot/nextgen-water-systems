"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { COLUMN_PATHS, BOM_BALLOONS, BOM_ROWS, REVISIONS } from "./columnPaths";

/**
 * THE LIVING DRAWING — the signature, drawn-onto-paper plate. A scan-line reads
 * the (implied) chrome unit off into a real draughting sheet; the NGW-01 column
 * is then traced on stroke-by-stroke as you scroll (SVG stroke-dashoffset),
 * driven by ONE pinned ScrollTrigger. Reduced motion → the fully-drawn static
 * plate (poster-grade), no ScrollTrigger.
 *
 * ⚠️ All dimensions/specs are PLACEHOLDER and flagged (*). First-pass column
 * profile — to be refined against the client's real unit.
 */
const ORDERED = [...COLUMN_PATHS].sort((a, b) => a.order - b.order);

// inline stroke (Tailwind's component layer doesn't reliably style raw SVG paths)
const STROKE: Record<string, [string, number]> = {
  centre: ["#86a8c3", 1],
  heavy: ["#0d2738", 2.4],
  hair: ["#2f6e9c", 1.3],
};

export function LivingDrawing() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const svg = svgRef.current;
    if (!root || !svg) return;

    const paths = Array.from(svg.querySelectorAll<SVGPathElement>("path[data-draw]"));
    paths.forEach((p) => {
      p.style.strokeDasharray = "1";
      p.style.strokeDashoffset = reduced ? "0" : "1";
    });

    const bom = svg.querySelector<SVGGElement>(".jd-bom");
    const tip = svg.querySelector<SVGGElement>(".jd-tip");
    const scan = svg.querySelector<SVGRectElement>(".jd-scan");
    const revRows = Array.from(root.querySelectorAll<HTMLElement>(".jd-rev-row"));

    // static, fully-drawn plate for reduced motion
    if (reduced) {
      if (bom) bom.style.opacity = "1";
      if (scan) scan.style.opacity = "0";
      if (tip) tip.style.opacity = "0";
      revRows.forEach((r) => (r.style.opacity = "1"));
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true, defaults: { ease: "none" } });

      // 1 — establishing scan reads the unit into the sheet
      if (scan) {
        gsap.set(scan, { attr: { y: 96 }, opacity: 0.9 });
        tl.to(scan, { attr: { y: 792 }, duration: 0.14, ease: "power1.inOut" }, 0);
        tl.to(scan, { opacity: 0, duration: 0.03 }, 0.14);
      }

      // 2 — trace the column stroke-by-stroke, in draughtsperson order
      const span = 0.78 / paths.length;
      paths.forEach((p, i) => {
        tl.to(p, { strokeDashoffset: 0, duration: span, ease: "power2.inOut" }, 0.12 + i * span);
      });

      // 3 — BOM balloons + revision rows accrue
      if (bom) {
        gsap.set(bom, { opacity: 0 });
        tl.to(bom, { opacity: 1, duration: 0.08 }, 0.5);
      }
      revRows.forEach((r, i) => {
        gsap.set(r, { opacity: 0 });
        tl.to(r, { opacity: 1, duration: 0.04 }, REVISIONS[i] ? REVISIONS[i].at : 0.2 + i * 0.2);
      });

      ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          tl.progress(self.progress);
          // pencil-tip rides the currently-drawing stroke head
          if (!tip) return;
          const active = paths.find((p) => {
            const o = parseFloat(p.style.strokeDashoffset || "0");
            return o > 0.001 && o < 0.999;
          });
          if (!active) {
            tip.style.opacity = "0";
            return;
          }
          const len = active.getTotalLength();
          const off = parseFloat(active.style.strokeDashoffset || "0");
          const pt = active.getPointAtLength(len * (1 - off));
          tip.style.opacity = "1";
          tip.setAttribute("transform", `translate(${pt.x} ${pt.y})`);
        },
      });
    }, root);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={rootRef} className="plate" id="drawing">
      <div className="plate-stick">
        <div className="plate-sheet">
        <svg ref={svgRef} className="plate-svg" viewBox="0 0 1200 900" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="vellum" cx="46%" cy="40%" r="75%">
              <stop offset="0%" stopColor="#f6f9fb" />
              <stop offset="62%" stopColor="#ede4cf" />
              <stop offset="100%" stopColor="#e3dcc8" />
            </radialGradient>
            <pattern id="grid5" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M20 0H0V20" fill="none" stroke="#0f2c3b" strokeWidth="0.4" opacity="0.10" />
            </pattern>
            <pattern id="grid25" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M100 0H0V100" fill="none" stroke="#0f2c3b" strokeWidth="0.7" opacity="0.16" />
            </pattern>
            <filter id="scanblur" x="-20%" y="-400%" width="140%" height="900%">
              <feGaussianBlur stdDeviation="1.4" />
            </filter>
          </defs>

          {/* sheet */}
          <rect x="0" y="0" width="1200" height="900" fill="url(#vellum)" />
          <rect x="0" y="0" width="1200" height="900" fill="url(#grid5)" />
          <rect x="0" y="0" width="1200" height="900" fill="url(#grid25)" />
          <rect x="22" y="22" width="1156" height="856" fill="none" stroke="#0f2c3b" strokeWidth="1" opacity="0.55" />
          <rect x="30" y="30" width="1140" height="840" fill="none" stroke="#0f2c3b" strokeWidth="1.6" opacity="0.8" />

          {/* the column, traced on */}
          <g className="jd-ink">
            {ORDERED.map((p) => (
              <path
                key={p.id}
                data-draw
                d={p.d}
                pathLength={1}
                fill="none"
                stroke={STROKE[p.weight][0]}
                strokeWidth={STROKE[p.weight][1]}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>

          {/* dimension value (the one active dimension) */}
          <g className="jd-dim">
            <rect x="754" y="428" width="78" height="26" fill="url(#vellum)" />
            <text x="793" y="446" className="jd-dim-t" textAnchor="middle">
              540 mm*
            </text>
          </g>

          {/* BOM balloons keyed to the parts list */}
          <g className="jd-bom">
            {BOM_BALLOONS.map((b) => (
              <g key={b.n}>
                <line x1="624" y1={b.y} x2={b.x - 16} y2={b.y} stroke="#2f6e9c" strokeWidth="0.8" />
                <circle cx={b.x} cy={b.y} r="13" fill="url(#vellum)" stroke="#0f2c3b" strokeWidth="1.2" />
                <text x={b.x} y={b.y + 4} className="jd-balloon-t" textAnchor="middle">
                  {b.n}
                </text>
              </g>
            ))}
          </g>

          {/* establishing scan-line + pencil tip */}
          <rect className="jd-scan" x="22" y="96" width="1156" height="2" fill="#29c2ee" filter="url(#scanblur)" />
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

        {/* revision table — accrues rows as you scroll (doubles as progress spine) */}
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

        {/* title block (real Geist-Mono DOM) */}
        <div className="jd-titleblock" aria-hidden="true">
          <div className="jd-tb-grid">
            <div className="jd-tb-co">NEXT GEN WATER SYSTEMS</div>
            <div className="jd-tb-title">WHOLE-HOME FILTRATION COLUMN</div>
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

        {/* bill of materials list */}
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
