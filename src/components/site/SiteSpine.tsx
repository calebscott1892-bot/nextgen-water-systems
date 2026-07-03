"use client";

import { useEffect, useRef } from "react";
import { Plate, Callout } from "./Plate";
import { Button } from "@/components/ui/Button";
import { CONTACT, SITE_REVISIONS } from "@/content/plates";
import { SILHOUETTE_D, BEDS } from "@/components/blueprint/columnPaths";
import { createCleanseStrip } from "@/components/fluid/cleanseStrip";
import { useReducedMotion } from "@/lib/useReducedMotion";

/* ───────────────────────── PLATE 02 — TRUST ───────────────────────── */
function TrustPlate() {
  return (
    <Plate id="plate-trust" sheet="02" rev="D" name="GENERAL NOTES" plateNo="PLATE 02" kicker="REV D · DWG NGW-01 · GENERAL NOTES">
      <div className="sheet-split">
        <div className="sheet-lead">
          <h2 className="sheet-h">
            BUILT TO A STANDARD,
            <br />
            NOT TO A PRICE.
          </h2>
          <p className="sheet-p">
            Most home filters are bought in, badged and boxed. The NGW-01 is one sealed column — drawn, toleranced and
            signed off before a single unit is built, the way you engineer a machine, not assemble a kit. Read the figures
            on these sheets like a spec sheet, because that is what they are. Every one is a placeholder pending
            substantiation; drawings carry tolerances, and so do our claims.
          </p>
        </div>
        <div className="notes-col" aria-label="General notes">
          <Callout n="01" label="AUSTRALIAN DESIGNED & MADE*" />
          <Callout n="02" label="UNIVERSITY R&D PARTNERSHIPS*" />
          <Callout n="03" label="INTERNATIONAL DESIGN AWARDS*" />
          <Callout n="04" label="UP TO 96% CONTAMINANT REDUCTION*" />
        </div>
      </div>
    </Plate>
  );
}

/* ──────────────────────── PLATE 03 — PROBLEM ──────────────────────── */
function ProblemPlate() {
  // leader angles aim AT each callout's CSS position (SVG y-down degrees)
  const items = [
    { n: "01", a: 328, label: "CHLORINE", note: "taste, odour, by-products" },
    { n: "02", a: 26, label: "LEAD (Pb)", note: "from older fittings*" },
    { n: "03", a: 112, label: "PFAS", note: "‘forever chemicals’*" },
    { n: "04", a: 205, label: "SEDIMENT", note: "grit · rust · scale" },
  ];
  return (
    <Plate id="plate-problem" sheet="03" rev="E" name="DETAIL A — CONTAMINANTS" plateNo="PLATE 03" kicker="REV E · DETAIL A — SCALE 4:1 · UNFILTERED SUPPLY">
      <div className="sheet-split">
        <div className="sheet-lead">
          <h2 className="sheet-h">
            THE WATER YOU TRUST
            <br />
            CARRIES WHAT YOU CAN’T SEE.
          </h2>
          <p className="sheet-p">
            Town water is treated to be safe to supply — not to be the best water your family could drink. On the way to
            your tap it can pick up chlorine, dissolved lead, PFAS that treatment was never built to remove, and fine
            sediment you only notice once it’s in the glass. None of it changes how the water looks.{" "}
            <span className="ink-underline">Clear isn’t the same as clean.</span>
          </p>
          <p className="sheet-fig">DETAIL A · NOT TO SCALE · presence and levels confirmed by your free in-home test*</p>
        </div>
        <div className="detail-wrap">
          <svg viewBox="0 0 420 420" className="detail-svg" aria-hidden="true">
            <circle className="lw-draw" cx="210" cy="210" r="150" pathLength={1} />
            <circle className="detail-fill" cx="210" cy="210" r="150" />
            {items.map((it) => {
              const rad = (it.a * Math.PI) / 180;
              // extend past the r=150 circle so the leader visibly reaches its callout
              const x = 210 + Math.cos(rad) * 172;
              const y = 210 + Math.sin(rad) * 172;
              return <line key={it.n} className="lw-draw lw-lead" x1="210" y1="210" x2={x} y2={y} pathLength={1} />;
            })}
          </svg>
          <div className="detail-callouts">
            {items.map((it) => (
              <Callout key={it.n} n={it.n} label={it.label} note={it.note} className={`dc dc--${it.n}`} />
            ))}
          </div>
        </div>
      </div>
    </Plate>
  );
}

