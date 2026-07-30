"use client";

import { useSyncExternalStore } from "react";

import { useAccessibilityPreferences } from "@/components/accessibility/accessibility-provider";
import { motionForced } from "@/lib/eval-flags";

/** The device's own setting, subscribed to so a visitor who changes it mid-visit
 *  is obeyed without a reload. */
function subscribeToMediaQuery(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function deviceAsksForLessMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** ⚠️ TEMPORARY. Nothing to subscribe to: `?motion=force` is settled before the
 *  first paint and cannot change for the life of the page. */
const subscribeToNothing = () => () => {};

/** The server renders for a visitor with no device preference and no override,
 *  which is what keeps one HTML document correct for everybody. */
const serverAnswer = () => false;

/**
 * The single reduced-motion decision for imperative behaviour.
 *
 * CSS handles transitions and keyframes (the reduced-motion block in
 * globals.css covers both the device preference and the panel's own switch).
 * Everything JavaScript drives — rAF loops, timers, autoplay, smooth scrolling,
 * carousels, the WebGL sand ripple — must ask THIS hook, so that the three
 * inputs below are never answered differently in two places:
 *
 *   1. the device's `prefers-reduced-motion` setting;
 *   2. the site's own "הפחתת תנועה" switch in the accessibility panel;
 *   3. ⚠️ TEMPORARY — the `?motion=force` evaluation override, which is the one
 *      thing that can answer "no" to (1) and (2). It only ever exists for a
 *      browser in which somebody typed the parameter, it has no UI, and it is
 *      deleted with the rest of the review knobs. See src/lib/eval-flags.ts.
 *
 * Code outside the React tree should call `prefersReducedMotion()` from
 * src/lib/eval-flags.ts instead; it reads the same three inputs, taking (2) off
 * the `data-a11y-reduce-motion` attribute that the provider and the pre-paint
 * boot script both stamp on <html>.
 */
export function usePrefersReducedMotion(): boolean {
  const { reduceMotion } = useAccessibilityPreferences();
  const device = useSyncExternalStore(
    subscribeToMediaQuery,
    deviceAsksForLessMotion,
    serverAnswer
  );
  const forced = useSyncExternalStore(
    subscribeToNothing,
    motionForced,
    serverAnswer
  );

  if (forced) return false;
  return reduceMotion || device;
}

/**
 * The panel's switch on its own, ignoring the device preference.
 *
 * Only the hero clip uses this. It autoplays for everyone by Daniel's
 * 2026-07-29 call — muted, captioned, with an always-visible pause control —
 * so a device-level preference does not stop it; a woman who deliberately asks
 * for less motion *on this site* does. `hasExplicitPreferences` is what tells
 * the two apart: the provider seeds `reduceMotion` from the device, and that
 * seed must not be read as a choice she made here. Anything else that moves
 * should use `usePrefersReducedMotion` above.
 */
export function useSiteReducedMotionChoice(): boolean {
  const { reduceMotion, hasExplicitPreferences } =
    useAccessibilityPreferences();
  const forced = useSyncExternalStore(
    subscribeToNothing,
    motionForced,
    serverAnswer
  );

  if (forced) return false;
  return hasExplicitPreferences && reduceMotion;
}
