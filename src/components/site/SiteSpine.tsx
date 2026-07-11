"use client";

import { useState, type FormEvent } from "react";
import { CONTACT } from "@/content/plates";
import { FORM_ENDPOINT, PROOF_ROWS } from "@/content/booking";
import C4FooterCredit from "@/components/c4-footer-credit/C4FooterCredit";

/*
  THE TAIL (Slice 2) — the journey sells; this closes. One compact section in
  the same dark language: a REAL booking form (POSTs to FORM_ENDPOINT when
  configured; composes a prefilled email until then — never a dead button),
  the interactive test schedule, licences and the substantiation line.
*/

type SubmitState = "idle" | "sending" | "logged" | "error";

function BookingForm() {
  const [state, setState] = useState<SubmitState>("idle");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>;
    if (!FORM_ENDPOINT) {
      // no endpoint yet — compose the booking email instead (still a real path)
      const body = `Hi Next Gen,\n\nI'd like to book a free in-home water test.\n\nName: ${data.name}\nSuburb: ${data.suburb}\nBest contact number: ${data.phone}\nPreferred day: ${data.day || "any"}\n\nThanks.`;
      window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(
        "Free water test — booking request",
      )}&body=${encodeURIComponent(body)}`;
      setState("logged");
      return;
    }
    try {
      setState("sending");
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      setState(res.ok ? "logged" : "error");
    } catch {
      setState("error");
    }
  };

  if (state === "logged") {
    return (
      <div className="tform-logged" role="status">
        <span className="tform-stamp">REQUEST LOGGED · REV E</span>
        <p>
          {FORM_ENDPOINT
            ? "Done — we'll call to confirm a time. No obligation after the test."
            : "Your email is ready to send — fire it off and we'll call to confirm a time."}
        </p>
      </div>
    );
  }

  return (
    <form className="tform" onSubmit={onSubmit}>
      <div className="tform-grid">
        <label>
          <span>NAME</span>
          <input name="name" type="text" autoComplete="name" required placeholder="Jane Citizen" />
        </label>
        <label>
          <span>SUBURB</span>
          <input name="suburb" type="text" autoComplete="address-level2" required placeholder="e.g. Joondalup" />
        </label>
        <label>
          <span>PHONE</span>
          <input name="phone" type="tel" autoComplete="tel" required placeholder="04xx xxx xxx" />
        </label>
        <label>
          <span>PREFERRED DAY</span>
          <input name="day" type="text" placeholder="optional" />
        </label>
      </div>
      <div className="tform-actions">
        <button className="tform-submit" type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Logging…" : "Book your free water test"}
        </button>
        <a className="tform-call" href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}>
          or call {CONTACT.phone}
        </a>
      </div>
      {state === "error" && (
        <p className="tform-err" role="alert">
          That didn&rsquo;t send — call us instead, or try again.
        </p>
      )}
    </form>
  );
}

function ProofTable() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="proof">
      <div className="proof-head">
        <span>TEST SCHEDULE — REDUCTION BY CONTAMINANT</span>
        <span className="proof-stamp">INDICATIVE · PENDING CERTIFICATION*</span>
      </div>
      {PROOF_ROWS.map((r, i) => (
        <div key={r.c} className={`proof-row${open === i ? " is-open" : ""}`}>
          <button type="button" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
            <span className="proof-c">{r.c}</span>
            <span className="proof-v">{r.v}</span>
            <i aria-hidden="true">{open === i ? "–" : "+"}</i>
          </button>
          <div className="proof-detail" hidden={open !== i}>
            <p>{r.d}</p>
            <p className="proof-m">METHOD — {r.m} · your free in-home test measures this</p>
          </div>
        </div>
      ))}
      <p className="proof-note">
        Figures are placeholders pending independent NATA-accredited testing — no PFAS, fluoride or TDS claims are
        made: those require reverse osmosis, which this system deliberately isn&rsquo;t.
      </p>
    </div>
  );
}

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

        <BookingForm />

        <ProofTable />

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
