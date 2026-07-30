"use client";

import { useEffect, useState } from "react";

import { publicEnv } from "@/lib/env";

/**
 * Where a scroll sequence's frames live, and which cut of them this device gets.
 *
 * The bucket layout is fixed by docs/13 §5:
 *
 *     motion/<collection>/m/f_001.webp … f_NNN.webp   9:16, phones
 *     motion/<collection>/m/final.webp                the reduced-motion still
 *     motion/<collection>/d/…                         16:9, everything wider
 *
 * so ACTIVATING a sequence is: upload the frames under that prefix. There is no
 * flag to flip and no deploy to run — a consumer probes the bucket on mount and
 * starts working the moment it answers. Everything configurable about a
 * sequence is the table below plus `NEXT_PUBLIC_MEDIA_BASE_URL`.
 */

/**
 * How many frames each collection was actually exported to.
 *
 * ⚠️ THESE ARE THE NUMBERS THAT MATTER, and this is deliberately their only
 * copy in the codebase: two components building URLs from two private constants
 * is how one of them ends up asking the bucket for files that were never
 * uploaded.
 *
 * ── `pearl` IS 180, NOT THE 90 docs/13 §6 SPECIFIES ──
 * Measured against the live bucket on 2026-07-30, not assumed: the mobile cut
 * at `motion/pearl/m/` holds exactly 180 frames at 540×960, and `f_181` is a
 * 404. The desktop cut is 1440×810, not the 960×540 that doc's table predicts.
 * The delivered masters win over the plan; docs/13 §5 and §6 are the stale side
 * of that disagreement and want a pass.
 *
 * `stage` has never been uploaded at all (every path under `motion/stage/`
 * 404s), so its number is still the doc's and is untested. It costs nothing
 * while the collection is absent: the probe answers "not there" either way.
 *
 * ── MEMORY, BEFORE RAISING EITHER ──
 * Decoded frames cost width × height × 4 bytes. Holding a cut whole would be
 * 90 × 540 × 960 × 4 ≈ 187 MB on a phone and 180 × 1440 × 810 × 4 ≈ 840 MB on
 * desktop — and the full desktop cut IS live in the bucket as of 2026-07-31,
 * so those figures stopped being theoretical. The answer this comment used to
 * demand exists now: `frame-store.ts` never holds a cut whole. It keeps a
 * byte-budgeted window of decoded bitmaps around the current scroll position
 * (80 MB phone / 220 MB desktop, argued there) and releases the rest, so
 * raising a frame count raises download bytes but not the decoded ceiling.
 */
export const SEQUENCE_FRAME_COUNTS = {
  pearl: 180,
  stage: 90,
} as const;

/** Phones get the 9:16 master; the cut-over matches the frame loader's own
 *  `(max-width: 640px)` every-2nd-frame rule. */
const NARROW_QUERY = "(max-width: 640px)";

export type SequenceCollection = keyof typeof SEQUENCE_FRAME_COUNTS;

export type SequenceSource = {
  baseUrl: string;
  aspect: "9/16" | "16/9";
  finalStillSrc: string;
  /** How many frames this collection was exported to — see the table above. */
  frameCount: number;
};

/**
 * Returns null until the viewport is known (first client render) and whenever
 * no media CDN is configured — in both cases the sequence renders nothing at
 * all rather than guessing an orientation and re-fetching 90 files when it
 * turns out to be wrong.
 */
export function useSequenceSource(
  collection: SequenceCollection
): SequenceSource | null {
  const [narrow, setNarrow] = useState<boolean | null>(null);

  useEffect(() => {
    const query = window.matchMedia(NARROW_QUERY);
    const apply = () => setNarrow(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  const base = publicEnv.mediaBaseUrl;
  if (!base || narrow === null) return null;

  const baseUrl = `${base.replace(/\/+$/, "")}/motion/${collection}/${
    narrow ? "m" : "d"
  }`;
  return {
    baseUrl,
    aspect: narrow ? "9/16" : "16/9",
    finalStillSrc: `${baseUrl}/final.webp`,
    frameCount: SEQUENCE_FRAME_COUNTS[collection],
  };
}

/**
 * Is this sequence actually THERE, in full, and what is its first frame?
 *
 * Two requests, never more, and AT MOST ONE OF THEM CAN FAIL:
 *
 *   1. `f_001.webp` — is anything at this prefix at all? A missing sequence
 *      stops here, having cost one 404.
 *   2. the LAST frame — did the export FINISH? This second question is not
 *      pedantry. On 2026-07-30 the live bucket held frames 1-18 of the desktop
 *      pearl cut and nothing else, so a first-frame-only check said "yes" and
 *      the loader then fired 162 requests that all 404'd. Asking for the last
 *      frame costs one request and turns a partial upload into a clean "not
 *      ready yet".
 *
 * Resolves to frame 1 (so the caller can paint immediately without re-fetching
 * a file it already has) or to null, which means "keep the static design".
 *
 * Takes the two values apart rather than a whole `SequenceSource`, because the
 * hook above returns a fresh object on every render and a caller has to be able
 * to put plain strings and numbers in an effect's dependency list.
 */
export async function probeSequence(
  baseUrl: string,
  frameCount: number
): Promise<HTMLImageElement | null> {
  const first = await loadSequenceImage(frameUrl(baseUrl, 1));
  if (!first) return null;
  const last = await loadSequenceImage(frameUrl(baseUrl, frameCount));
  return last ? first : null;
}

/** The URL of one frame in a sequence — `<baseUrl>/f_001.webp`, per docs/13 §5.
 *  Every consumer builds frame URLs through this, so the naming convention has
 *  exactly one home, next to the frame count above. */
export function frameUrl(baseUrl: string, n: number): string {
  return `${baseUrl.replace(/\/+$/, "")}/f_${String(n).padStart(3, "0")}.webp`;
}

/**
 * Loads an image, resolving to `null` on any failure instead of rejecting.
 *
 * A missing frame is an EXPECTED state on this site, not an exception: the
 * frames are AI-generated and are not in the bucket yet, so every consumer has
 * to be able to ask "is this sequence there at all?" and get a plain answer for
 * the cost of ONE request. Shared, so the two consumers (`ScrollSequence` and
 * the process scrub) probe identically and neither can drift into firing a whole
 * sequence at a prefix that holds nothing.
 */
export function loadSequenceImage(
  src: string
): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
