import { Button } from "@/components/ui/Button";
import { CONTACT } from "@/content/plates";
import C4FooterCredit from "@/components/c4-footer-credit/C4FooterCredit";

/*
  THE TAIL (Slice 1 of the continuous-space rebuild).

  The journey now carries the entire story — problem, stages, proof,
  credibility, benefits, install (src/content/journeyStory.ts) — so the
  eight white plates that used to live here are GONE (git history keeps
  them). What remains is one compact closing section in the same dark
  language: the machine hands off mid-scroll and this closes.

  Slice 2 upgrades the mailto to a real booking form (POST to a configurable
  endpoint) and adds the interactive proof table.
*/

const mailto = `mailto:${CONTACT.email}?subject=${encodeURIComponent(
  "Free water test — booking request",
)}&body=${encodeURIComponent(
  "Hi Next Gen,\n\nI'd like to book a free in-home water test.\n\nSuburb:\nBest contact number:\nPreferred day:\n\nThanks.",
)}`;

export function SiteSpine() {
  return (
    <section id="plate-cta" className="tail" data-sheet="02" data-rev="D" data-name="BOOKING — APPROVED FOR ISSUE">
      <div className="tail-inner">
        <span className="tail-eyebrow">REV D · BOOKING · APPROVED FOR ISSUE</span>
        <h2 className="tail-h">
          Find out what&rsquo;s
          <br />
          in your <span className="tail-cyan">water.</span>
        </h2>
        <p className="tail-p">
          A free, no-obligation in-home water test — a qualified technician tests your actual supply at your kitchen
          tap and shows you exactly what the NGW-01 would change.
        </p>
        <div className="tail-actions">
          <Button variant="primary" href={mailto}>
            Book your free water test
          </Button>
          <Button variant="ghost" href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}>
            Call {CONTACT.phone}
          </Button>
        </div>
        <p className="tail-note">* phone number is a placeholder pending the business line</p>

        <div className="tail-rule" aria-hidden="true" />
        <p className="tail-fine">
          NSF &amp; WaterMark certified hardware* · 5-year manufacturer&rsquo;s warranty* · licensed installation,
          Perth-wide* — every figure marked * is indicative and awaits NATA-accredited certification before launch.
        </p>
        <p className="tail-fine">© 2026 Next Gen Water Systems · ABN 00 000 000 000* · designed in Australia</p>
        <C4FooterCredit />
      </div>
    </section>
  );
}
