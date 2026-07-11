# NGW-01 — Filter Reference for the Scroll Animation

> **⚠️ STAGE-ORDER SUPERSEDED (2026-07-10):** the client's actual FHWR-3SI-20 spec
> sheet (the SKU Aaron sells) labels the cartridges: **1 graded sediment
> (10/5/1µm 3-layer) → 2 KDF 55/85 + coconut carbon (the redox bed) →
> 3 limescale-reduction carbon.** The Part A table below (sediment → carbon
> block → GAC+KDF) was inferred from the Clear2O website and is stale on stage
> order — the sheet wins. Everything else in Part A (radial outside-in flow,
> vessel form, §A-KDF redox mechanics, §5 claim limits) stands. The built site
> follows the sheet order.

**Purpose:** ground-truth reference so the 3D scroll journey depicts a *real* filter with *real* parts and the *real* water path — not placeholder geometry. Hand this to the animation agent as source material.

> **⚠️ REAL PRODUCT PHOTOS (client-supplied 2026-07-11) — the 3D asset now
> matches these.** The physical FHWR-3SI-20 is: an **open charcoal
> powder-coated steel tube FRAME/CAGE** (rectangular; a top manifold plate the
> three vessels hang from, four corner posts, bottom rails, a mounting-hole
> tab top-left); **matte dark-charcoal heads** (NOT bright chrome); **brushed
> silver-white sumps** (20″×4.5″, slender); **brass IN/OUT connector ports**
> (gold, the "Brass Connector" callout); **two stainless-bezel + glass
> pressure gauges** on the top plate; **double black/green O-rings** at the
> sump threads; red pressure-release buttons. Cartridges out of housing:
> Stage 1 pink-tinted pleated sediment, Stage 2 white mesh/pleat, Stage 3
> white body with a **blue collar band**. Media piles: gold KDF granules +
> black carbon (Metal Guard), coconut carbon (ScaleGuard). The built 3D uses
> a cyan brand light-ring at each sump base as *our* signature accent (not on
> the real unit). Photos live with Caleb; observations captured here.

**Read this first — there are two different machines in play:**

- The **reference product** Caleb linked (Clear2o "whole house filtration") is a **3-stage system: Sediment → Sintered Carbon Block → GAC + KDF 55/85. There is NO reverse-osmosis membrane, no post-carbon stage, and no re-mineralisation stage.**
- The **current NGW-01 animation** depicts a **5-stage RO system: Sediment → Carbon Block → RO Membrane → Post-Carbon → Re-Mineralise.**

These are architecturally different filters that remove different things (see §5). Whichever one NGW-01 is actually selling, the animation must commit to *one* and build its internals from that. This doc gives full internals for **both** so the agent can build whichever is chosen. Part A = the Clear2o 3-stage (KDF). Part B = the 5-stage RO. Part C = how to render either honestly.

---

## PART A — The real Clear2o 3-stage system (KDF)

### Physical form (what the hardware actually is)

Three **"Big Blue" 20″ × 4.5″ housings** mounted side-by-side on a bracket/manifold at the mains, plumbed **in series**. Each housing = a deep-blue opaque **cap/head** with a 1″ **IN** port and 1″ **OUT** port on opposite sides, a pressure-release button on top, and a blue **sump** (canister) that screws up into the head. Inside each sump sits one **20″ × 4.5″ cartridge**. This is **not** one tall column — it is three separate vessels in a row.

### The true water path (this is "the workflow" that's currently missing)

Each vessel uses **radial, outside-in flow**, not straight-through:

1. Water enters the head's **IN** port.
2. It flows **down the annular gap** between the cartridge's outer wall and the sump wall.
3. Pressure forces it **radially inward through the media wall** (this is where filtering happens).
4. Filtered water collects in the **hollow core**, travels **up the core**, and exits the **OUT** port.
5. A pipe carries it to the **IN** port of the next vessel. Repeat for all three.

So the animation's journey is: **mains → Vessel 1 (sediment) → Vessel 2 (carbon) → Vessel 3 (GAC+KDF) → house.** Within each vessel: *enter top → spiral down the outside → punch inward through the media → rise up the core → move on.*

### Stage-by-stage internals

