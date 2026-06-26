"use client";

import { useEffect, useState } from "react";
import { SITE_REVISIONS } from "@/content/plates";

/**
 * The document-is-the-site spine. A fixed Geist-Mono title block (bottom-right)
 * re-stamps DWG / SHEET / VIEW / REV as each sheet enters, flipping to APPROVED
 * FOR ISSUE on the CTA; a revision rail accrues a row per sheet reached and
 * doubles as the nav. Reads the DOM `[data-sheet]` plates via IntersectionObserver
 * — pure DOM, no 3D risk.
 */
export function DrawingChrome() {
  const [active, setActive] = useState({ sheet: "01", name: "GENERAL ARRANGEMENT", rev: "C" });
  const [reached, setReached] = useState<string[]>([]);

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-sheet]"));
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        let best: IntersectionObserverEntry | null = null;
        for (const e of entries) {
          if (e.isIntersecting) {
            const id = (e.target as HTMLElement).id;
            setReached((r) => (r.includes(id) ? r : [...r, id]));
            if (!best || e.intersectionRatio > best.intersectionRatio) best = e;
          }
        }
        if (best) {
          const t = best.target as HTMLElement;
          setActive({ sheet: t.dataset.sheet || "01", name: t.dataset.name || "", rev: t.dataset.rev || "" });
        }
      },
      { threshold: [0.2, 0.5, 0.8], rootMargin: "-25% 0px -25% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const approved = active.sheet === "09";
  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <aside className="chrome">
      <nav className="chrome-rev" aria-label="Drawing revisions">
        {SITE_REVISIONS.map((r) => (
          <button
            key={r.rev}
            type="button"
            className={`chrome-rev-row ${active.rev === r.rev ? "on" : ""} ${reached.includes(r.id) ? "reached" : "pending"}`.trim()}
            onClick={() => go(r.id)}
            title={`Sheet ${r.sheet} · ${r.desc}`}
          >
            <span className="crr-rev">{r.rev}</span>
            <span className="crr-sheet">{r.sheet}</span>
            <span className="crr-desc">{r.desc}</span>
          </button>
        ))}
      </nav>
      <div className="chrome-tb">
        <div className="chrome-tb-co">NEXT GEN WATER SYSTEMS</div>
        <div className="chrome-tb-grid">
          <div className="chrome-tb-cell">
            <i>DWG</i>NGW-01
          </div>
          <div className="chrome-tb-cell">
            <i>SHEET</i>
            {active.sheet} / 09
          </div>
          <div className="chrome-tb-cell chrome-tb-view">
            <i>VIEW</i>
            {active.name || "—"}
          </div>
        </div>
        <div className={`chrome-tb-stamp ${approved ? "approved" : ""}`.trim()}>
          {approved ? "APPROVED FOR ISSUE" : "INDICATIVE · PLACEHOLDER*"}
        </div>
      </div>
    </aside>
  );
}
