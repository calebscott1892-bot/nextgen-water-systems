/**
 * Pre-authored 2D draughting profile of the NGW-01 filtration column, drawn into
 * a 1200×900 plate viewBox. Hand-traced (no GLB to project) — a first-pass,
 * technically-plausible general-arrangement view to be refined against the
 * client's real unit. Authored in DRAUGHTSPERSON ORDER so the scroll-driven
 * stroke-dashoffset trace reads like the drawing is being made by hand.
 *
 * ⚠️ Every dimension here is a PLACEHOLDER and is flagged (*) in the UI. Final
 * spec is set at the install survey — do not present these as real figures.
 */

export type Weight = "centre" | "heavy" | "hair";
export type DrawPath = { id: string; d: string; weight: Weight; order: number };

// centre x = 480, column from y≈120 (inlet) to y≈760 (base feet)
export const COLUMN_PATHS: DrawPath[] = [
  // 0 — construction centre-line (drawn first, like a real GA)
  { id: "centreline", weight: "centre", order: 0, d: "M480 96 L480 792" },

  // 1 — outer housing silhouette, traced top → bottom → back up
  {
    id: "silhouette",
    weight: "heavy",
    order: 1,
    d:
      "M440 130 L520 130 L520 170 L620 212 L620 430 " +
      "L636 440 L636 472 L620 482 L620 690 L590 722 L590 750 " +
      "L370 750 L370 722 L340 690 L340 482 L324 472 L324 440 L340 430 " +
      "L340 212 L440 170 Z",
  },

  // 2 — top inlet port stub (the doorway the journey enters)
  { id: "inlet-stub", weight: "heavy", order: 2, d: "M455 130 L455 100 L505 100 L505 130" },

  // 3 — knurled crown ticks
  {
    id: "knurl",
    weight: "hair",
    order: 3,
    d: "M448 138 L448 164 M464 136 L464 166 M480 135 L480 167 M496 136 L496 166 M512 138 L512 164",
  },

  // 4 — tri-clamp sanitary flange band (mid-body landmark)
  { id: "triclamp", weight: "heavy", order: 4, d: "M324 446 L636 446 M324 466 L636 466" },

  // 5 — five media-bed divisions (each bed gets its own hatch in the UI)
  {
    id: "beds",
    weight: "hair",
    order: 5,
    d:
      "M340 232 L620 232 M340 330 L620 330 M340 446 L620 446 " +
      "M340 560 L620 560 M340 672 L620 672",
  },

  // 6 — bypass valve teeing off the inlet (asymmetry, recognisable feature)
  { id: "bypass", weight: "heavy", order: 6, d: "M620 250 L672 224 L672 196 M672 224 L700 240" },

  // 7 — drain / flush valve + hose tail at the base
  { id: "drain", weight: "heavy", order: 7, d: "M590 712 L648 712 L648 700 M648 712 L648 736 L668 744" },

  // 8 — base plinth feet
  { id: "feet", weight: "heavy", order: 8, d: "M400 750 L400 778 L432 778 L432 750 M528 750 L528 778 L560 778 L560 750" },

  // 9 — flow-direction arrows embossed on the housing (IN top / OUT base)
  { id: "flow", weight: "hair", order: 9, d: "M480 196 L480 222 M472 212 L480 222 L488 212 M360 690 L360 716 M352 706 L360 716 L368 706" },

  // 10 — overall HEIGHT dimension (the one ACTIVE dimension)
  {
    id: "dim-height",
    weight: "hair",
    order: 10,
    d:
      "M620 130 L788 130 M590 750 L788 750 " + // extension lines
      "M772 130 L772 750 " + // dimension line
      "M766 144 L772 130 L778 144 M766 736 L772 750 L778 736", // arrowheads
  },
];

// the closed body outline (reused as a fill for the shaded look + as a clip for hatching)
export const SILHOUETTE_D =
  "M440 130 L520 130 L520 170 L620 212 L620 430 " +
  "L636 440 L636 472 L620 482 L620 690 L590 722 L590 750 " +
  "L370 750 L370 722 L340 690 L340 482 L324 472 L324 440 L340 430 " +
  "L340 212 L440 170 Z";

// construction geometry — the faint setup a draughtsperson lays down BEFORE inking.
// Drawn first (cyan, hair), then dimmed once the real linework starts.
export const CONSTRUCTION_PATHS: { id: string; d: string }[] = [
  { id: "bbox", d: "M324 130 L636 130 L636 750 L324 750 Z" },
  { id: "datum-top", d: "M300 130 L660 130" },
  { id: "datum-bot", d: "M300 750 L660 750" },
  { id: "cross", d: "M300 446 L660 446 M480 96 L480 792" },
  // construction circles at the fillets / clamp (drawn as polylines so they trace)
  { id: "circ-clamp", d: arc(480, 456, 168) },
  { id: "circ-crown", d: arc(480, 150, 52) },
];

// approximate a circle with a closed poly-bezier so stroke-dashoffset can "draw" it
function arc(cx: number, cy: number, r: number): string {
  const k = 0.5522847498 * r;
  return (
    `M${cx} ${cy - r} ` +
    `C${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy} ` +
    `C${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r} ` +
    `C${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy} ` +
    `C${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r} Z`
  );
}

// five media beds — each a distinct hatch, clipped to the silhouette, faded in
// late. ONE filtration story everywhere: sediment → carbon → RO → post-carbon →
// re-mineralise (matches the 3D stages and Plate 04).
export type Bed = { id: string; y0: number; y1: number; hatch: string };
export const BEDS: Bed[] = [
  { id: "sediment", y0: 212, y1: 330, hatch: "h-stipple" },
  { id: "carbon", y0: 330, y1: 446, hatch: "h-vert" },
  { id: "ro", y0: 446, y1: 560, hatch: "h-grid" },
  { id: "post-carbon", y0: 560, y1: 660, hatch: "h-dots" },
  { id: "remineralise", y0: 660, y1: 750, hatch: "h-diag" },
];

// labelled balloons keyed to the bill of materials (centre of each media bed)
export type Balloon = { n: string; x: number; y: number };
export const BOM_BALLOONS: Balloon[] = [
  { n: "1", x: 700, y: 181 }, // housing
  { n: "2", x: 700, y: 281 }, // sleeve / sediment
  { n: "3", x: 700, y: 388 }, // carbon block
  { n: "4", x: 700, y: 503 }, // catalytic / mineral
  { n: "5", x: 700, y: 616 }, // UV / polish
];

export const BOM_ROWS = [
  ["1", "SEDIMENT", "20µm PRE-FILTER*"],
  ["2", "CARBON BLOCK", "CHLORINE · TASTE*"],
  ["3", "RO MEMBRANE", "LEAD · PFAS*"],
  ["4", "POST-CARBON", "FINAL POLISH*"],
  ["5", "RE-MINERALISE", "BALANCED pH*"],
];

export const REVISIONS = [
  { rev: "A", desc: "GENERAL ARRANGEMENT", at: 0.3 },
  { rev: "B", desc: "BILL OF MATERIALS", at: 0.56 },
  { rev: "C", desc: "SECTION A — A ADDED", at: 0.82 },
];
