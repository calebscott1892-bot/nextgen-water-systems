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

  // 5 — media-bed divisions (3 beds → 2 internal dividers; each bed hatched in the UI)
  {
    id: "beds",
    weight: "hair",
    order: 5,
    d: "M340 392 L620 392 M340 571 L620 571",
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

// three media beds — each a distinct hatch, clipped to the silhouette, faded in
// late. ONE filtration story everywhere (the real Clear2O FHWR-3SI-20):
// sediment → KDF 55/85 + carbon → limescale carbon (matches the 3D + Plate 04).
export type Bed = { id: string; y0: number; y1: number; hatch: string };
export const BEDS: Bed[] = [
  { id: "sediment", y0: 212, y1: 392, hatch: "h-stipple" },
  { id: "kdf-carbon", y0: 392, y1: 571, hatch: "h-dots" },
  { id: "limescale-carbon", y0: 571, y1: 750, hatch: "h-vert" },
];

// labelled balloons keyed to the bill of materials (centre of each media bed)
export type Balloon = { n: string; x: number; y: number };
export const BOM_BALLOONS: Balloon[] = [
  { n: "1", x: 700, y: 302 }, // graded sediment cartridge
  { n: "2", x: 700, y: 481 }, // KDF 55/85 + coconut carbon
  { n: "3", x: 700, y: 660 }, // limescale-reduction carbon
];

export const BOM_ROWS = [
  ["1", "SEDIMENT 3-LAYER", "10/5/1µm GRADED*"],
  ["2", "KDF 55/85 + GAC", "HEAVY METALS · CHLORINE*"],
  ["3", "LIMESCALE CARBON", "SCALE · TASTE · 1µm*"],
];

export const REVISIONS = [
  { rev: "A", desc: "GENERAL ARRANGEMENT", at: 0.3 },
  { rev: "B", desc: "BILL OF MATERIALS", at: 0.56 },
  { rev: "C", desc: "SECTION A — A ADDED", at: 0.82 },
];

/* ===========================================================================
   THE REAL MACHINE — three-vessel assembly GA (Clear2O FHWR-3SI-20 form:
   three 20"×4.5" housings side-by-side on a bracket, plumbed in series).
   This is the hero plate's linework; the single-column exports above remain
   only for Plate 04's test-rig abstraction until its Section A–A rebuild.
   =========================================================================== */

// vessel centres + shared dimensions (front view, 1200×900 plate space)
export const VESSEL_CX = [320, 540, 760] as const;
const HEAD_W2 = 87; // head half-width (matched to the 3D projection at dock)
const HEAD_TOP = 240;
const HEAD_BOT = 300;
const SUMP_W2 = 74; // sump half-width (matched to the 3D projection at dock)
const SUMP_BOT = 585; // matches the 3D sump+dome proportions at dock scale
const SUMP_R = 28; // rounded bottom corner radius

/** one vessel silhouette (head + stepped sump with rounded bottom), closed */
function vesselD(cx: number): string {
  const hl = cx - HEAD_W2, hr = cx + HEAD_W2;
  const sl = cx - SUMP_W2, sr = cx + SUMP_W2;
  return (
    `M${hl} ${HEAD_TOP} L${hr} ${HEAD_TOP} L${hr} ${HEAD_BOT} L${sr} ${HEAD_BOT} ` +
    `L${sr} ${SUMP_BOT - SUMP_R} Q${sr} ${SUMP_BOT} ${sr - SUMP_R} ${SUMP_BOT} ` +
    `L${sl + SUMP_R} ${SUMP_BOT} Q${sl} ${SUMP_BOT} ${sl} ${SUMP_BOT - SUMP_R} ` +
    `L${sl} ${HEAD_BOT} L${hl} ${HEAD_BOT} Z`
  );
}

// combined closed silhouettes — the shade fill + hatch clip for the assembly
export const ASSEMBLY_D = VESSEL_CX.map(vesselD).join(" ");

// construction geometry laid down before inking (cyan, hair)
export const ASSEMBLY_CONSTRUCTION: { id: string; d: string }[] = [
  { id: "bbox", d: `M233 ${HEAD_TOP - 16} L847 ${HEAD_TOP - 16} L847 ${SUMP_BOT} L233 ${SUMP_BOT} Z` },
  { id: "centrelines", d: VESSEL_CX.map((cx) => `M${cx} 200 L${cx} 630`).join(" ") },
  { id: "datum-top", d: `M190 ${HEAD_TOP} L890 ${HEAD_TOP}` },
  { id: "datum-bot", d: `M190 ${SUMP_BOT} L890 ${SUMP_BOT}` },
  { id: "circ-heads", d: VESSEL_CX.map((cx) => arc(cx, 270, 55)).join(" ") },
];

// ink, in draughtsperson order: centreline → vessels L→R → pipework → furniture
export const ASSEMBLY_PATHS: DrawPath[] = [
  {
    id: "centrelines",
    weight: "centre",
    order: 0,
    d: VESSEL_CX.map((cx) => `M${cx} 208 L${cx} 622`).join(" "),
  },
  { id: "vessel-1", weight: "heavy", order: 1, d: vesselD(VESSEL_CX[0]) },
  { id: "vessel-2", weight: "heavy", order: 2, d: vesselD(VESSEL_CX[1]) },
  { id: "vessel-3", weight: "heavy", order: 3, d: vesselD(VESSEL_CX[2]) },
  {
    // series pipework: mains in → V1 → V2 → V3 → house out (drawn as pipe walls)
    id: "pipework",
    weight: "heavy",
    order: 4,
    d:
      `M178 262 L233 262 M178 278 L233 278 ` + // mains in
      `M407 262 L453 262 M407 278 L453 278 ` + // V1 → V2
      `M627 262 L673 262 M627 278 L673 278 ` + // V2 → V3
      `M847 262 L902 262 M847 278 L902 278`, // house out
  },
  {
    // flow arrows riding the pipe runs + IN/OUT arrowheads
    id: "flow",
    weight: "hair",
    order: 5,
    d:
      `M192 270 L214 270 M208 264 L214 270 L208 276 ` +
      `M420 270 L440 270 M435 265 L440 270 L435 275 ` +
      `M640 270 L660 270 M655 265 L660 270 L655 275 ` +
      `M862 270 L886 270 M880 264 L886 270 L880 276`,
  },
  {
    // mounting bracket rail behind the heads
    id: "bracket",
    weight: "hair",
    order: 6,
    d: `M250 226 L830 226 M250 234 L830 234`,
  },
  {
    // pressure-release buttons on each head
    id: "buttons",
    weight: "hair",
    order: 7,
    d: VESSEL_CX.map((cx) => `M${cx - 14} ${HEAD_TOP} L${cx - 14} 226 L${cx + 14} 226 L${cx + 14} ${HEAD_TOP}`).join(" "),
  },
  {
    // cartridge-zone boundaries inside each sump
    id: "cartzones",
    weight: "hair",
    order: 8,
    d: VESSEL_CX.map((cx) => `M${cx - 62} 315 L${cx + 62} 315 M${cx - 62} 560 L${cx + 62} 560`).join(" "),
  },
  {
    // overall-width dimension (the one ACTIVE dimension)
    id: "dim-width",
    weight: "hair",
    order: 9,
    d:
      `M233 595 L233 645 M847 595 L847 645 ` + // extension lines
      `M233 635 L847 635 ` + // dimension line
      `M247 629 L233 635 L247 641 M833 629 L847 635 L833 641`, // arrowheads
  },
];

// per-vessel cartridge hatch zones (the assembly's "beds")
export type VesselBed = { id: string; x0: number; y0: number; x1: number; y1: number; hatch: string };
export const VESSEL_BEDS: VesselBed[] = [
  { id: "sediment", x0: VESSEL_CX[0] - 62, y0: 315, x1: VESSEL_CX[0] + 62, y1: 560, hatch: "h-stipple" },
  { id: "kdf-carbon", x0: VESSEL_CX[1] - 62, y0: 315, x1: VESSEL_CX[1] + 62, y1: 560, hatch: "h-dots" },
  { id: "limescale-carbon", x0: VESSEL_CX[2] - 62, y0: 315, x1: VESSEL_CX[2] + 62, y1: 560, hatch: "h-vert" },
];

// BOM balloons above each head, leaders dropping to the caps
export const ASSEMBLY_BALLOONS: Balloon[] = VESSEL_CX.map((cx, i) => ({ n: String(i + 1), x: cx, y: 176 }));