/* ─────────────────────── PLATE 04 — FLOW TEST ─────────────────────── */
const STAGES = [
  { n: "1", title: "SEDIMENT", job: "20µm pre-filter · grit, rust, scale*" },
  { n: "2", title: "CARBON BLOCK", job: "chlorine, taste & odour*" },
  { n: "3", title: "RO MEMBRANE", job: "dissolved solids, lead, PFAS*" },
  { n: "4", title: "POST-CARBON", job: "final polish*" },
  { n: "5", title: "RE-MINERALISE", job: "balanced pH & minerals*" },
];
function FlowTestPlate() {
  const reduced = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const strip = createCleanseStrip(canvas);
    if (!strip.supported) return;
    const ro = new ResizeObserver(() => strip.resize());
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? strip.start() : strip.stop()), { threshold: 0.05 });
    io.observe(canvas);
    requestAnimationFrame(() => strip.resize());
    return () => {
      io.disconnect();
      ro.disconnect();
      strip.destroy();
    };
  }, [reduced]);

  return (
    <Plate id="plate-flowtest" sheet="04" rev="F" name="SECTION A–A · FLOW TEST" plateNo="PLATE 04" kicker="REV F · SECTION A–A · FLOW TEST" className="sheet--center">
      <div className="flow-head">
        <h2 className="sheet-h">
          FIVE STAGES.
          <br />
          ONE QUIET COLUMN.
        </h2>
        <p className="sheet-p">
          The whole idea, drawn as a test rig. Water enters at the top carrying everything from the previous sheet and
          leaves the base clear — five media beds, each doing one job, in order.
        </p>
      </div>
      <div className="flow-stage">
        <svg viewBox="280 90 470 730" className="flow-svg" aria-hidden="true">
          <defs>
            <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5c5638" />
              <stop offset="34%" stopColor="#6f7a52" />
              <stop offset="62%" stopColor="#4f93b8" />
              <stop offset="100%" stopColor="#bfeefb" />
            </linearGradient>
            <clipPath id="flowClip">
              <path d={SILHOUETTE_D} />
            </clipPath>
          </defs>
          {/* static turbid→clear fallback (shows if WebGL is unavailable) */}
          <g clipPath="url(#flowClip)">
            <rect x="324" y="120" width="312" height="640" fill="url(#flowGrad)" />
          </g>
          {/* live WebGL flow test, masked to the column */}
          <foreignObject x="324" y="120" width="312" height="640" clipPath="url(#flowClip)">
            <canvas ref={canvasRef} className="flow-canvas" />
          </foreignObject>
          {/* the drawn section, on top */}
          <path className="lw-draw lw-heavy2" d={SILHOUETTE_D} pathLength={1} fill="none" />
          {BEDS.map((b) => (
            <line key={b.id} className="lw-draw lw-hair2" x1="340" y1={b.y0} x2="620" y2={b.y0} pathLength={1} />
          ))}
          {/* IN / OUT */}
          <text x="480" y="108" className="flow-io" textAnchor="middle">
            IN ▾
          </text>
          <text x="480" y="792" className="flow-io" textAnchor="middle">
            ▾ OUT
          </text>
          {/* overall height dimension */}
          <line className="lw-hair2" x1="636" y1="130" x2="700" y2="130" />
          <line className="lw-hair2" x1="636" y1="750" x2="700" y2="750" />
          <line className="lw-hair2" x1="688" y1="130" x2="688" y2="750" />
          {/* vertical dims read along the line (draughting convention) */}
          <text x="700" y="440" className="flow-dim" textAnchor="middle" transform="rotate(-90 700 440)">
            540 mm*
          </text>
        </svg>
        <ol className="flow-list">
          {STAGES.map((s) => (
            <li key={s.n}>
              <span className="flow-n">{s.n}</span>
              <span className="flow-t">{s.title}</span>
              <span className="flow-j">{s.job}</span>
            </li>
          ))}
        </ol>
      </div>
    </Plate>
  );
}

