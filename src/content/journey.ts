/**
 * The teardown journey — one ordered source of truth for every beat: copy,
 * scroll range (final 0..1 over the whole journey), and (later) labels +
 * benchmark figures. ⚠️ Every stat/award/figure is PLACEHOLDER and must be
 * substantiated by the client before launch (filtration + health claims are
 * regulated). All flagged with `*`.
 */
export type Beat = {
  id: string;
  range: [number, number];
  kicker?: string;
  heading: string;
  body?: string;
};

export const BEATS: Beat[] = [
  {
    id: "hero",
    range: [0.0, 0.09],
    kicker: "Next Gen Water Systems",
    heading: "Water, re-engineered.",
    body: "A whole-home refining system that removes what you can’t see — engineered in Australia, proven stage by stage.",
  },
  {
    id: "trust",
    range: [0.09, 0.16],
    kicker: "Built to a standard, not a price",
    heading: "Engineered, not assembled.",
    body: "Australian made · French & American design awards · R&D with UNSW & Curtin · up to 96% reduction*",
  },
  {
    id: "problem",
    range: [0.16, 0.3],
    kicker: "The problem",
    heading: "The water you trust carries what you can’t see.",
    body: "Chlorine, lead, PFAS, sediment — invisible, and there every day.",
  },
  {
    id: "system",
    range: [0.3, 0.48],
    kicker: "The system",
    heading: "Five stages. One quiet column.",
    body: "Sediment, carbon block, RO membrane, re-mineralisation — water enters murky and leaves pure.",
  },
  {
    id: "section",
    range: [0.48, 0.6],
    kicker: "Inside",
    heading: "Complex engineering, disguised as simplicity.",
    body: "Every stage, in cross-section.",
  },
  // Beats 5–9 are authored for later phases (explode → benchmark → reassemble → CTA).
  {
    id: "benchmark",
    range: [0.6, 0.74],
    kicker: "Performance",
    heading: "Measured reduction, stage by stage.",
    body: "Lead, chlorine, fluoride, heavy metals — verified percentages.*",
  },
  {
    id: "rnd",
    range: [0.74, 0.82],
    kicker: "Credibility",
    heading: "Designed with universities. Recognised internationally.",
    body: "UNSW & Curtin research partnerships; French & American design awards.*",
  },
  {
    id: "benefits",
    range: [0.82, 0.9],
    kicker: "Benefits",
    heading: "It all comes together for your home.",
    body: "Cleaner water, softer skin and hair, protected appliances, less plastic.",
  },
  {
    id: "process",
    range: [0.9, 0.95],
    kicker: "How it works",
    heading: "Assess. Install. Enjoy.",
    body: "A free in-home water test, a clean install, and a smart payment plan over 36 months.*",
  },
  {
    id: "cta",
    range: [0.95, 1.0],
    kicker: "Next Gen Water Systems",
    heading: "Find out what’s in your water.",
    body: "Book your free in-home water test.",
  },
];

/** Phase 1 implements beats 0–4 (emerge → orbit → through → cross-section). */
export const PHASE1_MAX_P = 0.6;
export const PHASE1_BEATS = BEATS.filter((b) => b.range[0] < PHASE1_MAX_P);
