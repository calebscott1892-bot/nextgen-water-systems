# Next Gen Water Systems — NGW-01

Concept/pitch site for a premium whole-home water filtration brand, by
**C4 Studios**. Next.js 14 (App Router) + TypeScript + React Three Fiber +
GSAP ScrollTrigger, statically exported to GitHub Pages.

**The idea:** *you can't photograph the inside of a sealed vessel — so we drew
it.* The whole site is one engineering drawing set. The hero is a scroll-driven
3D journey in which the product is traced over in white ink and momentarily
**becomes its own general-arrangement drawing**, then returns to live chrome —
and every section below is a numbered PLATE with a persistent title block and
an accruing revision table that doubles as the nav.

> **All performance / health / award / finance figures are PLACEHOLDER and
> flagged `*`** pending NATA-accredited certificates — filtration claims are
> regulated. The footer SUBSTANTIATION KEY is the hub every `*` points to.
> The site ships `robots: noindex` until real details land.

## The machine (ground truth)

The journey depicts the **real hardware architecture** the client sells
(Clear2O FHWR-3SI-20 class): **three 20″×4.5″ vessels on a bracket, plumbed in
series — no reverse osmosis.** Stage order per the client's spec sheet:

1. **Graded sediment** (10/5/1 µm 3-layer)
2. **KDF 55/85 + coconut carbon** — the redox bed (the hero moment: electron
   transfer, ions captured on copper-zinc granules)
3. **Limescale-reduction carbon** (scale *formation* reduction — not
   hardness/TDS removal, which only RO can claim)

Water flows **radially, outside-in**: down the annulus → in through the media
wall → up the hollow core → next vessel. Plate 04 is a true Section A–A of
that path. Full internals reference: [`docs/filter-reference.md`](docs/filter-reference.md).

## The journey (one scalar drives everything)

`src/components/blueprint/LivingDrawing.tsx` owns a single pinned ScrollTrigger;
its progress `p` drives the SVG plate timeline *and* the 3D
(`ChromeStage.tsx`) camera rail:

| p | beat |
|---|---|
| 0.00–0.10 | hero drift — meet the assembly |
| 0.10–0.33 | front **dock** — white-ink trace over the live chrome (registration is projection-derived, then verified with ink-over-chrome overlays) |
| 0.33–0.44 | re-frame, approach vessel 1 |
| 0.44–0.74 | **the water run** — visit V1→V2→V3; each sump ghosts to reveal its cartridge, flow guides, and per-stage interior actions |
| 0.74–0.90 | elevated **service explode** — heads lift, cartridges rise, labels land |
| 0.90–1.00 | reassemble + settle |

## Dev / capture aids (namespaced, inert for visitors)

- `?ngjp=0.61` — freeze the ENTIRE frame state (ink + cross-fade + 3D) at any
  scroll scalar; every beat is capturable WYSIWYG
- `?nghide=stages,kit,housing,ring,post,shadows,borelight,flow,actions,caps` —
  bisect scene elements
- `?ngdbgray` — raycast from screen centre, log hits to console

Headless capture (three.js scenes need a real GPU — software GL is unreliable):

```bash
chrome --headless=new --no-sandbox --use-angle=d3d11 --user-data-dir=<fresh> \
  --screenshot=out.png --window-size=1440,900 --virtual-time-budget=40000 <url>
```

Restart the static server after every rebuild (stale hashed chunks 404 as a
furniture-only "blank"), and retry captures — a blank ≈114 KB frame means the
HDR-env suspense lost the race with the time budget.

Rig gotchas, hard-won:

- Chrome headless clamps `--window-size` **width to ~500 minimum** — a
  "390-wide mobile" capture silently lays out at ~515 px and crops the PNG,
  manufacturing overflow bugs that don't exist. Portrait: use `500,1082`.
- Captures of the **live** site want `--virtual-time-budget=90000` (the
  network HDR fetch races harder than localhost).
- Serve the export nested to match basePath
  (`<dir>/nextgen-water-systems/`) — serving `out/` at root 404s (≈8 KB PNG).
- After pushing, match the Actions run on **headSha** — `gh run list` right
  away happily reports the *previous* run's `completed success`.

## Run / deploy

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm build          # static export → ./out
```

Deploys to **GitHub Pages** via `.github/workflows/deploy.yml` on push to
`main` (basePath `/nextgen-water-systems`, prod-gated). The env HDRI is
self-hosted (`public/hdri/`) and preloaded from the layout head.

## Going live checklist

1. Real contact details (`src/content/plates.ts` CONTACT) + domain in
   `metadataBase`, then remove the `robots` block in `src/app/layout.tsx`.
2. Certify every `*` figure (Plate 05 schedule cites method per row).
3. Confirm final hardware spec/dimensions against the shipped SKU.

---

Designed & built by **C4 Studios**.
