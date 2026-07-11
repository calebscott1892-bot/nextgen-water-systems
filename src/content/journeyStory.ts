/**
 * THE WHOLE STORY RIDES THE JOURNEY (Slice 1 of the continuous-space rebuild).
 *
 * Every beat is locked to the scroll window where the machine supports it:
 * the contaminant problem while dirty water gathers at the V1 inlet, the
 * stage cards while the camera is parked inside each vessel, the proof
 * figures as clean water exits, credibility on the orbit, benefits on the
 * service explode, the install steps over the reassembly, and the hand-off
 * into the booking tail. No white sheets — the machine never leaves.
 *
 * Windows are fractions of the pinned journey scalar p∈[0,1] (the pin is
 * 1050svh — see LivingDrawing). `f` is the fade margin. Copy is capped at
 * ~2 sentences + 1 stat per beat; the vessel-to-vessel slides stay silent.
 *
 * ⚠️ Every performance/credibility figure stays PLACEHOLDER-flagged (*) —
 * filtration claims are regulated; only KDF/carbon-achievable claims appear
 * (no PFAS / fluoride / TDS — RO-only, see docs/filter-reference.md §5).
 */
export type Beat = {
  id: string;
  a: number;
  b: number;
  f: number;
  /** FULL literal class name — Tailwind's @layer scanner purges classes it
   *  can't find as literals in source, so never construct these */
  pos: "pb--left" | "pb--right" | "pb--tl" | "pb--bc";
  eyebrow: string;
  h: string;
  body: string;
  stat?: string;
  /** drawn mini-schedule (label → value), dimension-lettered */
  rows?: [string, string][];
  cta?: boolean;
  cue?: string;
};

/** where each vessel's water-run beat parks — shared by the 3D vessel clicks
 *  AND the blueprint's clickable balloons/vessels */
export const VESSEL_BEAT_P = [0.425, 0.52, 0.635] as const;

/** drafted tooltip line per vessel (blueprint hover) */
export const VESSEL_TIPS = [
  "01 — GRADED SEDIMENT · 10/5/1 µm*",
  "02 — KDF 55/85 + CARBON · REDOX*",
  "03 — LIMESCALE CARBON · 1 µm*",
] as const;

export const STORY_BEATS: Beat[] = [
  {
    id: "hero", a: -0.05, b: 0.052, f: 0.022, pos: "pb--left",
    eyebrow: "NGW-01 · WHOLE-HOME FILTRATION",
    h: "One machine at the mains.",
    body: "Three stainless vessels feed every tap in the house filtered water — no jugs, no under-sink clutter.",
    cta: true,
    cue: "SCROLL — THE DRAWING EXPLAINS ITSELF",
  },
  {
    // the PROBLEM — told while the camera holds the mains-in side of the
    // machine (V1 frames right of centre, so the words own the left)
    id: "problem", a: 0.268, b: 0.348, f: 0.02, pos: "pb--left",
    eyebrow: "UNFILTERED SUPPLY · DETAIL A",
    h: "Safe to supply isn't clean.",
    body: "On the way to your tap, town water picks up chlorine, dissolved lead from older fittings, iron you can smell and sediment you can see. Watch what the machine does with it.",
    stat: "CHLORINE · LEAD · IRON & H₂S · SEDIMENT",
  },
  {
    id: "s1", a: 0.378, b: 0.462, f: 0.02, pos: "pb--right",
    eyebrow: "STAGE 01 · GRADED SEDIMENT",
    h: "The coarse work, first.",
    body: "Three graded layers catch grit, rust and silt, so the finer media behind them never clogs early.",
    stat: "10 / 5 / 1 µm*",
  },
  {
    // the redox bed gets DOUBLE dwell — it's the machine's signature chemistry
    id: "s2", a: 0.452, b: 0.592, f: 0.02, pos: "pb--left",
    eyebrow: "STAGE 02 · KDF 55/85 + CARBON",
    h: "The redox bed.",
    body: "Copper-zinc granules trade electrons with what's dissolved — metals bind to the media, chlorine converts. Coconut carbon polishes taste behind it.",
    stat: "up to 18-month cartridge life*",
  },
  {
    id: "s3", a: 0.582, b: 0.692, f: 0.02, pos: "pb--right",
    eyebrow: "STAGE 03 · LIMESCALE CARBON",
    h: "The finish.",
    body: "Scale-reduction media changes how minerals crystallise, so they rinse through instead of coating your appliances.",
    stat: "1 µm final polish*",
  },
  {
    // the PROOF — figures surface as clean water exits the house-out side
    // (machine frames left of centre here; the schedule owns the right)
    id: "proof", a: 0.702, b: 0.772, f: 0.02, pos: "pb--right",
    eyebrow: "TEST SCHEDULE · INDICATIVE*",
    h: "Numbers, drawn to tolerance.",
    body: "Independent NATA-accredited certification comes before launch — every figure carries its method, like any drawing carries its tolerances.",
    rows: [
      ["CHLORINE", "up to 99%*"],
      ["LEAD", "up to 98%*"],
      ["IRON & H₂S", "up to 95%*"],
      ["SEDIMENT", "> 99%*"],
    ],
  },
  {
    // CREDIBILITY — while the camera orbits the settled machine
    id: "cred", a: 0.778, b: 0.842, f: 0.02, pos: "pb--left",
    eyebrow: "APPROVALS BLOCK*",
    h: "Argued over by people who care.",
    body: "Developed with university research partners and recognised by international design juries — every mark shown pending written permission, so they're drawn, not dropped in.*",
    stat: "UNSW* · CURTIN* · INTERNATIONAL DESIGN AWARDS*",
  },
  {
    // BENEFITS share the explode dwell — the machine is open on screen
    id: "service", a: 0.852, b: 0.924, f: 0.02, pos: "pb--tl",
    eyebrow: "SERVICEABLE BY DESIGN",
    h: "Heads lift. Life gets easier.",
    body: "A cartridge change takes minutes — tap a label to read each part. Then it's ordinary life, better: appliances protected, softer showers, no bottles.*",
  },
  {
    // INSTALL steps letter in while the machine reassembles
    id: "install", a: 0.928, b: 0.972, f: 0.018, pos: "pb--left",
    eyebrow: "INSTALLATION SEQUENCE",
    h: "Assess. Install. Enjoy.",
    body: "A free in-home water test, a clean fit at the mains in a few hours, filtered water at every tap.*",
    stat: "NO OBLIGATION AFTER THE TEST",
  },
  {
    id: "handoff", a: 0.974, b: 2, f: 0.02, pos: "pb--left",
    eyebrow: "APPROVED FOR ISSUE",
    h: "Find out what's in your water.",
    body: "Book the free test below — a technician tests your actual supply, at your kitchen tap.",
    cue: "BOOK YOUR FREE WATER TEST ↓",
  },
];
