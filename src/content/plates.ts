/**
 * The drawing set. The hero LivingDrawing is SHEET 01 (revisions A·B·C); the
 * sections below are SHEET 02–09, each appending one revision row (drafting
 * convention skips "I"). The revision table doubles as the site nav, and the
 * persistent title block re-stamps as each sheet enters — finally flipping to
 * APPROVED FOR ISSUE at the CTA.
 *
 * ⚠️ Every performance / health / award / finance figure here is PLACEHOLDER and
 * flagged (*). Filtration + health claims are regulated; final figures are set at
 * certification. The footer SUBSTANTIATION KEY is the single hub every * points to.
 */
export type Revision = { rev: string; sheet: string; desc: string; id: string };

export const SITE_REVISIONS: Revision[] = [
  { rev: "D", sheet: "02", desc: "GENERAL NOTES", id: "plate-trust" },
  { rev: "E", sheet: "03", desc: "CONTAMINANT SCHEDULE", id: "plate-problem" },
  { rev: "F", sheet: "04", desc: "FLOW TEST — 5 STAGES", id: "plate-flowtest" },
  { rev: "G", sheet: "05", desc: "TEST SCHEDULE", id: "plate-benchmark" },
  { rev: "H", sheet: "06", desc: "APPROVALS BLOCK", id: "plate-rnd" },
  { rev: "J", sheet: "07", desc: "IN-SERVICE NOTES", id: "plate-benefits" },
  { rev: "K", sheet: "08", desc: "INSTALL SEQUENCE", id: "plate-process" },
  { rev: "L", sheet: "09", desc: "APPROVED FOR ISSUE", id: "plate-cta" },
];

export const CONTACT = {
  phone: "1300 000 000",
  email: "hello@nextgenwatersystems.com.au",
};
