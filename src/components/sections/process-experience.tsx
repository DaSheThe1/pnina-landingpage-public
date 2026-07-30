"use client";

/**
 * Chooses how the "איך זה עובד" section is experienced.
 *
 * Server render and first paint are ALWAYS the static four-card section
 * (`ProcessSection`) — it is the accessible, indexable, no-JS truth of the four
 * steps, and it is the site's current design, not a stripped-down stand-in.
 * After mount, and only if every gate below passes, it upgrades to the
 * scroll-scrubbed pearl animation:
 *
 *   1. Less motion has not been asked for ON THIS SITE. `usePrefersReducedMotion`
 *      is the one hook allowed to answer that here: it reads the "הפחתת תנועה"
 *      switch in this site's accessibility panel (plus the temporary
 *      `?motion=force` review override), and deliberately NOT the device's own
 *      `prefers-reduced-motion` setting — since 2026-07-30 the scrub plays for a
 *      visitor whose OS asks for less motion, and only the panel switch stops
 *      it. A bare `matchMedia` call here would reinstate the old behaviour for
 *      this section alone (CLAUDE.md rule 5).
 *   2. The visitor has not asked to save data (`navigator.connection.saveData`)
 *      — the scrub streams several MB of frames.
 *   3. A media CDN is configured, so there is a bucket to stream them from.
 *   4. THE WHOLE SEQUENCE IS ACTUALLY THERE — first frame AND last frame, via
 *      `probeSequence`, which never costs more than one failed request. This is
 *      the gate that matters today and it is not theoretical: as of 2026-07-30
 *      the bucket holds the complete 180-frame MOBILE cut and only frames 1-18
 *      of the desktop one, so a phone gets the animation and a desktop keeps
 *      the four cards until the rest of that export lands. Checking only the
 *      first frame would have let the desktop through and then fired 162
 *      requests that all 404.
 *
 * A visitor who fails any gate keeps the static section permanently — same
 * copy, same `#process` anchor, nothing missing and nothing downloaded.
 *
 * ── THE FRAMES ARE SHARED, AND SOURCED IN ONE PLACE ──
 * `motion/pearl/` is also what `ScrollSequence` reads. Both go through
 * `sequence-source.ts` for the base URL, the frame count and the loader, so the
 * bucket layout has exactly one definition. See the note in `page.tsx` about
 * why `PearlRevealSection` is no longer mounted on the home page: it played
 * these same frames a second time, a few sections further down.
 */

import { useEffect, useState } from "react";

import {
  probeSequence,
  useSequenceSource,
} from "@/components/motion/sequence-source";
import { usePrefersReducedMotion } from "@/components/motion/use-reduced-motion";
import { prefersReducedMotion } from "@/lib/eval-flags";

import { ProcessSection } from "./marketing-sections";
import { ProcessScrub } from "./process-scrub";

type SaveDataNavigator = Navigator & {
  connection?: { saveData?: boolean };
};

export function ProcessExperience() {
  const reducedMotion = usePrefersReducedMotion();
  const source = useSequenceSource("pearl");
  // `source` is a fresh object on every render, so the effect below depends on
  // this string and not on the object — otherwise the probe would re-run
  // forever.
  const baseUrl = source?.baseUrl ?? null;
  const frameCount = source?.frameCount ?? 0;

  // The probe's image IS frame 1, handed to the scrub so it has something to
  // paint immediately rather than re-requesting the file it just fetched. The
  // base URL it was fetched FROM is stored beside it, because the two
  // orientations are different files: when a rotated phone or a resized window
  // crosses the cut-over, a result from the old prefix must not be handed to
  // the new one. Comparing at render is how that stays true without a
  // setState-in-effect to clear it.
  const [probe, setProbe] = useState<{
    baseUrl: string;
    frame: HTMLImageElement;
  } | null>(null);

  useEffect(() => {
    if (reducedMotion || !baseUrl) return;
    // `AccessibilityProvider` restores the stored preferences in a `setTimeout`,
    // so for the first tick after mount the hook above still answers "false" for
    // a visitor whose switch is on — long enough to fire the two probe requests.
    // The pre-paint boot script has ALREADY stamped the truth on <html>, and
    // `prefersReducedMotion()` reads exactly that attribute, so asking it here
    // means a woman who asked for less motion downloads no frame at all, not
    // even the probe's two. Same answer, one tick earlier — not a second gate.
    if (prefersReducedMotion()) return;
    if ((navigator as SaveDataNavigator).connection?.saveData === true) return;

    let cancelled = false;
    void probeSequence(baseUrl, frameCount).then((frame) => {
      if (!cancelled && frame) setProbe({ baseUrl, frame });
    });
    return () => {
      cancelled = true;
    };
  }, [reducedMotion, baseUrl, frameCount]);

  const ready =
    !reducedMotion && source !== null && probe?.baseUrl === source.baseUrl;
  if (!ready || !source || !probe) return <ProcessSection />;

  return (
    <ProcessScrub
      // Rebuild from scratch if the orientation changes.
      key={source.baseUrl}
      source={source}
      firstFrame={probe.frame}
    />
  );
}
