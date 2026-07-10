/**
 * Draughting linework for the NGW-01 hero plate, drawn into a 1200×900 plate
 * viewBox. Depicts the REAL machine (Clear2O FHWR-3SI-20 architecture): three
 * vessels on a bracket, plumbed in series. Authored in DRAUGHTSPERSON ORDER so
 * the scroll-driven stroke-dashoffset trace reads like the drawing is being
 * made by hand, and REGISTERED to the 3D dock pose (scale/offsets derived from
 * the camera projection, verified with ink-over-chrome overlays).
 *
 * ⚠️ Every dimension here is a PLACEHOLDER and is flagged (*) in the UI. Final
 * spec is set at the install survey — do not present these as real figures.
 */

export type Weight = "centre" | "heavy" | "hair";
export type DrawPath = { id: string; d: string; weight: Weight; order: number };
export type Balloon = { n: string; x: number; y: number };

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
