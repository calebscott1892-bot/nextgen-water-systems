"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { BACKDROP_CSS } from "@/components/blueprint/backdrop";

/**
 * THE SOURCE — a drawn parallax landing that surveys a mountain spring in the
 * site's own contour ink (no stock photography), then scrolls INTO the journey.
 * Summits and the spring basin are drawn as genuine CLOSED topographic contour
 * loops (nested, slope-varying spacing, index lines with inline elevations,
 * downslope hachures) — not the layered-waveform trope. As the section scrolls
 * out, the ridges settle away and the spring gathers and rises into THREE
 * shafts, one per vessel, handing off into the 3-vessel machine that fades up
 * in the SAME void (shared BACKDROP_CSS, zero seam).
 *
 * ONE ScrollTrigger drives the parallax. It rides the site's single Lenis for
 * free (SmoothScroll wires lenis.on("scroll", ScrollTrigger.update)) — this
 * component NEVER creates its own smooth-scroll instance. Reduced motion → a
 * still, fully-drawn source plate.
 */

// closed smooth loop through `pts` as control points (quadratic midpoints)
function smoothClosed(pts: [number, number][]): string {
  const n = pts.length;
  const mid = (a: [number, number], b: [number, number]) =>
    [((a[0] + b[0]) / 2).toFixed(1), ((a[1] + b[1]) / 2).toFixed(1)] as const;
  let [mx, my] = mid(pts[0], pts[1]);
  let d = `M${mx} ${my}`;
  for (let i = 1; i <= n; i++) {
    const p = pts[i % n];
    const [nx, ny] = mid(pts[i % n], pts[(i + 1) % n]);
    d += ` Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${nx} ${ny}`;
  }
  return d + " Z";
}

// an organic closed contour loop — irregular like real surveyed terrain, not a
// mechanical ellipse (which reads as radar/HUD)
function blob(cx: number, cy: number, rx: number, ry: number, seed: number, wobble = 0.1, n = 22): string {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const w =
      Math.sin(a * 3 + seed) * wobble +
      Math.sin(a * 5 + seed * 1.9 + 1) * wobble * 0.5 +
      Math.sin(a * 2 - seed) * wobble * 0.3;
    const rr = 1 + w;
    pts.push([cx + Math.cos(a) * rx * rr, cy + Math.sin(a) * ry * rr]);
  }
  return smoothClosed(pts);
}

// short downslope hachure ticks around a contour (outward = downhill for a
// summit, inward for a basin depression)
function hachures(cx: number, cy: number, rx: number, ry: number, seed: number, out = 1.12, n = 12): string {
  let d = "";
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + seed;
    const x1 = cx + Math.cos(a) * rx;
    const y1 = cy + Math.sin(a) * ry;
    const x2 = cx + Math.cos(a) * rx * out;
    const y2 = cy + Math.sin(a) * ry * out;
    d += `M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} `;
  }
  return d.trim();
}

type Ring = { d: string; index: boolean };
type Summit = { cont: Ring[]; labels: { x: number; y: number; text: string }[]; hach: string };

// nested closed contours around a summit: spacing tightens inward (steep peak),
// centre leans up as it climbs, index every 3rd contour carries a datum.
function makeSummit(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed: number,
  rings: number,
  leanUp: number,
  elevBase: number,
  interval: number,
): Summit {
  const cont: Ring[] = [];
  const labels: { x: number; y: number; text: string }[] = [];
  for (let k = 0; k < rings; k++) {
    const t = k / (rings - 1);
    const f = Math.pow(1 - t, 1.32); // tighter spacing toward the peak
    const cyK = cy - leanUp * t;
    const index = k % 3 === 0;
    cont.push({ d: blob(cx, cyK, rx * f, ry * f, seed + k * 0.4, 0.1 + k * 0.006), index });
    if (index && k > 0 && k < rings - 1) {
      labels.push({ x: cx + rx * f + 8, y: cyK - ry * f * 0.2, text: `${elevBase + k * interval} m` });
    }
  }
  return { cont, labels, hach: hachures(cx, cy, rx, ry, seed, 1.12, 12) };
}