| Stage | Cartridge | Micron | Mechanism | Removes |
|---|---|---|---|---|
| 1 | Poly-spun sediment (triple graded-density: 10µm→5µm→1µm in one cartridge) | 10/5/1 | Mechanical depth straining, radial outside-in | Sand, rust flakes, silt, clay, scale, pipe/tank debris |
| 2 | Sintered carbon block | 1 | Adsorption onto micropore surface (+ 1µm mechanical) | Chlorine, chloramine, VOCs, chemical residue, taste & odour |
| 3 | GAC + KDF 55 + KDF 85 | 1 | GAC adsorption **+ KDF redox (electron exchange)** | Lead, mercury, iron, hydrogen sulphide (rotten-egg), scale, algae, bacteria control |

### What "working" looks like inside each stage (visual direction)

**Stage 1 — Sediment.** A white **fibrous spiral-wound mat**, fluffy on the outside, denser toward the core. Incoming water carries visible particulate: orange/brown rust flakes, grey silt, angular grit. As water pushes inward, **big particles stop at the fluffy surface, fine particles lodge deeper**, and clean water emerges at the core. Over service life the cartridge **browns/greys from the outside in** as it loads. *The "action" is particles decelerating and getting caught in fibres.*

**Stage 2 — Carbon block.** A solid **matte-black cylinder** with a hollow core. Cut into it and the wall is a **sponge-like micropore labyrinth**. Dissolved molecules (chlorine, chloramine, VOCs — invisible in reality, so represent as tinted dots/shimmer) **diffuse into the pore network and stick to the pore walls**; chlorine is catalytically neutralised. *The "action" is molecules being drawn into a maze of pores and held; the water's "chlorine shimmer" fades as it passes through.*

**Stage 3 — GAC + KDF (the hero moment; see §A-KDF).** A bed of loose granules: **black angular GAC mixed with glinting brass/copper-gold KDF granules**, held between mesh end caps. This is where the most visually distinctive chemistry happens and it is **entirely absent from the current animation.**

### §A-KDF — The redox reaction (the single best thing to animate, currently missing)

KDF media are **high-purity copper-zinc granules**. They remove contaminants by **redox (oxidation/reduction) — literally trading electrons** with contaminant molecules and converting them into harmless or insoluble forms. Each of these is a distinct, filmable micro-event happening on the surface of a glinting granule:

- **Chlorine → chloride.** A chlorine molecule meets the granule; the granule **donates electrons**; Cl₂ becomes harmless dissolved **chloride ions (Cl⁻)** that wash away. (>99% free chlorine removed.) *Show the electron hop and the chlorine "defusing" into ions.*
- **Lead → metallic plating.** A dissolved lead cation (Pb²⁺) reaches the granule, **gains electrons, becomes solid metallic lead (Pb⁰), and electroplates onto the granule surface** as a growing metallic skin. (Up to ~98% of soluble heavy-metal cations.) *Show ions snapping onto the granule and building a metallic sheen.*
- **Iron → rust precipitate.** The granule catalyses soluble ferrous iron (Fe²⁺) into **insoluble ferric hydroxide** — rusty flecks that would later be flushed by backwashing. *Show a dissolved ion becoming a visible orange particle.*
- **Hydrogen sulphide → copper sulphide.** The "rotten-egg" molecule's sulphur **strips an electron from the copper**, forming **black, insoluble copper sulphide** that precipitates out, plus water. *Show the H₂S molecule collapsing into a black grain.*
- **Microbes.** On contact, the redox reaction spawns **hydroxyl radicals and hydrogen peroxide** that rupture bacterial cells. *Show a microbe hitting the granule field and bursting.*

Net image: a bed of copper-gold granules, contaminant ions streaming in, sparks of electron transfer, lead plating as a metallic film, black CuS specks precipitating, iron flecks forming — and water leaving pristine. True, differentiated, and beautiful.

### Certifications on the reference product (real, usable trust cues)
5-year manufacturer's warranty, **NSF certified**, **WaterMark certified**.

---

## PART B — The 5-stage RO system (what NGW-01 currently animates)

Only relevant if NGW-01 genuinely includes RO. All standard, real components:

