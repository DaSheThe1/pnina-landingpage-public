import type { CSSProperties } from "react";

/**
 * The hairline that runs down the process steps and draws itself as the section
 * scrolls past.
 *
 * ── WHY THIS IS A SERVER COMPONENT WITH NO JAVASCRIPT ──
 * The whole effect is one `stroke-dashoffset` on a CSS view-progress timeline
 * (globals.css → MOTION SYSTEM §2). Nothing here reads the scroll position, so
 * there is no observer, no rAF and no client bundle. Without CSS scroll-timeline
 * support, without JavaScript, and under `prefers-reduced-motion` the line is
 * simply already drawn — which is a finished design, not a degraded one. That is
 * the only acceptable failure mode on this site.
 *
 * ── DIRECTION ──
 * Placed with logical properties only (`inset-inline-start`), so it lands on the
 * RIGHT in Hebrew and would land on the left in an LTR locale with no override.
 * The node dots are circles, which have no direction at all.
 *
 * ── LAYOUT, AND WHY IT IS STACKED-ONLY ──
 * It is a decorative overlay on a `relative` wrapper, sitting in the section's
 * own horizontal padding, OUTSIDE the cards. It never occupies layout space and
 * never overlaps a card.
 *
 * ⚠️ IT ONLY EXISTS WHILE THE STEPS ARE A COLUMN, i.e. below `sm`. The line
 * threads FOUR BEADS, one per step, spaced down its length at (i+0.5)/steps —
 * which is a drawing of "these four things happen in this order, one after the
 * other" and is only true of a single stacked column. From 640px the grid is
 * two columns, and from 1024px it is one horizontal ROW of four: the steps run
 * ACROSS the page while the spine still runs DOWN its edge, so at 1440 it
 * rendered as a lone vertical gold line at x≈1300 with its four beads
 * connecting nothing at all. `sm:hidden` is the honest fix — there is no
 * horizontal version of this drawing to fall back to, and a decorative hairline
 * that describes a sequence must not be shown next to a layout that is not one.
 * If the grid's breakpoints change, this class changes with them.
 *
 * The inline-start offset is small on purpose: at `-start-3` on a 390px phone
 * the line sat ~13px from the screen edge, reading as page furniture rather
 * than as part of the cards' column. `-start-1.5` keeps it clear of the card
 * edge (the beads are 7px wide and centred on the stroke, so their inner edge
 * still clears the border) while binding it to the column it belongs to.
 */
export function ProcessSpine({ steps }: { steps: number }) {
  if (steps < 2) return null;

  return (
    <div
      aria-hidden
      className="process-spine pointer-events-none absolute inset-y-2 -start-1.5 w-2 sm:hidden"
    >
      <svg
        className="process-spine__svg"
        viewBox="0 0 2 100"
        preserveAspectRatio="none"
        focusable="false"
      >
        {/* pathLength=1 normalises the line so the dash maths is independent of
            how tall the section ends up: dasharray 1 is exactly one full stroke.
            Deliberately NO `vector-effect="non-scaling-stroke"` — it makes the
            dash pattern resolve in screen space instead of the normalised one,
            and the spine draws as three disconnected segments. It is not needed
            either: this viewBox is 2 units wide in a 2px-wide box, so the
            horizontal scale is 1 and a vertical stroke of 1 is already a real
            hairline no matter how far the box stretches vertically. */}
        <path className="process-spine__line" d="M 1 0 L 1 100" pathLength={1} />
      </svg>

      {Array.from({ length: steps }, (_, i) => {
        // Each dot sits at the middle of its step's share of the line, and
        // blooms as the line reaches it. Cover-relative ranges (rather than the
        // line's mixed entry/cover range) because they interpolate linearly.
        const at = (i + 0.5) / steps;
        const start = 18 + at * 46;
        return (
          <span
            key={i}
            className="process-spine__dot"
            style={
              {
                top: `${(at * 100).toFixed(2)}%`,
                "--dot-range": `cover ${start.toFixed(1)}% cover ${(
                  start + 8
                ).toFixed(1)}%`,
              } as CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
