import { STORY_BEATS } from "@/content/journeyStory";

/**
 * Reduced-motion fallback (Slice 5). The whole sales story rides the scroll
 * as windowed HUD beats — which are hidden under prefers-reduced-motion, and
 * the 3D journey doesn't run there either. Without this, a reduced-motion
 * visitor would get the static plate + booking tail and none of the story.
 *
 * This renders the same STORY_BEATS as a plain, readable dark document. It is
 * `display:none` for everyone EXCEPT under prefers-reduced-motion (see the
 * media query in globals.css, which also collapses the pinned journey so the
 * static plate shows once rather than for 1050svh of dead scroll).
 */
export function StaticStory() {
  const beats = STORY_BEATS.filter((b) => b.id !== "hero" && b.id !== "handoff");
  return (
    <section className="static-story" aria-label="How the NGW-01 works">
      <div className="ss-inner">
        <p className="ss-lead">
          Three stainless vessels at the mains, plumbed in series. Here is what each one does to your water.
        </p>
        {beats.map((b) => (
          <article key={b.id} className="ss-beat">
            <span className="ss-eyebrow">{b.eyebrow}</span>
            <h2 className="ss-h">{b.h}</h2>
            <p className="ss-body">{b.body}</p>
            {b.rows && (
              <dl className="ss-rows">
                {b.rows.map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            )}
            {b.stat && <span className="ss-stat">{b.stat}</span>}
          </article>
        ))}
      </div>
    </section>
  );
}
