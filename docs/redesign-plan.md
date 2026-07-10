# NGW-01 Redesign Plan — from the 2026-07-10 multi-agent design pass

7 agents (4 web-research + 3 code-audit, 808k tokens) synthesized against the
client critique. Phase 0 ships immediately; Phases 1–5 are each independently
shippable and reviewed one at a time.

## Direction (one paragraph)

The site becomes ONE thing: a single continuous drafting space in which the
actual NGW-01 machine hangs suspended in mid-air and the entire story is told
on one pinned scroll journey. We commit to the "Living Drawing" concept but
invert its architecture — the WebGL machine goes full-bleed (no sheet, no
card, no second background) floating in a shared graphite atmosphere with a
soft occlusion pool beneath it; the vellum sheet remains only as a diegetic
prop that materialises for the trace beat and dissolves again. The majority of
the current plates (contaminants, three stages, whole-home, service) are
absorbed into the journey as scroll-windowed copy beats and interactive stage
cards welded to the 3D parts: the water-run parks at each vessel with its spec
card, then the service explode lifts heads and cartridges in a genuine
time-staggered deconstruction where each of the three visibly-different
cartridges (white pleated / GAC wrap / black carbon block) stays suspended and
gets a drawn leader, a lettered label, and a clickable detail card. Realism
comes from a photography pipeline (Neutral tone mapping, Lightformer studio
streaks, anisotropic brushed stainless, printed vinyl labels, baked bevels and
imperfections) instead of glossy defaults; craft comes from pen-plotter-timed,
mask-stroke draughting with ISO sheet furniture and a revision-block narrative
replacing every decorative grid. Below the journey sits only a compact
conversion tail — interactive proof table, a real booking form, and a
persistent title-block "BOOK FREE TEST" stamp — so the journey sells and the
tail closes.

## Phase 0 — defect fixes (ship immediately)