// FAR plane (faint, slow) and MID plane (bold, dominant) summits
// distinct datums per summit so no two labelled elevations read as a copy-paste
const FAR_SUMMITS = [
  makeSummit(300, 300, 214, 62, 2.1, 6, 40, 400, 100), // → 700 m
  makeSummit(1130, 276, 244, 72, 5.3, 6, 44, 500, 100), // → 800 m
];
const MID_SUMMITS = [
  makeSummit(720, 322, 300, 92, 3.4, 9, 74, 600, 100), // central massif → 900 / 1200 m
  makeSummit(236, 398, 188, 58, 7.1, 6, 44, 300, 100), // → 600 m
  makeSummit(1196, 372, 196, 60, 1.7, 6, 44, 450, 100), // → 750 m
];

// the spring BASIN — nested IRREGULAR depression contours (egg-shaped, not a
// radar target); inward hachures mark the low
const BASIN: Ring[] = Array.from({ length: 7 }, (_, k) => ({
  d: blob(720, 712, 336 - k * 44, 110 - k * 14, 4.2 + k * 0.7, 0.14 + k * 0.022, 26),
  index: k % 2 === 0,
}));
const BASIN_HACH = hachures(720, 712, 300, 98, 0.4, 0.9, 14);

const FAR = FAR_SUMMITS;
const MID = MID_SUMMITS;

// where the three vessels sit — the gather resolves to three shafts on these x
const SHAFT_X = [604, 720, 836];