1. **Sediment** — same poly-spun cartridge as Part A, Stage 1.
2. **Carbon block** — same as Part A, Stage 2; here it also **protects the RO membrane** by stripping chlorine (chlorine destroys RO film).
3. **RO membrane** — a **spiral-wound thin-film composite (TFC)**: a sandwich of *semipermeable membrane + permeate carrier + feed spacer* **rolled around a central permeate tube**, sealed inside a horizontal white FRP pressure vessel. Under pressure (~8–14 bar) **pure water passes through the film to the permeate tube; dissolved salts, PFAS, fluoride, lead, nitrates are rejected** and swept to drain as **concentrate (brine)**. *Gorgeous to animate: unroll the spiral sandwich; show water splitting into a pure inward stream and a salty reject stream going to drain.*
4. **Post-carbon** — small inline GAC cartridge; removes storage-tank taste, final polish.
5. **Re-mineralise** — calcite/mineral media; RO water is aggressive and low-pH, so this **dissolves Ca²⁺/Mg²⁺ back in** and raises pH. *Show mineral granules dissolving minerals back into the stream.*

**Physical-reality caveat for the "one quiet column" fiction:** whole-house RO is **not** a slim single column with water in the top and out the bottom. RO produces slowly and needs an **atmospheric storage tank + re-pressurisation pump**, and it sends **reject water to a drain**. If NGW-01 shows RO as a single sealed column with no tank/drain, that's physically fictional. (KDF/carbon systems *can* honestly be shown as compact inline vessels; RO cannot.)

---

## PART C — Rendering either one honestly (fixing "random geometry / no workflow")

1. **Pick the machine.** Random internal geometry is unavoidable until the part list is fixed. Decide 3-stage KDF **or** 5-stage RO, then model *those specific parts* (§A tables / §B list). No generic discs.
2. **Show radial flow, not axial pass-through.** Cartridge filters work outside-in through a wall into a core. Water sheeting straight down through flat stacked plates misrepresents the mechanism. Even if you keep a single-column art abstraction, the flow arrows inside each bed should read as "in through the wall, up the core."
3. **Differentiate each stage's "action."** Sediment = particles caught in a fibre mat. Carbon = molecules disappearing into a micropore maze. KDF = electron-transfer redox with plating/precipitation. RO = spiral split into permeate vs reject. These should look *nothing alike*. If stages currently morph into similar abstract shapes, that's the tell that the internals aren't real.
4. **The section-view is your best friend and it's on-brand.** The whole site's thesis is "you can't photograph the inside of a sealed vessel, so we drew it." A real **Section A–A cutaway** of a vessel (outer wall, annulus, media wall, hollow core, flow arrows) *is* an engineering drawing coming to life — it fits the concept perfectly and forces real parts.
5. **Contaminant continuity.** A "before" contaminant cloud (chlorine, lead, PFAS, sediment per the site's contaminant schedule) can enter at the top and get **stripped stage by stage**, exiting clear — but only claim what the chosen machine can actually remove (§5 below).

---

## §5 — What each architecture can and can't remove (accuracy + claims)

This matters because NGW-01's benchmark table claims **PFAS up to 95%** and **fluoride up to 90%** — and those are **only achievable with RO**.

| Contaminant | 3-stage KDF (Clear2o) | 5-stage RO |
|---|---|---|
| Chlorine / taste / odour / VOCs | ✅ (carbon + KDF) | ✅ |
| Sediment | ✅ (pre-filter) | ✅ |
| Lead / soluble heavy metals | ✅ (KDF reduces, up to ~98% soluble cations) | ✅ |
| Iron / hydrogen sulphide | ✅ (KDF 85) | Needs pre-treatment |
| Bacteria / algae control | ✅ (KDF) | ✅ (membrane barrier) |
| **PFAS** | ❌ not validated for KDF/carbon | ✅ |
| **Fluoride** | ❌ not removed by carbon/KDF | ✅ |
| **Dissolved solids / TDS** | ❌ | ✅ |

**Implication:** if the real installed product is the Clear2o 3-stage KDF (no RO), the site's PFAS and fluoride claims aren't just "placeholder pending testing" — they're **not achievable with that hardware**, and the animation shouldn't depict PFAS/fluoride being removed. If NGW-01 needs those claims, the product needs RO — in which case it's *not* the Clear2o system and the internals should follow Part B. Filtration/health claims are regulated, so this needs resolving before the numbers or the visuals are locked.