1. **Broken primary CTA**: `SiteSpine.tsx:470` `href="#book"` → `#plate-cta`
   (no `#book` element exists; the site's main button does nothing).
2. **Plate 03 callout text pile-up** (the client screenshot): `.dc` callouts
   are absolute overlays with hard-coded percentages, no width cap, no
   background — compute anchors from the same `items[].a` angles as the SVG
   leaders, add `max-width: 17ch` + paper-chip background, and raise the
   static-flow fallback from 760px to 1080px (the whole 760–1080 band collides).
3. **Plate 05 stamp prints across the table header** — reserve space above.
4. **Footer stamp prints over grid cells** — move into flex flow.
5. **Fixed chrome chip overlaps content under ~1700px** — collapse earlier.
6. **"DETAIL A — SCALE 4:1" vs "NOT TO SCALE" contradiction** — keep 4:1.
7. **Hero BOM leaders land 4–18px short of the assembly** — y2 → 240 + dots.
8. **Plate 04 unlabeled IN/OUT ports** (dead `.flow-io` CSS already exists).
9. **Plate 07 label baseline risks clipping** — viewBox height 300 → 320.
10. **Dimension value stamps before its lines draw** — sequence label after.
11. **Explode label flicker at threshold** — hysteresis (0.38 on / 0.5 off... inverted).
12. **CTA hygiene** — asterisk out of the tel: tap target; REAL_PHONE gate;
    Plate 08 "NEXT: BOOK YOUR FREE TEST" becomes a real link.

## Phase 1 — One Continuous Space (kill the plane-on-plane) — M / medium risk

Resolves critique #1, #9. The machine floats full-bleed; no card-on-card.

- Move the WebGL canvas out of `.plate-sheet` → direct child of `.plate-stick`
  (absolute inset 0). The vellum sheet remains a 4:3 prop that materialises
  only for the trace beat.
- Paint the radial "pool of light" INSIDE WebGL (background quad or
  scene.background CanvasTexture) from color stops shared with the CSS
  gradient via one ts module → zero seam, Vignette darkens both together.
- Sheet box-shadow only exists while the paper does (tween with paper rise).
- Derive dock/ink registration from the camera projection + measured DOM rect
  (replaces magic 0.781 / −0.4 / 0.56) so it survives every viewport.
- Scene fog matched to the background hex; AccumulativeShadows occlusion pool
  (no visible floor); shared film grain (GL Noise + DOM feTurbulence).
- SVG shaded still doubles as poster until the Canvas is ready (no pre-roll gap).

## Phase 2 — The Journey Carries the Story — L / HIGH risk (the structural rebuild)

Resolves #2, #3, #10, #11, #12. The majority of the site moves INTO the journey.

- `.plate-hud` copy-beat system: absolute overlay, one child per beat with
  `data-window=[a,b]`, driven by the existing `applyFrame` — repurposes the
  orphaned `.jbeat/.journey-hud` CSS. Max ~2 sentences + 1 stat per beat.
- Beat map: hero headline + CTA (p 0–0.06) → "INSIDE THE MACHINE" kicker
  (0.35–0.44) → stage 01/02/03 info cards frame-locked to the interior windows,
  in the dead half opposite each parked vessel → service copy during the
  explode hold → hand-off line at 0.93–1.0.
- Widen the fully-drawn-plate hold (~28svh → ~65svh of scroll).
- **Genuine labeled deconstruction** (client #3): time-staggered explode —
  heads lift, then cartridges follow per-vessel; parts stay suspended for the
  whole dwell; drawn leader + lettered label + clickable spec card per part.
- **Interactive explode labels** (client #2): the 3 lifted cartridges each get
  a real-DOM expandable card (media, micron rating, service interval, what it
  removes). Keyboard/a11y free because they're buttons.
- **Touch the machine** (client #11): hover brightens a vessel's ring + shows
  its label; click scroll-flies to that vessel's beat; pointer-parallax.
- Camera on CatmullRom curves (kills velocity kinks at 9 of 11 keys).
- "3 stages, one system" plate is absorbed by the in-journey stage cards; the
  standalone version becomes a compact tail figure.
- Kill the end-of-site rhythm: open frames on interior sheets, next sheet
  always peeking, "CONT'D ON SHT 09 →" continuation marks.

## Phase 3 — Make It Real (photography pipeline) — L / medium risk

Resolves #4, #8. "Feels like the actual product, not a rendition."

- NeutralToneMapping (Khronos PBR Neutral) replaces ACESFilmic; bloom off
  metal speculars (the #1 CG tell).
- Lightformer studio (tall vertical strip = signature streak down each sump).
- Anisotropic brushed stainless (circumferential brushing).
- Blender asset rebuild (glTF+Draco+KTX2, 3–6 MB): bevels on every edge,
  rolled lips, o-rings, wrench lugs, relief button, brass port bosses, baked
  AO/edge-wear/imperfection-roughness (fingerprints, wipe smudges).
- **Printed vinyl labels** as offset cylinder strips (brand, "NGW-3SI-20",
  stage text, MAX 100 PSI) — printed text sells realism more than any shader.
- Three visibly different cartridges (white pleated / speckled GAC / black
  carbon block) — makes the deconstruction legible.
- Scroll-driven DepthOfField focusing the part being discussed.

## Phase 4 — Draughting Craft — M / low risk

Resolves #6, #7, #8, #9. "Worked on forever."

- Pen-plotter timing engine: per-stroke duration from path length (~600px/s),
  pen-up gaps, ink pooling; drafting order (construction → outline → hatching
  → dimensions → lettering).
- Routed Gothic (digitised Leroy lettering) with mask-stroke "written" titles.
- Detail A rebuilt as a real drafting detail: glyph clusters per quadrant,
  elbowed leaders from feature to callout, detail tag on rim, compass overshoot.
- ISO 128 line-weight discipline (exactly 3 pen tokens, 2:1 ratio).
- **Grid backdrops deleted site-wide** (client #9) → ISO 5457 sheet furniture:
  one continuous vellum with margin zone ticks, centering marks, title block;
  scroll drives a "ZONE B-2 → B-3" readout. Vellum grain + imperceptible line
  wobble + one graphite smudge (no kitsch).
- Revision storytelling: plausible rev table rows + a revision cloud around
  the feature currently being explained.

## Phase 5 — Conversion Tail + Mobile — M / low risk

Resolves #13 (+#11, #12). "The site draws in customers."

- Real booking form (`id="book"`) drawn as title-block cells (NAME / SUBURB /
  PHONE / PREFERRED DAY), Formspree/Worker POST, success re-stamps the sheet
  "REQUEST LOGGED · REV M".
- Persistent "BOOK FREE TEST →" stamp button in the fixed chrome (mobile too).
- One co-creation moment (house size / water source / install point chips
  that annotate the model) before the ask.
- Interactive proof table: expandable rows + HEALTH/TASTE/APPLIANCES filters.
- Plate 07 house becomes a hotspot figure (per-room taps, supply lines draw).
- Mobile: bottom sheet-index strip (44px chips), journey ~350svh, dpr cap,
  no post-processing on pointer:coarse.
- Hero revision table becomes nav; dead hero code deleted after harvesting
  its pointer-influence pattern.

## Full agent outputs

Complete research findings (with URLs) and audit findings (file:line):
session task output `w5c91a7pf.output` — summarised here; ask Claude to
re-extract any section.
