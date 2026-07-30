"use client";

import { useSyncExternalStore } from "react";

import { useAccessibilityPreferences } from "@/components/accessibility/accessibility-provider";
import { motionForced } from "@/lib/eval-flags";

/** ⚠️ TEMPORARY. Nothing to subscribe to: `?motion=force` is settled before the
 *  first paint and cannot change for the life of the page. */
const subscribeToNothing = () => () => {};

/** The server renders for a visitor who has made no choice, which is what keeps
 *  one HTML document correct for everybody. */
const serverAnswer = () => false;

/**
 * The single reduced-motion decision for imperative behaviour.
 *
 * ── THE CONTRACT, SINCE 2026-07-30 ──
 * The site moves for EVERY visitor by default. The device's own
 * `prefers-reduced-motion` setting is deliberately NOT read here and does not
 * suppress anything; Daniel's call, stated twice that day: "Usually we want
 * animations on by default. We don't want the clients to override it by default
 * using the browser thing," and, about this panel switch, that reduced motion
 * "should be off by default".
 *
 * The one opt-out is the site's own "הפחתת תנועה" switch in the accessibility
 * panel. It starts OFF for everyone, it is stored per browser, and turning it on
 * gives the complete static rendering: no reveals, no scrub, no autoplay.
 *
 * So there are exactly two inputs now:
 *
 *   1. the site's own switch, from `AccessibilityProvider`;
 *   2. ⚠️ TEMPORARY — the `?motion=force` evaluation override, which can answer
 *      "no" to (1). It is now INERT BY DEFAULT: motion is already on for
 *      everyone, so this only matters inside a browser whose panel switch is on,
 *      and it is scheduled for deletion with the rest of the review knobs.
 *      See src/lib/eval-flags.ts.
 *
 * CSS handles transitions and keyframes: the reduced-motion block in globals.css
 * reads the same switch off `data-a11y-reduce-motion`. Everything JavaScript
 * drives — rAF loops, timers, autoplay, smooth scrolling, carousels, the WebGL
 * sand ripple, the pearl scrub — must ask THIS hook, so the answer is never
 * given differently in two places.
 *
 * Code outside the React tree should call `prefersReducedMotion()` from
 * src/lib/eval-flags.ts instead; it reads the same switch off the
 * `data-a11y-reduce-motion` attribute that the provider and the pre-paint boot
 * script both stamp on <html>.
 *
 * There is no longer a second hook for "the choice she made HERE": with the OS
 * seed gone, the provider's value IS the explicit choice, so the hero clip
 * (hero-video.tsx) reads this one like everything else.
 */
export function usePrefersReducedMotion(): boolean {
  const { reduceMotion } = useAccessibilityPreferences();
  const forced = useSyncExternalStore(
    subscribeToNothing,
    motionForced,
    serverAnswer
  );

  if (forced) return false;
  return reduceMotion;
}