export function SourceHeader() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    if (!root) return;

    const L = (s: string) => root.querySelector<HTMLElement>(s);
    const layers = {
      dust: L(".src-dust"),
      far: L(".src-far"),
      mid: L(".src-mid"),
      mist: L(".src-mist"),
      pool: L(".src-pool"),
      shafts: L(".src-shafts"),
      survey: L(".src-survey"),
      copy: L(".src-copy"),
    };

    const ctx = gsap.context(() => {
      const clamp = gsap.utils.clamp(0, 1);
      const map = gsap.utils.mapRange;

      const apply = (p: number) => {
        const set = (el: HTMLElement | null, rate: number, extra = "") => {
          if (el) el.style.transform = `translate3d(0, ${(-p * rate).toFixed(2)}vh, 0) ${extra}`;
        };
        set(layers.dust, 6);
        set(layers.far, 12);
        set(layers.mid, 24);
        set(layers.mist, 38);
        set(layers.survey, 30);

        // the basin condenses and lifts a little as the hand-off begins — the
        // heavy vertical work is done by the three shafts, not a big scale.
        const gather = clamp(map(0.58, 1, 0, 1, p));
        set(layers.pool, 50, `scale(${(1 - gather * 0.42).toFixed(3)}, ${(1 + gather * 0.28).toFixed(3)})`);
        if (layers.pool) layers.pool.style.opacity = String(clamp(map(0.82, 0.98, 1, 0, p)) * 0.5 + 0.5);

        // THREE shafts rise and brighten, then the whole thing dissolves to void
        if (layers.shafts) {
          const rise = clamp(map(0.56, 0.88, 0, 1, p));
          const out = clamp(map(0.9, 1, 1, 0, p));
          layers.shafts.style.opacity = String(rise * out);
          layers.shafts.style.transform = `translate3d(0, ${((1 - rise) * 10).toFixed(1)}vh, 0) scaleY(${(
            0.4 +
            rise * 0.6
          ).toFixed(3)})`;
        }

        // copy leads the exit
        if (layers.copy) {
          layers.copy.style.opacity = String(clamp(map(0.06, 0.34, 1, 0, p)));
          layers.copy.style.transform = `translate3d(0, ${(-p * 30).toFixed(1)}vh, 0)`;
        }

        // landforms fade out so the machine is born from an empty void; survey
        // furniture goes to ZERO before the gather can smear it
        if (layers.far) layers.far.style.opacity = String(clamp(map(0.5, 0.9, 1, 0, p)));
        if (layers.mid) layers.mid.style.opacity = String(clamp(map(0.52, 0.9, 1, 0, p)));
        if (layers.survey) layers.survey.style.opacity = String(clamp(map(0.34, 0.58, 0.6, 0, p)));
        if (layers.mist) layers.mist.style.opacity = String(clamp(map(0.4, 0.85, 0.85, 0, p)));
        if (layers.dust) layers.dust.style.opacity = String(clamp(map(0.6, 1, 0.7, 0, p)));

        // the basin contours fade as the shafts take over (no lingering lozenge)
        const bfade = clamp(map(0.58, 0.82, 1, 0, p));
        root.querySelectorAll<SVGElement>(".src-ring").forEach((r) => (r.style.opacity = String(0.5 * bfade)));
      };

      apply(0);
      ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5,
        invalidateOnRefresh: true,
        onUpdate: (self) => apply(self.progress),
      });
    }, root);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={rootRef}
      className={`src${reduced ? " src--static" : ""}`}
      aria-label="Next Gen Water Systems — as pure as the source"
      style={{ background: BACKDROP_CSS }}
    >
      {/* shared draughting defs: ink jitter, grain, glows */}
      <svg className="src-defs" aria-hidden="true" width="0" height="0">
        <defs>
          <filter id="src-ink" x="-6%" y="-6%" width="112%" height="112%">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.014" numOctaves="3" seed="6" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="5.6" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="src-ink-soft" x="-6%" y="-6%" width="112%" height="112%">
            <feTurbulence type="fractalNoise" baseFrequency="0.011" numOctaves="2" seed="11" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="3.9" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="src-grainf" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" result="g" />
            <feColorMatrix in="g" type="matrix" values="0 0 0 0 0.6  0 0 0 0 0.74  0 0 0 0 0.86  0 0 0 0.13 0" />
          </filter>
          <radialGradient id="src-glowg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#29c2ee" stopOpacity="0.2" />
            <stop offset="55%" stopColor="#1c6c93" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#0a1a24" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="src-shaftg" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#8fe6ff" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#29c2ee" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#29c2ee" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <div className="src-stick">
        {/* faint high-altitude dust — the deepest, slowest plane */}
        <div className="src-dust" aria-hidden="true" />

        {/* FAR summits — cold, low-contrast closed contours */}
        <div className="src-far" aria-hidden="true">
          <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
            <g filter="url(#src-ink-soft)">
              {FAR.map((s, si) => (
                <g key={si}>
                  <path d={s.hach} className="src-hach" />
                  {s.cont.map((c, ci) => (
                    <path key={ci} d={c.d} className={`src-ridge src-ridge--far${c.index ? " is-index" : ""}`} />
                  ))}
                </g>
              ))}
            </g>
            {FAR.map((s, si) =>
              s.labels.map((l, li) => (
                <text key={`${si}-${li}`} x={l.x} y={l.y} className="src-elev">
                  {l.text}
                </text>
              )),
            )}
          </svg>
        </div>

        {/* MID massif — dominant, denser, bolder ink */}
        <div className="src-mid" aria-hidden="true">
          <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
            <g filter="url(#src-ink)">
              {MID.map((s, si) => (
                <g key={si}>
                  <path d={s.hach} className="src-hach" />
                  {s.cont.map((c, ci) => (
                    <path key={ci} d={c.d} className={`src-ridge src-ridge--mid${c.index ? " is-index" : ""}`} />
                  ))}
                </g>
              ))}
              {/* watercourses draining the massif to the source — ties the high
                  ground to the spring so the void reads as surveyed terrain */}
              <g className="src-drain">
                <path d="M720 434 Q702 506 716 560 Q730 610 720 640" />
                <path d="M606 474 Q648 544 704 582" />
                <path d="M842 456 Q800 540 736 578" />
                <path d="M470 486 Q560 548 690 596" />
              </g>
            </g>
            {MID.map((s, si) =>
              s.labels.map((l, li) => (
                <text key={`${si}-${li}`} x={l.x} y={l.y} className="src-elev">
                  {l.text}
                </text>
              )),
            )}
            {/* a surveyed spot-height in the open ground so it is not empty void */}
            <g className="src-spot">
              <path d="M436 470 l10 10 M446 470 l-10 10" />
              <text x="456" y="478" className="src-elev">
                420 m
              </text>
            </g>
          </svg>
        </div>

        {/* drifting MIST bands (idle CSS drift + scroll parallax) */}
        <div className="src-mist" aria-hidden="true">
          <span className="src-mist-a" />
          <span className="src-mist-b" />
          <span className="src-mist-c" />
        </div>

        {/* clear-zone: a soft radial darken behind the hero copy so no contour
            ever threads through the words */}
        <div className="src-scrim" aria-hidden="true" />

        {/* survey furniture — north arrow + scale bar, restrained */}
        <div className="src-survey" aria-hidden="true">
          <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
            <g filter="url(#src-ink-soft)">
              <g transform="translate(1330 726)">
                <path d="M0 -26 L7 8 L0 1 L-7 8 Z" className="src-north" />
                <text x="0" y="26" className="src-tick-t" textAnchor="middle">
                  N
                </text>
              </g>
              <g transform="translate(96 800)">
                <line x1="0" y1="0" x2="150" y2="0" className="src-scale" />
                {[0, 50, 100, 150].map((x) => (
                  <line key={x} x1={x} y1="-4" x2={x} y2="4" className="src-scale" />
                ))}
                <rect x="0" y="-4" width="50" height="8" className="src-scale-fill" />
                <rect x="100" y="-4" width="50" height="8" className="src-scale-fill" />
                <text x="0" y="20" className="src-tick-t">
                  0
                </text>
                <text x="150" y="20" className="src-tick-t" textAnchor="end">
                  1 km
                </text>
              </g>
            </g>
          </svg>
        </div>

        {/* the SPRING — a surveyed basin: glow, irregular depression contours,
            hand-hatched refraction, and a drafted benchmark (not a HUD node) */}
        <div className="src-pool" aria-hidden="true">
          <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
            <ellipse cx="720" cy="712" rx="420" ry="150" fill="url(#src-glowg)" />
            <g filter="url(#src-ink)">
              <path d={BASIN_HACH} className="src-basin-hach" />
              {BASIN.map((c, i) => (
                <path key={i} d={c.d} className={`src-ring${c.index ? " is-index" : ""}`} />
              ))}
              {/* hand-hatched refraction glints, not concentric arcs */}
              <path
                d="M672 706 l16 10 M700 700 l14 12 M740 700 l14 12 M766 708 l16 9 M712 724 l12 10 M726 724 l12 10"
                className="src-refract"
              />
            </g>
            {/* drafted survey benchmark at the source: trig triangle + datum */}
            <g className="src-bm">
              <path d="M720 700 L731 719 L709 719 Z" className="src-bm-tri" />
              <circle cx="720" cy="712.5" r="2.2" className="src-bm-dot" />
              <line x1="720" y1="700" x2="720" y2="614" className="src-lead" />
              <text x="720" y="600" className="src-src-t" textAnchor="middle">
                THE SOURCE · DATUM 0.00
              </text>
            </g>
          </svg>
        </div>

        {/* the three shafts the source rises into — one per vessel (hand-off) */}
        <div className="src-shafts" aria-hidden="true">
          <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
            <g filter="url(#src-ink-soft)">
              {SHAFT_X.map((x) => (
                <g key={x}>
                  <rect x={x - 2} y="378" width="4" height="336" fill="url(#src-shaftg)" />
                  <ellipse cx={x} cy="712" rx="16" ry="5" className="src-shaft-base" />
                </g>
              ))}
            </g>
          </svg>
        </div>

        {/* the landing copy */}
        <div className="src-copy">
          <div className="src-rule">
            <span>NGW-01</span>
            <i aria-hidden="true" />
            <span>SOURCE SURVEY</span>
          </div>
          <h1 className="src-h">
            As pure as
            <br />
            the source.
          </h1>
          <p className="src-sub">
            One machine at the mains, engineered so every tap in the house runs clean, clear water. Drawn,
            specified and built to last.
          </p>
          <div className="src-actions">
            <a className="src-cta" href="#plate-cta">
              Book your free water test
            </a>
            <a className="src-ghost" href="#drawing">
              Scroll into the drawing ↓
            </a>
          </div>
        </div>

        {/* film-grain tooth so the void reads as inked stock, not flat black */}
        <div className="src-noise" aria-hidden="true">
          <svg viewBox="0 0 1440 900" preserveAspectRatio="none">
            <rect width="1440" height="900" filter="url(#src-grainf)" />
          </svg>
        </div>
        {/* vignette so the eye settles to the centre pool-of-light */}
        <div className="src-grain" aria-hidden="true" />
      </div>
    </section>
  );
}
