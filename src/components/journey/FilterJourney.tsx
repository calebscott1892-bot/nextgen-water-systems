"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { Button } from "@/components/ui/Button";
import { PHASE1_BEATS, PHASE1_MAX_P } from "@/content/journey";

// R3F must never run on the server (three touches window at module load).
const FilterScene = dynamic(() => import("./FilterScene"), { ssr: false });

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * The teardown journey. One persistent filter in a pinned canvas; the HTML beats
 * cross-fade over it as a single ScrollTrigger pushes scroll progress (0..MAX)
 * into the scene. Reduced-motion / no-WebGL drop to a premium static hero (the
 * full static-journey fallback comes in a later phase). PHASE 1 = beats 0–4.
 */
export function FilterJourney() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [webgl, setWebgl] = useState(true);
  const [active, setActive] = useState(true);
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    setWebgl(hasWebGL());
  }, []);

  const live = !reduced && webgl;

  // pinned scroll driver
  useEffect(() => {
    if (!live) return;
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
        pin: ".journey-stage",
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress * PHASE1_MAX_P;
          progress.current = p;
          let idx = 0;
          for (let i = 0; i < PHASE1_BEATS.length; i++) {
            if (p >= PHASE1_BEATS[i].range[0]) idx = i;
          }
          setBeat(idx);
        },
      });
    }, root);
    return () => ctx.revert();
  }, [live]);

  // pause the scene off-screen
  useEffect(() => {
    if (!live) return;
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0 });
    io.observe(root);
    return () => io.disconnect();
  }, [live]);

  // ---- static fallback (reduced motion / no WebGL) ----
  if (!live) {
    const hero = PHASE1_BEATS[0];
    return (
      <section className="journey journey--static" id="top">
        <div className="journey-fallback" aria-hidden="true" />
        <div className="journey-grid" aria-hidden="true" />
        <div className="wrap journey-static-inner">
          <div className="hero-eyebrow">
            <span className="ln" /> {hero.kicker}
          </div>
          <h1 className="journey-h1">{hero.heading}</h1>
          <p className="journey-sub">{hero.body}</p>
          <div className="hero-cta">
            <Button variant="primary" href="#book">
              Book your free water test
            </Button>
            <Button variant="ghost" href="#system">
              See how it works
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="journey" id="top" ref={rootRef}>
      <div className="journey-stage">
        <div className="journey-fallback journey-fallback--behind" aria-hidden="true" />
        <FilterScene progress={progress} active={active} beat={beat} />
        <div className="journey-grad" aria-hidden="true" />

        <div className="journey-hud">
          <div className="wrap">
            {PHASE1_BEATS.map((b, i) => (
              <div key={b.id} className={`jbeat jbeat--${b.id} ${i === beat ? "is-active" : ""}`.trim()}>
                {b.kicker && (
                  <div className="hero-eyebrow">
                    <span className="ln" /> {b.kicker}
                  </div>
                )}
                {b.id === "hero" ? (
                  <h1 className="journey-h1">{b.heading}</h1>
                ) : (
                  <h2 className="journey-h1">{b.heading}</h2>
                )}
                {b.body && <p className="journey-sub">{b.body}</p>}
                {b.id === "hero" && (
                  <div className="hero-cta">
                    <Button variant="primary" href="#book">
                      Book your free water test
                    </Button>
                    <Button variant="ghost" href="#system">
                      See how it works
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="journey-progress" aria-hidden="true">
          {PHASE1_BEATS.map((_, i) => (
            <i key={i} className={i === beat ? "on" : ""} />
          ))}
        </div>
      </div>
    </section>
  );
}
