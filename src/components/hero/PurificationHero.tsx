"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, SplitText } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { Button } from "@/components/ui/Button";
import { createParticleField } from "./particleField";

/**
 * Signature hero — "Particle Purification Field".
 * The live ogl field (contaminants → a filtration boundary → ordered glowing
 * droplets, cursor-reactive) renders into #purify over the static gradient
 * ground. Reduced-motion renders one frozen frame of the real artwork; no-WebGL
 * shows the static frame. Tuning knobs (particle count, DPR cap, boundary) live
 * in particleField.ts.
 */
export function PurificationHero() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const [fallback, setFallback] = useState(false);
  const [fps, setFps] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // --- ogl particle field ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const field = createParticleField(canvas, { reduced, onFps: setFps });
    if (!field.supported) {
      setFallback(true);
      return;
    }

    const doResize = () => {
      field.resize();
      if (reduced) field.renderStatic();
    };
    const ro = new ResizeObserver(doResize);
    ro.observe(canvas);
    window.addEventListener("resize", doResize);
    const r1 = requestAnimationFrame(doResize);
    const r2 = requestAnimationFrame(() => requestAnimationFrame(doResize));

    let io: IntersectionObserver | null = null;
    if (reduced) {
      field.renderStatic();
    } else {
      io = new IntersectionObserver(
        ([entry]) => (entry.isIntersecting ? field.start() : field.stop()),
        { threshold: 0.01 },
      );
      io.observe(canvas);
    }

    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
      window.removeEventListener("resize", doResize);
      ro.disconnect();
      io?.disconnect();
      field.destroy();
    };
  }, [reduced]);

  // --- headline line-mask reveal ---
  useEffect(() => {
    const h1 = h1Ref.current;
    if (!h1) return;
    if (reduced) {
      h1.style.opacity = "1";
      return;
    }
    let split: SplitText | null = null;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      h1.style.opacity = "1";
      try {
        split = new SplitText(h1, { type: "lines", mask: "lines" });
        gsap.from(split.lines, {
          yPercent: 115,
          duration: 1.1,
          ease: "power4.out",
          stagger: 0.12,
          delay: 0.15,
        });
      } catch {
        gsap.fromTo(h1, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, ease: "power3.out" });
      }
    };
    if (document.fonts?.ready) document.fonts.ready.then(run);
    else run();
    return () => {
      cancelled = true;
      split?.revert();
    };
  }, [reduced]);

  // --- eyebrow / sub / CTAs reveal ---
  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    if (!root) return;
    const items = root.querySelectorAll(".hero-eyebrow, .hero-sub, .hero-cta");
    gsap.set(items, { opacity: 0, y: 22 });
    const tween = gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 1,
      stagger: 0.12,
      delay: 0.45,
      ease: "power3.out",
    });
    return () => {
      tween.kill();
      gsap.set(items, { clearProps: "all" });
    };
  }, [reduced]);

  return (
    <section className="hero" id="top" ref={rootRef}>
      <canvas
        id="purify"
        ref={canvasRef}
        aria-hidden="true"
        style={fallback ? { display: "none" } : undefined}
      />
      <div className="hero-fallback" aria-hidden="true" />
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-vignette" aria-hidden="true" />

      <div className="hero-inner">
        <div className="wrap">
          <div className="hero-eyebrow">
            <span className="ln" /> Next Gen Water Systems
          </div>
          <h1 ref={h1Ref} style={{ opacity: reduced ? 1 : 0 }}>
            Purity, <em>by design.</em>
          </h1>
          <p className="hero-sub">
            A whole-home water refining system — engineered in Australia to remove what you can’t
            see, and prove it.
          </p>
          <div className="hero-cta">
            <Button variant="primary" href="#book">
              Book your free water test
            </Button>
            <Button variant="ghost" href="#system">
              Explore the system
            </Button>
          </div>
        </div>
      </div>

      <div className="hero-scroll" aria-hidden="true">
        Scroll
      </div>

      {mounted && process.env.NODE_ENV === "development" && !fallback && !reduced && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 96,
            right: 16,
            zIndex: 5,
            font: "12px ui-monospace, monospace",
            color: "var(--cyan)",
            background: "rgba(5,8,12,0.7)",
            border: "1px solid rgba(41,194,238,0.3)",
            borderRadius: 8,
            padding: "7px 10px",
            pointerEvents: "none",
          }}
        >
          {fps == null ? "…" : fps} fps
        </div>
      )}
    </section>
  );
}
