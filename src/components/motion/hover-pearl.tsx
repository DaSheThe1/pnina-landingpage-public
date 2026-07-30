"use client";

import { useEffect, useRef } from "react";

/**
 * Daniel's hero flourish: a pearl that leans a few pixels toward the cursor
 * while its specular highlight tracks the cursor's angle, so it reads as a real
 * sphere catching the light in the room.
 *
 * ── DELIBERATELY CONFINED ──
 * Hero region only (it scrolls away with the first screen — it is absolutely
 * positioned, not fixed) and wide screens only, so it can never end up behind a
 * line of type on a narrow layout. A pearl that followed you down the whole page
 * would stop being a moment and start being a mascot.
 *
 * The sphere itself is pure CSS (globals.css §3): specular highlight, peach
 * edge, warm core, all from palette tokens. The two things JavaScript does are
 * lean and highlight angle — both written as a transform and two custom
 * properties, no layout in the loop.
 *
 * Only mounted for a fine pointer and no reduced-motion preference; see
 * hover-layer.tsx. TEMPORARY — one of the three hover variants survives.
 */

/** Maximum lean, in pixels. Past ~12 it stops being a lean and starts being a
 *  slide. */
const LEAN = 10;
const LERP = 0.08;

export function CursorPearl() {
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const orb = orbRef.current;
    if (!orb) return;

    let centreX = 0;
    let centreY = 0;
    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let raf = 0;
    let disposed = false;

    // The pearl's own position is read here and on scroll/resize only — never
    // inside the animation frame, where it would force a layout every frame.
    const measure = () => {
      const rect = orb.getBoundingClientRect();
      centreX = rect.left + rect.width / 2;
      centreY = rect.top + rect.height / 2;
    };

    const tick = () => {
      raf = 0;
      x += (targetX - x) * LERP;
      y += (targetY - y) * LERP;
      orb.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(
        2
      )}px, 0)`;
      // The highlight moves the OPPOSITE way to the lean, the way a real
      // specular does: the sphere turns toward the light source.
      orb.style.setProperty("--pearl-hx", `${(34 + (x / LEAN) * 12).toFixed(1)}%`);
      orb.style.setProperty("--pearl-hy", `${(28 + (y / LEAN) * 12).toFixed(1)}%`);
      if (
        (Math.abs(targetX - x) > 0.05 || Math.abs(targetY - y) > 0.05) &&
        !disposed
      ) {
        raf = requestAnimationFrame(tick);
      }
    };

    const schedule = () => {
      if (!raf && !disposed) raf = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      const dx = event.clientX - centreX;
      const dy = event.clientY - centreY;
      const distance = Math.hypot(dx, dy) || 1;
      // Normalised direction × the full lean: the pearl always leans all the way
      // toward the cursor, it just does it slowly. Scaling the lean by distance
      // made it look like it only noticed people standing next to it.
      targetX = (dx / distance) * LEAN;
      targetY = (dy / distance) * LEAN;
      orb.setAttribute("data-lit", "");
      schedule();
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      orb.removeAttribute("data-lit");
      schedule();
    };

    measure();
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    // Placement is empirical, not principled: the lower-inline-end quadrant of
    // the hero is the one large patch of bare canvas on the home page, clear of
    // the video frame, the headline column and the CTA row. Screenshot it again
    // if the hero layout moves — a pearl behind a line of Hebrew type is the one
    // outcome that would make this variant unusable. `xl` and up only, for the
    // same reason: below that the hero column reflows into that space.
    <div aria-hidden className="cursor-pearl top-[56vh] end-[34vw] hidden xl:block">
      <div ref={orbRef} className="cursor-pearl__orb" />
    </div>
  );
}
