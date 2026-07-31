"use client";

import { useEffect, useRef, useState } from "react";
import type { ElementType, ReactNode } from "react";

import { usePrefersReducedMotion } from "@/components/motion/use-reduced-motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger delay in milliseconds. */
  delay?: number;
  /** Render as a different element (default div). */
  as?: ElementType;
  /** Re-trigger every time it enters the viewport. */
  once?: boolean;
};

/**
 * Fade-and-rise as an element scrolls into view.
 *
 * ── IT FAILS OPEN, AND THAT IS THE POINT ──
 * This used to be the other way round: `globals.css` set `[data-reveal]
 * { opacity: 0 }` unconditionally and this component was the only thing that
 * ever turned it back on. Every one of these took the whole page down with it:
 * JavaScript disabled, the bundle failing to load on a bad connection, a
 * hydration error, a browser without IntersectionObserver, an observer that
 * simply never fires. The result was not "no animation" — it was a blank page
 * for a woman looking for help.
 *
 * So the CSS now hides NOTHING by default. The hidden state only exists while
 * this component has explicitly asked for it (`data-reveal-ready`) and has not
 * yet released it (`data-reveal-shown`). Server HTML, no-JS, dead-JS and
 * no-observer all render the content plainly visible.
 *
 * ── AND "FAILS OPEN" NOW MEANS "IS FORCED OPEN IF IT DOES NOT" (2026-07-31) ──
 * There was still one way to lose the text: arm an element, then have the thing
 * that was supposed to release it never do so. An IntersectionObserver that
 * exists but never delivers, a `view()` timeline that reports support and never
 * advances. Both left a paragraph blank forever on a Samsung phone, which is
 * what `RevealGuard` (src/components/motion/reveal-guard.tsx) now watches for:
 * anything still transparent well past the end of its own reveal range gets
 * `data-reveal-off`, and every reveal rule in globals.css excludes that
 * attribute. Nothing on this site may depend on an animation running in order
 * to be readable.
 *
 * ── WHY ABOVE-THE-FOLD CONTENT DOES NOT ANIMATE ──
 * Anything already inside the viewport when this mounts goes straight to
 * visible without ever being hidden. Hiding it at hydration would mean the
 * reader watches the text she is already looking at blink out and fade back —
 * worse than no animation, and on a slow phone it is a long blink. It also
 * keeps the largest element on the page out of the critical path. The scroll
 * reveal is for content she has not reached yet, which is where it reads as
 * calm rather than as a stutter.
 *
 * Reduced motion is handled twice over: globals.css forces every [data-reveal]
 * visible outright (for the device preference AND for the accessibility
 * panel's own switch), and `usePrefersReducedMotion` below stops this component
 * arming the element at all.
 *
 * ── THE BROWSER DOES THIS BETTER, WHEN IT CAN ──
 * Where CSS scroll-driven animations exist, globals.css drives the same fade
 * off a `view()` timeline and this component does NOTHING but render its
 * children with the attribute: no observer, no state, no re-render on scroll,
 * and the reveal tracks the scroll linearly instead of firing a fixed-duration
 * transition once a threshold trips. It also then works with JavaScript
 * disabled. The observer below is the fallback for everything else.
 */

/** Milliseconds → a shift of the scroll RANGE, which is what a stagger is on a
 *  view timeline. Capped: past ~4 steps a stagger stops reading as one gesture
 *  and starts reading as the page loading in pieces. */
const STAGGER_STEP_MS = 80;
const MAX_STAGGER_STEPS = 4;
const RANGE_SHIFT_PER_STEP = 4; // percent

/** Is the BROWSER driving reveals, rather than this component?
 *
 *  It asks the document, not the CSS engine. `reveal-boot-script.ts` runs
 *  before the first paint, makes that decision once and stamps it on <html> as
 *  `data-reveal-engine="css"`; globals.css §1 gates the scroll-driven reveal on
 *  the same attribute. Reading the attribute rather than re-running
 *  `CSS.supports` here is what makes it impossible for the two to disagree and
 *  end up either double-driving an element or driving it with neither. */
function cssDrivesReveals() {
  return (
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-reveal-engine") === "css"
  );
}

export function Reveal({
  children,
  className,
  delay = 0,
  as,
  once = true,
}: RevealProps) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  // "open"    → no attributes, plainly visible. The server state, and the
  //             resting state for anything we decide not to animate.
  // "pending" → armed and hidden, waiting to scroll into view.
  // "shown"   → armed and revealed, with the transition.
  const [state, setState] = useState<"open" | "pending" | "shown">("open");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Less motion asked for, by the device or by the accessibility panel:
    // never arm. The element stays plainly visible and no observer is created.
    if (shouldReduceMotion) return;

    // CSS is driving this element (see globals.css → MOTION SYSTEM §1). Leave
    // it open: arming it here would hide it behind an observer AND animate it
    // off the timeline at the same time.
    if (cssDrivesReveals()) return;

    // No observer (very old browsers, some embedded webviews): leave it open.
    if (typeof IntersectionObserver === "undefined") return;

    // Already on screen? Never hide it — see the note above.
    const rect = node.getBoundingClientRect();
    const inViewport =
      rect.top < window.innerHeight && rect.bottom > 0 && rect.height >= 0;
    if (inViewport && once) {
      const frame = requestAnimationFrame(() => setState("open"));
      return () => cancelAnimationFrame(frame);
    }

    setState("pending");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setState("shown");
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setState("pending");
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once, shouldReduceMotion]);

  // One stagger value, expressed twice: as a transition delay for the JS path
  // and as a range shift for the CSS path. Both are clamped to the same few
  // steps, so a caller passing `index * 90` for a ten-item list gets a calm
  // four-step stagger rather than a one-second queue.
  const steps = Math.min(
    MAX_STAGGER_STEPS,
    Math.max(0, Math.round(delay / STAGGER_STEP_MS))
  );
  const shift = steps * RANGE_SHIFT_PER_STEP;

  return (
    <Tag
      ref={ref}
      data-reveal=""
      // Presence, not value — the CSS selectors are attribute-existence checks.
      data-reveal-ready={
        shouldReduceMotion || state === "open" ? undefined : ""
      }
      data-reveal-shown={
        !shouldReduceMotion && state === "shown" ? "" : undefined
      }
      style={
        {
          "--reveal-delay": `${steps * STAGGER_STEP_MS}ms`,
          // Written as a whole value rather than as a number the stylesheet
          // does arithmetic on: `animation-range` takes a substituted var
          // cleanly, whereas calc() inside a timeline range is not something to
          // rely on across engines.
          "--reveal-range": `entry ${8 + shift}% cover ${26 + shift}%`,
        } as React.CSSProperties
      }
      className={className}
    >
      {children}
    </Tag>
  );
}
