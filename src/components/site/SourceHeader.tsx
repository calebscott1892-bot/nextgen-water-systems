"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { BACKDROP_CSS } from "@/components/blueprint/backdrop";

/**
 * THE SOURCE — a drawn parallax landing that says "water, as pure as its
 * source" in the site's own draughting language, then scrolls INTO the
 * journey. A topographic mountain spring is rendered entirely as contour ink
 * (no stock photography): far peaks, mid ridges, drifting mist and a concentric
 * spring pool, each layer parallaxing at its own depth. As the section scrolls
 * out, the ridges settle away and the spring's rings rise and gather into a
 * column — a visual hand-off into the 3-vessel machine that fades up in the
 * SAME void (shared BACKDROP_CSS, zero seam).
 *
 * ONE ScrollTrigger drives the parallax. It rides the site's single Lenis for
 * free (SmoothScroll wires lenis.on("scroll", ScrollTrigger.update)) — this
 * component NEVER creates its own smooth-scroll instance. Reduced motion → a
 * still, fully-drawn source plate (no parallax, no hand-off).
 */

// contour ridge line generator: a gently undulating polyline across the width,
// seeded so far/mid ridges read as distinct landforms, not repeats.
function ridge(baseY: number, amp: number, seed: number, dip = 0): string {
  const pts: string[] = [];
  const N = 9;
  for (let i = 0; i <= N; i++) {
    const x = (1440 / N) * i;
    // layered sines → natural ridgeline; `dip` sinks the middle for a valley
    const y =
      baseY +
      Math.sin(i * 0.9 + seed) * amp +
      Math.sin(i * 2.3 + seed * 1.7) * amp * 0.4 -
      Math.sin((i / N) * Math.PI) * dip;
    pts.push(`${x.toFixed(0)},${y.toFixed(1)}`);
  }
  return "M" + pts.map((p, i) => (i === 0 ? p : `L${p}`)).join(" ");
}

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
      copy: L(".src-copy"),
      cue: L(".src-cue"),
    };
    const rings = Array.from(root.querySelectorAll<SVGElement>(".src-ring"));

    const ctx = gsap.context(() => {
      const clamp = gsap.utils.clamp(0, 1);
      const map = gsap.utils.mapRange;

      const apply = (p: number) => {
        // depth parallax — deeper layers drift up slowest. Values in vh.
        const set = (el: HTMLElement | null, rate: number, extra = "") => {
          if (el) el.style.transform = `translate3d(0, ${(-p * rate).toFixed(2)}vh, 0) ${extra}`;
        };
        set(layers.dust, 6);
        set(layers.far, 12);
        set(layers.mid, 24);
        set(layers.mist, 38);
        // the pool sits nearest — it travels most, and near the end it rises
        // and stretches into a column as the hand-off begins
        const gather = clamp(map(0.62, 1, 0, 1, p));
        const poolScaleX = 1 - gather * 0.72;
        const poolScaleY = 1 + gather * 0.9;
        set(layers.pool, 52, `scale(${poolScaleX.toFixed(3)}, ${poolScaleY.toFixed(3)})`);

        // copy leads the exit: fully present at the top, gone by ~40%
        if (layers.copy) {
          const o = clamp(map(0.06, 0.34, 1, 0, p));
          layers.copy.style.opacity = String(o);
          layers.copy.style.transform = `translate3d(0, ${(-p * 30).toFixed(1)}vh, 0)`;
        }
        if (layers.cue) layers.cue.style.opacity = String(clamp(map(0.02, 0.16, 1, 0, p)));

        // the landforms fade as the hand-off takes over so the journey's
        // machine is born from an empty void, not layered over a mountain
        if (layers.far) layers.far.style.opacity = String(clamp(map(0.5, 0.92, 1, 0, p)));
        if (layers.mid) layers.mid.style.opacity = String(clamp(map(0.55, 0.95, 1, 0, p)));
        if (layers.mist) layers.mist.style.opacity = String(clamp(map(0.4, 0.85, 0.85, 0, p)));
        if (layers.dust) layers.dust.style.opacity = String(clamp(map(0.6, 1, 0.7, 0, p)));

        // the rings brighten and tighten as they gather into the column, then
        // dissolve — the last thing standing before the machine takes over
        rings.forEach((r, i) => {
          const gathered = clamp(map(0.62, 0.98, 1, 0, p));
          r.style.opacity = String((0.16 + i * 0.1) * (0.4 + 0.6 * (1 - gather)) * gathered);
        });
      };

      apply(0);
      ScrollTrigger.create({
        trigger: root,
        start: "top top",
        // END WHEN THE STICKY STAGE UNPINS (scrollY = height − vh), not when the
        // section fully clears — so the whole parallax + hand-off plays out
        // while the stage is actually pinned and on screen.
        end: "bottom bottom",
        scrub: 0.5,
        invalidateOnRefresh: true,
        onUpdate: (self) => apply(self.progress),
      });
    }, root);

    return () => ctx.revert();
  }, [reduced]);

  // concentric spring-pool contour rings (ellipses, shrinking inward)
  const RINGS = [0, 1, 2, 3, 4, 5, 6];

  return (
    <section
      ref={rootRef}
      className={`src${reduced ? " src--static" : ""}`}
      aria-label="Next Gen Water Systems — as pure as the source"
      style={{ background: BACKDROP_CSS }}
    >
      <div className="src-stick">
        {/* faint high-altitude dust / stars — the deepest, slowest plane */}
        <div className="src-dust" aria-hidden="true" />

        {/* FAR peaks — thin, cold, low-contrast contour ridges */}
        <div className="src-far" aria-hidden="true">
          <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
            {[210, 250, 292].map((y, i) => (
              <path key={y} d={ridge(y, 26, i * 2.1)} className="src-ridge src-ridge--far" pathLength={1} />
            ))}
            <text x="1180" y="204" className="src-elev">
              1420 m
            </text>
          </svg>
        </div>

        {/* MID ridge — the dominant landform, bolder ink */}
        <div className="src-mid" aria-hidden="true">
          <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
            {[420, 470, 524].map((y, i) => (
              <path key={y} d={ridge(y, 40, 3 + i * 1.6, 40)} className="src-ridge src-ridge--mid" pathLength={1} />
            ))}
            {/* fall-line ticks: a couple of draughting hachures down the slope */}
            <path d="M470 470 L455 512 M600 452 L588 498 M840 452 L852 500" className="src-hach" />
            <text x="150" y="452" className="src-elev">
              980 m
            </text>
          </svg>
        </div>

        {/* drifting MIST bands (idle CSS drift + scroll parallax) */}
        <div className="src-mist" aria-hidden="true">
          <span className="src-mist-a" />
          <span className="src-mist-b" />
        </div>

        {/* the SPRING — concentric contour rings over a soft glow, the source */}
        <div className="src-pool" aria-hidden="true">
          <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
            <ellipse cx="720" cy="712" rx="360" ry="118" className="src-glow" />
            {RINGS.map((i) => (
              <ellipse
                key={i}
                cx="720"
                cy="712"
                rx={340 - i * 46}
                ry={112 - i * 15}
                className="src-ring"
                pathLength={1}
              />
            ))}
            {/* a single spec label, like a survey callout on the source */}
            <line x1="720" y1="712" x2="720" y2="612" className="src-lead" />
            <circle cx="720" cy="612" r="3" className="src-lead-dot" />
            <text x="720" y="596" className="src-src-t">
              THE SOURCE
            </text>
          </svg>
        </div>

        {/* the landing copy */}
        <div className="src-copy">
          <div className="src-rule">
            <span>NEXT GEN WATER SYSTEMS</span>
            <i aria-hidden="true" />
            <span>NGW-01</span>
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

        <span className="src-cue" aria-hidden="true">
          SOURCE → SYSTEM
        </span>

        {/* shared film grain + vignette so the plane sits in the same stock */}
        <div className="src-grain" aria-hidden="true" />
      </div>
    </section>
  );
}
