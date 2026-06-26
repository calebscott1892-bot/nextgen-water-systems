"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * A reusable drawing SHEET. Double border + plate-number header + corner datum
 * tick; on enter a cyan scan-line sweeps and the content draws in (CSS, via an
 * `is-drawn` class toggled by ScrollTrigger). Reduced motion → drawn immediately.
 * Carries `data-sheet/rev/name` so the persistent DrawingChrome can read it.
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
    if (reduced) {
      el.classList.add("is-drawn");
      return;
    }
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 72%",
        onEnter: () => el.classList.add("is-drawn"),
        onLeaveBack: () => el.classList.remove("is-drawn"),
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