/* ─────────────────────── PLATE 05 — BENCHMARK ─────────────────────── */
const SCHEDULE = [
  { c: "LEAD", v: 98, m: "RO · NSF/ANSI-style*" },
  { c: "CHLORINE", v: 97, m: "carbon block*" },
  { c: "FLUORIDE", v: 90, m: "RO membrane*" },
  { c: "PFAS", v: 95, m: "RO membrane*" },
  { c: "HEAVY METALS", v: 96, m: "multi-stage*" },
  { c: "SEDIMENT", v: 99, m: "20µm pre-filter*" },
];
function BenchmarkPlate() {
  return (
    <Plate id="plate-benchmark" sheet="05" rev="G" name="TEST DATA — REDUCTION" plateNo="PLATE 05" kicker="REV G · TEST DATA — REDUCTION BY CONTAMINANT">
      <div className="sheet-lead sheet-lead--wide">
        <h2 className="sheet-h">
          WE DON’T ASK YOU
          <br />
          TO TAKE OUR WORD.
        </h2>
        <p className="sheet-p">
          A filter is only as good as its test certificate. This is where the verified numbers will live — laid out as a
          drawing’s test schedule, not a marketing graphic, so the claim and its method sit side by side. Indicative
          targets shown; every row cites its standard and independent NATA-accredited lab before launch.*
        </p>
      </div>
      <div className="schedule-wrap">
        <span className="schedule-stamp">INDICATIVE · PENDING TEST CERTIFICATE*</span>
        <table className="schedule">
          <thead>
            <tr>
              <th>CONTAMINANT</th>
              <th>TARGET REDUCTION*</th>
              <th>METHOD / STANDARD*</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {SCHEDULE.map((r) => (
              <tr key={r.c}>
                <td>{r.c}</td>
                <td>
                  <span className="dim-row">
                    {/* fixed 1.4px-per-% scale so the bars actually encode their values */}
                    <span className="dim-bar" style={{ width: `${r.v * 1.4}px` }} />
                    <span className="dim-val" data-count={r.v} data-prefix={r.c === "SEDIMENT" ? "> " : "up to "} data-suffix="%*">
                      {r.c === "SEDIMENT" ? "> " : "up to "}
                      {r.v}%*
                    </span>
                  </span>
                </td>
                <td className="schedule-m">{r.m}</td>
                <td className="schedule-s">PLACEHOLDER*</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="sheet-fig">
          Figures are PLACEHOLDER pending independent NATA-accredited testing — see SUBSTANTIATION KEY below.
        </p>
      </div>
    </Plate>
  );
}

/* ────────────────────────── PLATE 06 — R&D ────────────────────────── */
const APPROVALS = [
  { label: "RESEARCH", name: "UNSW" },
  { label: "RESEARCH", name: "CURTIN UNIVERSITY" },
  { label: "AWARD", name: "FRENCH DESIGN AWARD" },
  { label: "AWARD", name: "AMERICAN DESIGN AWARD" },
];
function RndPlate() {
  return (
    <Plate id="plate-rnd" sheet="06" rev="H" name="APPROVALS BLOCK" plateNo="PLATE 06" kicker="REV H · APPROVALS — RESEARCH & RECOGNITION">
      <div className="sheet-split">
        <div className="sheet-lead">
          <h2 className="sheet-h">
            DESIGNED WITH UNIVERSITIES.
            <br />
            RECOGNISED INTERNATIONALLY.
          </h2>
          <p className="sheet-p">
            Engineering this quiet takes people who argue about tolerances for a living. The NGW-01 was developed with
            university research partners and recognised by international design juries — credibility you can check, drawn
            as a drawing’s approvals block. All partner and award marks shown are placeholder pending written permission
            to display.
          </p>
        </div>
        <div className="approvals">
          <div className="approvals-grid">
            {APPROVALS.map((a, i) => (
              <div className="approval" key={i}>
                <span className="approval-label">{a.label}</span>
                <span className="approval-name">{a.name}</span>
                <span className="approval-logo">LOGO — PLACEHOLDER*</span>
              </div>
            ))}
          </div>
          <div className="approval-sign">
            <svg viewBox="0 0 220 40" aria-hidden="true">
              <path
                className="lw-draw"
                d="M6 28 C 26 6, 40 6, 46 24 S 70 38, 84 18 S 112 6, 126 26 C 140 40, 158 20, 196 14"
                pathLength={1}
              />
            </svg>
            <span className="approval-sign-l">SIGNED · INDICATIVE*</span>
          </div>
        </div>
      </div>
    </Plate>
  );
}

/* ──────────────────────── PLATE 07 — BENEFITS ─────────────────────── */
function BenefitsPlate() {
  const benefits = [
    { n: "01", label: "CLEANER AT EVERY TAP", note: "drinking · cooking · ice" },
    { n: "02", label: "SOFTER SKIN & HAIR*", note: "gentler showers" },
    { n: "03", label: "APPLIANCES PROTECTED*", note: "less scale & chlorine" },
    { n: "04", label: "NO MORE BOTTLES", note: "less plastic, for good" },
  ];
  return (
    <Plate id="plate-benefits" sheet="07" rev="J" name="IN SERVICE — OUTCOMES" plateNo="PLATE 07" kicker="REV J · IN SERVICE — OUTCOMES">
      <div className="benefits-head">
        <h2 className="sheet-h">
          IT ALL COMES TOGETHER
          <br />
          FOR YOUR HOME.
        </h2>
        <p className="sheet-p">
          The engineering disappears and what’s left is ordinary life, better — one install, every tap, quietly, for
          years. Outcomes depend on local water and household use.
        </p>
      </div>
      <div className="house-wrap">
        <svg viewBox="0 0 900 300" className="house-svg" aria-hidden="true">
          <path className="lw-draw lw-hair2" d="M40 280 V120 L450 30 L860 120 V280" pathLength={1} />
          <path className="lw-draw lw-hair2" d="M40 280 H860 M300 280 V160 H600 V280 M300 200 H600 M450 30 V160" pathLength={1} />
          <rect className="lw-draw lw-heavy2" x="60" y="210" width="34" height="70" pathLength={1} />
          <text x="77" y="298" className="house-unit" textAnchor="middle">
            NGW-01
          </text>
        </svg>
        <div className="benefits-grid">
          {benefits.map((b) => (
            <Callout key={b.n} n={b.n} label={b.label} note={b.note} />
          ))}
        </div>
      </div>
    </Plate>
  );
}

/* ──────────────────────── PLATE 08 — PROCESS ──────────────────────── */
function ProcessPlate() {
  const steps = [
    { n: "01", t: "ASSESS", b: "A qualified tech runs a free in-home water test and shows you exactly what’s in your supply, on the spot." },
    { n: "02", t: "INSTALL", b: "A clean, tidy fit at the mains, usually in a few hours — no mess left behind.*" },
    { n: "03", t: "ENJOY", b: "Filtered water at every tap, on a smart payment plan from a low weekly amount over 36 months.*" },
  ];
  return (
    <Plate id="plate-process" sheet="08" rev="K" name="INSTALLATION SEQUENCE" plateNo="PLATE 08" kicker="REV K · INSTALLATION — FROM TEST TO TAP">
      <div className="benefits-head">
        <h2 className="sheet-h">ASSESS. INSTALL. ENJOY.</h2>
        <p className="sheet-p">
          Buying a water system shouldn’t feel like a building project. Ours is three clean steps, drawn as an
          installation sequence. No pressure, and no obligation after the test.
        </p>
      </div>
      <ol className="process">
        {steps.map((s) => (
          <li key={s.n} className="process-step">
            <span className="process-n">{s.n}</span>
            <span className="process-t">{s.t}</span>
            <span className="process-b">{s.b}</span>
          </li>
        ))}
      </ol>
      <p className="process-next">NEXT: BOOK YOUR FREE TEST ↓</p>
    </Plate>
  );
}

/* ────────────────────────── PLATE 09 — CTA ────────────────────────── */
function CtaPlate() {
  return (
    <Plate id="plate-cta" sheet="09" rev="L" name="APPROVED FOR ISSUE" plateNo="PLATE 09" kicker="REV L → APPROVED FOR ISSUE" className="sheet--center">
      <div className="cta-inner">
        <h2 className="sheet-h cta-h">
          FIND OUT WHAT’S
          <br />
          IN YOUR <span className="cta-cyan">WATER.</span>
        </h2>
        <p className="cta-note">we’ll bring the drawing to life in your kitchen.</p>
        <p className="sheet-p cta-p">
          Book a free, no-obligation in-home water test — a qualified technician comes to you, tests your actual supply,
          and shows you exactly what the NGW-01 would change.
        </p>
        <div className="cta-actions">
          <Button variant="primary" href="#book">
            Book your free water test
          </Button>
          <Button variant="ghost" href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}>
            Call {CONTACT.phone}*
          </Button>
        </div>
      </div>
    </Plate>
  );
}

/* ───────────────────── TITLE-BLOCK FOOTER ───────────────────── */
function TitleBlockFooter() {
  return (
    <footer className="tbf">
      <div className="tbf-frame">
        <div className="tbf-grid">
          <div className="tbf-cell tbf-co">
            <i>COMPANY</i>NEXT GEN WATER SYSTEMS
          </div>
          <div className="tbf-cell">
            <i>DRAWING</i>NGW-01 WHOLE-HOME FILTRATION COLUMN
          </div>
          <div className="tbf-cell">
            <i>SHEET</i>09 OF 09
          </div>
          <div className="tbf-cell">
            <i>SCALE</i>NTS
          </div>
          <div className="tbf-cell">
            <i>PHONE</i>
            <a href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}>{CONTACT.phone}*</a>
          </div>
          <div className="tbf-cell">
            <i>EMAIL</i>
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          </div>
        </div>

        <nav className="tbf-rev" aria-label="Sheet index">
          <div className="tbf-rev-head">REVISIONS · SHEET INDEX</div>
          {SITE_REVISIONS.map((r) => (
            <a key={r.rev} href={`#${r.id}`} className="tbf-rev-row">
              <span>{r.rev}</span>
              <span>{r.sheet}</span>
              <span>{r.desc}</span>
            </a>
          ))}
        </nav>

        <div className="tbf-key">
          <div className="tbf-key-head">SUBSTANTIATION KEY *</div>
          <p>
            All performance, contaminant, health, award, partnership and finance figures shown are <b>PLACEHOLDER</b>{" "}
            pending independent NATA-accredited testing and client substantiation, and are flagged *. Filtration and
            health claims are regulated; final published figures are set at certification.
          </p>
          <p className="tbf-ops">
            OPERATIONAL TERMS: free / no-obligation test, 36-month payment plan, install times and “Australian made” are
            operational commitments subject to client confirmation — not test results.
          </p>
        </div>

        <div className="tbf-stamp">CONCEPT · NOT FOR CONSTRUCTION</div>
        <div className="tbf-rule">© 2026 Next Gen Water Systems · ABN 00 000 000 000* · designed in Australia</div>
      </div>
    </footer>
  );
}

export function SiteSpine() {
  return (
    <>
      <TrustPlate />
      <ProblemPlate />
      <FlowTestPlate />
      <BenchmarkPlate />
      <RndPlate />
      <BenefitsPlate />
      <ProcessPlate />
      <CtaPlate />
      <TitleBlockFooter />
    </>
  );
}
