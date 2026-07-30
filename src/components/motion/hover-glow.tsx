"use client";

import { useEffect, useRef } from "react";

/**
 * "pearl-light" — a soft warm radial that lazily follows the cursor over the
 * drifting colour field (D7's recommended option).
 *
 * One fixed element, one `translate3d`, nothing else: no layout is read in the
 * loop, no style is written except the transform, so the whole effect lives on
 * the compositor. The lerp (0.08) is what makes it read as light rather than as
 * a cursor accessory — it arrives a moment after you do.
 *
 * Only mounted for a fine pointer and no reduced-motion preference; see
 * hover-layer.tsx. TEMPORARY, like its two siblings — one of the three survives.
 */

/** How much of the remaining distance the glow covers each frame. */
const LERP = 0.08;
/** Half the orb's width, so the transform centres it on the cursor. */
const HALF = 200;

export function CursorGlow() {
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const orb = orbRef.current;
    if (!orb) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    let raf = 0;
    let disposed = false;

    const paint = () => {
      orb.style.transform = `translate3d(${(x - HALF).toFixed(1)}px, ${(
        y - HALF
      ).toFixed(1)}px, 0)`;
    };

    const tick = () => {
      raf = 0;
      x += (targetX - x) * LERP;
      y += (targetY - y) * LERP;
      paint();
      // Stop the loop once it has effectively caught up. It restarts on the next
      // movement, so an idle tab costs nothing.
      if (Math.abs(targetX - x) > 0.4 || Math.abs(targetY - y) > 0.4) {
        raf = requestAnimationFrame(tick);
      }
    };

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      // Fade in on the first real movement rather than at mount, so the glow is
      // never a mysterious blob sitting in the middle of an untouched page.
      orb.setAttribute("data-lit", "");
      if (!raf && !disposed) raf = requestAnimationFrame(tick);
    };

    const onLeave = () => orb.removeAttribute("data-lit");

    paint();
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div aria-hidden className="cursor-layer">
      <div ref={orbRef} className="cursor-glow__orb" />
    </div>
  );
}
