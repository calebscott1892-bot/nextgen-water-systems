"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * A reusable drawing SHEET. Double border + plate-number header + corner datum
 * tick; on enter a cyan scan-line sweeps and the sheet RE-DRAFTS itself — the
 * linework draws on (stroke-dashoffset), callouts arrive in sequence, and any
 * [data-count] figures tick up. Reduced motion → drawn immediately. Carries
 * `data-sheet/rev/name` so the persistent DrawingChrome can read it.
 */
export function Plate({
  id,
  sheet,
  rev,
  name,
  plateNo,
  kicker,
  className = "",
  children,
}: {
  id: string;
  sheet: string;
  rev: string;
  name: string;
  plateNo: string;
  kicker: string;
  className?: string;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const counts = Array.from(el.querySelectorAll<HTMLElement>("[data-count]"));

    if (reduced) {
      el.classList.add("is-drawn");
      counts.forEach((c) => (c.textContent = formatCount(c, +(c.dataset.count || 0))));
      return;
    }

    // The whole reveal (content arrive + linework draw-on) is CSS, gated on the
    // reliably-toggled `is-drawn` class — so content can never get stuck hidden.
    // GSAP only ticks the figures up, and degrades to the static value if it
    // doesn't run. `is-animated` opts the sheet into the hidden-until-drawn state
    // only once JS is alive (no-JS shows everything).
    el.classList.add("is-animated");

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 74%",
        onEnter: () => {
          if (el.classList.contains("is-drawn")) return;
          el.classList.add("is-drawn");
          counts.forEach((c) => {
            const end = +(c.dataset.count || 0);
            const o = { v: 0 };
            gsap.to(o, {
              v: end,
              duration: 0.9,
              ease: "power1.out",
              onUpdate: () => (c.textContent = formatCount(c, o.v)),
            });
          });
        },
      });
    }, el);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={ref}
      id={id}
      className={`sheet ${className}`.trim()}
      data-sheet={sheet}
      data-rev={rev}
      data-name={name}
    >
      <div className="sheet-frame">
        <header className="sheet-head">
          <span className="sheet-no">{plateNo}</span>
          <span className="sheet-kicker">{kicker}</span>
          <span className="sheet-tick" aria-hidden="true" />
        </header>
        <span className="sheet-scan" aria-hidden="true" />
        <div className="sheet-body">{children}</div>
      </div>
    </section>
  );
}

function formatCount(c: HTMLElement, v: number) {
  return `${c.dataset.prefix || ""}${Math.round(v)}${c.dataset.suffix || ""}`;
}

/** A drawing callout: balloon number → leader line + arrowhead → figure + note. */
export function Callout({
  n,
  label,
  value,
  note,
  className = "",
}: {
  n: string;
  label: string;
  value?: string;
  note?: string;
  className?: string;
}) {
  return (
    <div className={`callout ${className}`.trim()}>
      <span className="callout-balloon">{n}</span>
      <span className="callout-lead" aria-hidden="true" />
      <span className="callout-text">
        <span className="callout-label">{label}</span>
        {value && <span className="callout-value">{value}</span>}
        {note && <span className="callout-note">{note}</span>}
      </span>
    </div>
  );
}
