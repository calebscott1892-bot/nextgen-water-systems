/**
 * Booking + proof content for the tail (Slice 2).
 *
 * FORM_ENDPOINT: set this to a Formspree/Basin/Worker URL and the booking
 * form POSTs JSON there (fields: name, suburb, phone, day). While it's null
 * the form still WORKS — submit composes a prefilled email instead — so the
 * page never ships with a dead button. ⚠️ needs the client's account; we
 * can't create one on their behalf.
 */
export const FORM_ENDPOINT: string | null = null;

/** The test schedule (KDF/carbon-achievable claims ONLY — no PFAS, fluoride
 *  or TDS, which are RO-only; see docs/filter-reference.md §5. Every figure
 *  is placeholder pending NATA-accredited certification). */
export type ProofRow = { c: string; v: string; m: string; d: string };
export const PROOF_ROWS: ProofRow[] = [
  {
    c: "CHLORINE",
    v: "up to 99%*",
    m: "carbon + KDF redox",
    d: "Taste, odour and disinfection by-products — the everyday complaint at the tap.",
  },
  {
    c: "LEAD",
    v: "up to 98%*",
    m: "KDF 55 redox — soluble cations",
    d: "Dissolved lead from older fittings gains electrons at the media and plates on as solid metal.",
  },
  {
    c: "HEAVY METALS",
    v: "up to 96%*",
    m: "KDF redox",
    d: "Soluble metal cations bind to the copper-zinc granule surface and stay there.",
  },
  {
    c: "IRON & H₂S",
    v: "up to 95%*",
    m: "KDF 85 redox",
    d: "Staining iron and the rotten-egg smell precipitate out as insoluble solids.",
  },
  {
    c: "SCALE FORMATION",
    v: "up to 90%*",
    m: "limescale-reduction media",
    d: "Crystallisation is inhibited so minerals rinse through — formation reduction, not hardness removal.",
  },
  {
    c: "SEDIMENT",
    v: "> 99%*",
    m: "10/5/1 µm 3-layer pre-filter",
    d: "Grit, rust and silt caught in graded depth media before the finer stages.",
  },
];
