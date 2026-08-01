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
 * A small rise as an element scrolls into view.
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
 * CSS now hides NOTHING at any point. `data-reveal-ready` offsets a future
 * element by 16px and `data-reveal-shown` returns it to its authored position,
 * but opacity remains 1 throughout. A missing observer or timeline can
 * therefore cost the movement only; it cannot cost a paragraph. Server HTML,
 * no-JS, dead-JS and no-observer all remain plainly readable.
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
 * visible outright for the accessibility panel's own switch, and
 * `usePrefersReducedMotion` below stops this component arming the element at
 * all. The device preference is deliberately not one of this site's inputs;
 * see AGENTS.md rule 5.
 *
 * ── THE BROWSER DOES THIS BETTER, WHEN IT CAN ──
 * A `view()` timeline is only valid for a reveal that is explicitly allowed to
 * repeat. A timeline is reversible by definition, so one-time reveals use the
 * observer on every browser and the CSS path is reserved for an explicit
 * `once={false}`.
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
function cssDrivesReveals(once: boolean) {
  return (
    !once &&
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
  // "pending" → armed and shifted slightly, waiting to scroll into view.
  // "shown"   → returned to its authored position with the transition.
  const [state, setState] = useState<"open" | "pending" | "shown">("open");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Less motion asked for in the accessibility panel: never arm. The element
    // stays plainly visible and no observer is created.
    if (shouldReduceMotion) return;

    // CSS may drive only an explicitly repeating reveal. The normal one-time
    // path must reach `shown` and stay there when the visitor scrolls back.
    if (cssDrivesReveals(once)) return;

    // No observer (very old browsers, some embedded webviews): leave it open.
    if (typeof IntersectionObserver === "undefined") return;
    // The parser-blocking boot probe must have received an initial callback
    // before we let an observer arm anything. A missing or delayed lifecycle
    // fails open immediately.
    if (
      document.documentElement.getAttribute("data-reveal-observer") !== "ok"
    )
      return;

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
      // Pre-arm in both directions. At the process endpoints the neighboring
      // section sits just beyond the viewport, covered by the opaque stage;
      // this margin lets its one-time transition finish before a fresh exit
      // gesture can expose it.
      { threshold: 0.01, rootMargin: "25% 0px" }
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
      // Only this opt-in is allowed onto the reversible CSS view timeline.
      data-reveal-repeat={once ? undefined : ""}
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
