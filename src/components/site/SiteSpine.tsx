"use client";

import { useEffect, useRef } from "react";
import { Plate, Callout } from "./Plate";
import { Button } from "@/components/ui/Button";
import { CONTACT, SITE_REVISIONS } from "@/content/plates";
import C4FooterCredit from "@/components/c4-footer-credit/C4FooterCredit";
/* Section A–A geometry (Plate 04): one vessel cut through its axis —
   sump wall, annular gap, media wall, hollow core. Radial outside-in flow. */
const SEC = {
  headL: 340, headR: 690, headT: 130, headB: 205, // head block
  wallOL: 355, wallIL: 370, wallIR: 660, wallOR: 675, // sump wall (outer/inner)
  mediaL0: 400, mediaL1: 465, mediaR0: 565, mediaR1: 630, // media wall bands
  coreL: 500, coreR: 530, // hollow core channel
  top: 240, bot: 710, // media extent
  sumpBot: 750,
};
import { createCleanseStrip } from "@/components/fluid/cleanseStrip";
import { useReducedMotion } from "@/lib/useReducedMotion";

/* ───────────────────────── PLATE 02 — TRUST ───────────────────────── */
function TrustPlate() {
  return (
    <Plate id="plate-trust" sheet="02" rev="D" name="GENERAL NOTES" plateNo="PLATE 02" kicker="REV D · DWG NGW-01 · GENERAL NOTES" className="sheet--open">
      <div className="sheet-split">
        <div className="sheet-lead">
          <h2 className="sheet-h">
            BUILT TO A STANDARD,
            <br />
            NOT TO A PRICE.
          </h2>
          <p className="sheet-p">
            Most home filters are bought in, badged and boxed. The NGW-01 is a sealed three-vessel assembly — drawn,
            toleranced and signed off before a single unit is built, the way you engineer a machine, not assemble a kit.
            Read the figures on these sheets like a spec sheet, because that is what they are. Every one is a placeholder
            pending substantiation; drawings carry tolerances, and so do our claims.
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
    { n: "03", a: 112, label: "IRON & H₂S", note: "staining · ‘rotten-egg’*" },
    { n: "04", a: 205, label: "SEDIMENT & SCALE", note: "grit · rust · hardness" },
  ];
  return (
    <Plate id="plate-problem" sheet="03" rev="E" name="DETAIL A — CONTAMINANTS" plateNo="PLATE 03" kicker="REV E · DETAIL A — SCALE 4:1 · UNFILTERED SUPPLY" className="sheet--open">
      <div className="sheet-split">
        <div className="sheet-lead">
          <h2 className="sheet-h">
            THE WATER YOU TRUST
            <br />
            CARRIES WHAT YOU CAN’T SEE.
          </h2>
          <p className="sheet-p">
            Town water is treated to be safe to supply — not to be the best water your family could drink. On the way to
            your tap it can pick up chlorine, dissolved lead from older fittings, iron that stains and sulphur you can
            smell, and fine sediment you only notice once it’s in the glass. None of it changes how the water looks.{" "}
            <span className="ink-underline">Clear isn’t the same as clean.</span>
          </p>
          <p className="sheet-fig">DETAIL A · SCALE 4:1 · presence and levels confirmed by your free in-home test*</p>
        </div>
        <div className="detail-wrap">
          {/* Phase 4: a REAL drafting detail — heavy boundary, centreline
              crosshair, contaminant glyph clusters per quadrant, elbowed
              leaders FROM each feature, and the detail tag on the rim */}
          <svg viewBox="0 0 420 420" className="detail-svg" aria-hidden="true">
            <circle className="detail-fill" cx="210" cy="210" r="150" />
            {/* centreline crosshair (hairline, long-short dash convention —
                static: its dasharray must not fight the draw-on system) */}
            <path className="lw-centre2" d="M210 48 V372 M48 210 H372" fill="none" />
            {/* boundary — the one HEAVY line (ISO 2:1 discipline) */}
            <circle className="lw-draw lw-heavy2" cx="210" cy="210" r="150" pathLength={1} fill="none" />
            {/* contaminant glyph clusters + elbowed leaders */}
            {items.map((it, idx) => {
              const rad = (it.a * Math.PI) / 180;
              const cos = Math.cos(rad);
              const sin = Math.sin(rad);
              const cx = 210 + cos * 82;
              const cy = 210 + sin * 82;
              // leader: feature dot → radial run → horizontal shelf toward the callout
              const fx = 210 + cos * 96;
              const fy = 210 + sin * 96;
              const rx = 210 + cos * 162;
              const ry = 210 + sin * 162;
              const shelf = cos >= 0 ? 26 : -26;
              const delay = `${0.7 + idx * 0.15}s`;
              const J = [
                [-13, -5], [3, -15], [15, -2], [-4, 11], [11, 13], [-17, 6], [5, 3], [-8, -16], [17, 11],
              ] as const;
              return (
                <g key={it.n}>
                  {idx === 0 && // CHLORINE — dissolved gas rings
                    J.slice(0, 6).map(([dx, dy], k) => (
                      <circle key={k} className="dglyph" cx={cx + dx} cy={cy + dy} r={2.6 + (k % 3)} />
                    ))}
                  {idx === 1 && // LEAD — dense metallic flecks
                    J.slice(0, 6).map(([dx, dy], k) => (
                      <rect
                        key={k}
                        className="dglyph--fill"
                        x={cx + dx - 2.4}
                        y={cy + dy - 2.4}
                        width={4.8}
                        height={4.8}
                        transform={`rotate(${k * 23} ${cx + dx} ${cy + dy})`}
                      />
                    ))}
                  {idx === 2 && ( // IRON & H2S — staining blobs + gas bubbles
                    <>
                      {J.slice(0, 4).map(([dx, dy], k) => (
                        <ellipse key={k} className="dglyph--fill" cx={cx + dx} cy={cy + dy} rx={4.4 - k * 0.5} ry={3.2 - k * 0.4} />
                      ))}
                      {J.slice(4, 7).map(([dx, dy], k) => (
                        <circle key={`b${k}`} className="dglyph" cx={cx + dx * 0.8} cy={cy + dy * 0.8 - 12} r={1.8} />
                      ))}
                    </>
                  )}
                  {idx === 3 && ( // SEDIMENT & SCALE — grit + crystal ticks
                    <>
                      {J.map(([dx, dy], k) => (
                        <circle key={k} className="dglyph--fill" cx={cx + dx} cy={cy + dy} r={1.2 + (k % 2) * 0.8} />
                      ))}
                      {J.slice(0, 3).map(([dx, dy], k) => (
                        <path
                          key={`t${k}`}
                          className="dglyph"
                          d={`M${cx + dx * 1.4} ${cy + dy * 1.4} l4 0 l-2 -4 z`}
                        />
                      ))}
                    </>
                  )}
                  {/* feature dot + elbowed leader (staggered draw-in) */}
                  <circle className="detail-dot" cx={fx} cy={fy} r={2.2} />
                  <path
                    className="lw-draw lw-lead"
                    style={{ transitionDelay: delay }}
                    d={`M${fx} ${fy} L${rx} ${ry} h${shelf}`}
                    pathLength={1}
                    fill="none"
                  />
                </g>
              );
            })}
            {/* detail tag on the rim, drafting convention */}
            <circle className="lw-draw lw-hair2" cx="316" cy="104" r="14" pathLength={1} fill="none" />
            <text className="detail-tag-t" x="316" y="109" textAnchor="middle">
              A
            </text>
            <text className="detail-tag-t" x="338" y="99">
              SCALE 4:1
            </text>
          </svg>
          <div className="detail-callouts">
            {items.map((it) => {
              // anchor each callout from the SAME angle as its SVG leader so
              // text can never pile up — leader shelves end ~r45%, callouts
              // at 46% (52% clipped against the sheet frame's overflow)
              const rad = (it.a * Math.PI) / 180;
              const dx = Math.cos(rad);
              const dy = Math.sin(rad);
              const tx = dx > 0.35 ? "0%" : dx < -0.35 ? "-100%" : "-50%";
              const ty = dy > 0.35 ? "0%" : dy < -0.35 ? "-100%" : "-50%";
              return (
                <Callout
                  key={it.n}
                  n={it.n}
                  label={it.label}
                  note={it.note}
                  className="dc"
                  style={{ left: `${50 + dx * 46}%`, top: `${50 + dy * 46}%`, transform: `translate(${tx}, ${ty})` }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </Plate>
  );
}

/* ─────────────────────── PLATE 04 — FLOW TEST ───────────────────────
   The stage-by-stage story now lives INSIDE the scroll journey (Phase 2);
   this sheet keeps only what the journey can't show — the true Section A–A
   cut with the live flow test. */
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
    <Plate
      id="plate-flowtest"
      sheet="04"
      rev="F"
      name="SECTION A–A · FLOW TEST"
      plateNo="PLATE 04"
      kicker="REV F · SECTION A–A · FLOW TEST"
      className="sheet--center sheet--open"
    >
      <div className="flow-head">
        <h2 className="sheet-h">
          SECTION A–A.
          <br />
          ONE CUT, WHOLE STORY.
        </h2>
        <p className="sheet-p">
          The cut the journey above can&rsquo;t show: water enters the head, sheets <em>down</em> the annular gap, is
          forced <em>inward</em> through the media wall, and rises clean <em>up</em> the hollow core. Radial,
          outside-in — every stage works this way.
        </p>
      </div>
      <div className="flow-stage flow-stage--solo">
        <svg viewBox="280 90 470 730" className="flow-svg" aria-hidden="true">
          <defs>
            <linearGradient id="flowGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#5c5638" />
              <stop offset="30%" stopColor="#6f7a52" />
              <stop offset="50%" stopColor="#bfeefb" />
              <stop offset="70%" stopColor="#6f7a52" />
              <stop offset="100%" stopColor="#5c5638" />
            </linearGradient>
            <clipPath id="flowClip">
              <rect x={SEC.wallIL} y={SEC.headB} width={SEC.wallIR - SEC.wallIL} height={735 - SEC.headB} rx="18" />
            </clipPath>
            <pattern id="sec-dots" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="1" fill="#28506f" opacity="0.5" />
            </pattern>
          </defs>
          {/* static radial turbid→clear fallback (shows if WebGL is unavailable) */}
          <g clipPath="url(#flowClip)">
            <rect x={SEC.wallIL} y={SEC.headB} width={SEC.wallIR - SEC.wallIL} height={735 - SEC.headB} fill="url(#flowGrad)" />
          </g>
          {/* live WebGL flow test, masked to the vessel interior */}
          <foreignObject x={SEC.wallIL} y={SEC.headB} width={SEC.wallIR - SEC.wallIL} height={735 - SEC.headB} clipPath="url(#flowClip)">
            <canvas ref={canvasRef} className="flow-canvas" />
          </foreignObject>

          {/* ── the drawn section, on top ── */}
          {/* head block with IN / OUT ports */}
          <path
            className="lw-draw lw-heavy2"
            d={`M${SEC.headL} ${SEC.headB} L${SEC.headL} ${SEC.headT} L${SEC.headR} ${SEC.headT} L${SEC.headR} ${SEC.headB}`}
            pathLength={1}
            fill="none"
          />
          <path
            className="lw-draw lw-heavy2"
            d={`M280 155 L${SEC.headL} 155 M280 185 L${SEC.headL} 185 M${SEC.headR} 155 L750 155 M${SEC.headR} 185 L750 185`}
            pathLength={1}
            fill="none"
          />
          {/* sump wall in section (outer + inner faces, rounded bottom) */}
          <path
            className="lw-draw lw-heavy2"
            d={
              `M${SEC.wallOL} ${SEC.headB} L${SEC.wallOL} ${SEC.sumpBot - 24} Q${SEC.wallOL} ${SEC.sumpBot} ${SEC.wallOL + 24} ${SEC.sumpBot} ` +
              `L${SEC.wallOR - 24} ${SEC.sumpBot} Q${SEC.wallOR} ${SEC.sumpBot} ${SEC.wallOR} ${SEC.sumpBot - 24} L${SEC.wallOR} ${SEC.headB}`
            }
            pathLength={1}
            fill="none"
          />
          <path
            className="lw-draw lw-hair2"
            d={`M${SEC.wallIL} ${SEC.headB} L${SEC.wallIL} 723 Q${SEC.wallIL} 735 ${SEC.wallIL + 14} 735 L${SEC.wallIR - 14} 735 Q${SEC.wallIR} 735 ${SEC.wallIR} 723 L${SEC.wallIR} ${SEC.headB}`}
            pathLength={1}
            fill="none"
          />
          {/* media wall bands (the cartridge, cut) — hatched */}
          <rect x={SEC.mediaL0} y={SEC.top} width={SEC.mediaL1 - SEC.mediaL0} height={SEC.bot - SEC.top} fill="url(#sec-dots)" opacity="0.85" />
          <rect x={SEC.mediaR0} y={SEC.top} width={SEC.mediaR1 - SEC.mediaR0} height={SEC.bot - SEC.top} fill="url(#sec-dots)" opacity="0.85" />
          <path
            className="lw-draw lw-heavy2"
            d={
              `M${SEC.mediaL0} ${SEC.top} L${SEC.mediaL1} ${SEC.top} L${SEC.mediaL1} ${SEC.bot} L${SEC.mediaL0} ${SEC.bot} Z ` +
              `M${SEC.mediaR0} ${SEC.top} L${SEC.mediaR1} ${SEC.top} L${SEC.mediaR1} ${SEC.bot} L${SEC.mediaR0} ${SEC.bot} Z`
            }
            pathLength={1}
            fill="none"
          />
          {/* hollow core tube + rise channel into the head */}
          <path
            className="lw-draw lw-hair2"
            d={`M${SEC.coreL} ${SEC.bot} L${SEC.coreL} ${SEC.headB} M${SEC.coreR} ${SEC.bot} L${SEC.coreR} ${SEC.headB} M${SEC.coreL} ${SEC.bot} L${SEC.coreR} ${SEC.bot}`}
            pathLength={1}
            fill="none"
          />
          {/* ── flow arrows drawn in FLOW ORDER: down the annulus → in through
              the media → up the core (three sequential passes, Phase 2) ── */}
          <path
            className="lw-draw lw-hair2 flow-arrows"
            style={{ transitionDelay: "0.9s" }}
            d={
              // IN / OUT arrows in the ports + down the left + right annulus
              `M300 170 L326 170 M318 163 L326 170 L318 177 ` +
              `M704 170 L730 170 M722 163 L730 170 L722 177 ` +
              `M385 300 L385 340 M378 332 L385 340 L392 332 M385 470 L385 510 M378 502 L385 510 L392 502 ` +
              `M645 300 L645 340 M638 332 L645 340 L652 332 M645 470 L645 510 M638 502 L645 510 L652 502`
            }
            pathLength={1}
            fill="none"
          />
          <path
            className="lw-draw lw-hair2 flow-arrows"
            style={{ transitionDelay: "1.5s" }}
            d={
              // inward through the media wall
              `M405 600 L458 600 M450 593 L458 600 L450 607 ` + `M625 600 L572 600 M580 593 L572 600 L580 607`
            }
            pathLength={1}
            fill="none"
          />
          <path
            className="lw-draw lw-hair2 flow-arrows"
            style={{ transitionDelay: "2s" }}
            d={
              // up the hollow core
              `M515 640 L515 600 M508 608 L515 600 L522 608 M515 470 L515 430 M508 438 L515 430 L522 438 M515 300 L515 260 M508 268 L515 260 L522 268`
            }
            pathLength={1}
            fill="none"
          />
          {/* port labels (the arrows alone left IN/OUT ambiguous) */}
          <rect x="290" y="130" width="32" height="18" fill="#f5f1e6" opacity="0.92" />
          <text x="306" y="143" className="flow-io" textAnchor="middle">
            IN
          </text>
          <rect x="696" y="130" width="42" height="18" fill="#f5f1e6" opacity="0.92" />
          <text x="717" y="143" className="flow-io" textAnchor="middle">
            OUT
          </text>
          {/* section labels */}
          <text x={SEC.wallOL - 12} y="460" className="flow-dim" textAnchor="middle" transform={`rotate(-90 ${SEC.wallOL - 12} 460)`}>
            ANNULUS — RAW IN
          </text>
          <text x="515" y={SEC.top - 12} className="flow-dim" textAnchor="middle">
            CORE — CLEAN OUT
          </text>
          {/* height dimension */}
          <line className="lw-hair2" x1={SEC.wallOR + 8} y1={SEC.headT} x2={SEC.wallOR + 42} y2={SEC.headT} />
          <line className="lw-hair2" x1={SEC.wallOR + 8} y1={SEC.sumpBot} x2={SEC.wallOR + 42} y2={SEC.sumpBot} />
          <line className="lw-hair2" x1={SEC.wallOR + 34} y1={SEC.headT} x2={SEC.wallOR + 34} y2={SEC.sumpBot} />
          <text x={SEC.wallOR + 46} y="440" className="flow-dim" textAnchor="middle" transform={`rotate(-90 ${SEC.wallOR + 46} 440)`}>
            508 mm*
          </text>
        </svg>
      </div>
    </Plate>
  );
}

/* ─────────────────────── PLATE 05 — BENCHMARK ─────────────────────── */
/* Claims scoped to what a KDF/carbon system can actually do (no RO → no
   PFAS / fluoride / TDS rows — those are achievable only with reverse
   osmosis and must not be claimed for this hardware). All figures remain
   placeholder pending NATA-accredited certificates. */
const SCHEDULE = [
  { c: "CHLORINE", v: 99, m: "carbon + KDF redox*" },
  { c: "LEAD", v: 98, m: "KDF 55 redox — soluble cations*" },
  { c: "HEAVY METALS", v: 96, m: "KDF redox*" },
  { c: "IRON & H₂S", v: 95, m: "KDF 85 redox*" },
  // scale-FORMATION reduction (crystallisation inhibited) — NOT hardness/TDS
  // removal, which KDF/carbon systems cannot claim (RO-only)
  { c: "SCALE FORMATION", v: 90, m: "limescale-reduction media — formation, not hardness removal*" },
  { c: "SEDIMENT", v: 99, m: "10/5/1µm 3-layer pre-filter*" },
];
function BenchmarkPlate() {
  return (
    <Plate id="plate-benchmark" sheet="05" rev="G" name="TEST DATA — REDUCTION" plateNo="PLATE 05" kicker="REV G · TEST DATA — REDUCTION BY CONTAMINANT" className="sheet--open">
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
    <Plate id="plate-rnd" sheet="06" rev="H" name="APPROVALS BLOCK" plateNo="PLATE 06" kicker="REV H · APPROVALS — RESEARCH & RECOGNITION" className="sheet--open">
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
    <Plate id="plate-benefits" sheet="07" rev="J" name="IN SERVICE — OUTCOMES" plateNo="PLATE 07" kicker="REV J · IN SERVICE — OUTCOMES" className="sheet--open">
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
        <svg viewBox="0 0 900 320" className="house-svg" aria-hidden="true">
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
    <Plate id="plate-process" sheet="08" rev="K" name="INSTALLATION SEQUENCE" plateNo="PLATE 08" kicker="REV K · INSTALLATION — FROM TEST TO TAP" className="sheet--open">
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
      <a className="process-next" href="#plate-cta">
        CONT&rsquo;D ON SHT 09 — BOOK YOUR FREE TEST →
      </a>
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
          {/* mailto until a real booking form lands (redesign Phase 5) —
              the old href="#book" pointed at an anchor that never existed */}
          <Button
            variant="primary"
            href={`mailto:${CONTACT.email}?subject=${encodeURIComponent("Free water test — booking request")}&body=${encodeURIComponent("Hi Next Gen,\n\nI'd like to book a free in-home water test.\n\nSuburb:\nBest contact number:\nPreferred day:\n\nThanks.")}`}
          >
            Book your free water test
          </Button>
          <Button variant="ghost" href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}>
            Call {CONTACT.phone}
          </Button>
        </div>
        <p className="sheet-fig" style={{ marginTop: 10 }}>
          * phone number is a placeholder pending the business line
        </p>
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
            <i>DRAWING</i>NGW-01 WHOLE-HOME FILTRATION — 3-VESSEL ASSEMBLY
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
        <div className="tbf-rule">
          <span>© 2026 Next Gen Water Systems · ABN 00 000 000 000* · designed in Australia</span>
          <span className="tbf-credit">
            <span className="tbf-credit-label">Designed by</span>
            <C4FooterCredit
              href="https://c4studios.com.au"
              label="Designed by C4 Studios"
              size={34}
              showText={false}
              openInNewTab
              colorScheme="light"
            />
          </span>
        </div>
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
