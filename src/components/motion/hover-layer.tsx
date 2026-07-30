"use client";

import { useSyncExternalStore } from "react";

import { CursorGlow } from "@/components/motion/hover-glow";
import { CursorGrid } from "@/components/motion/hover-grid";
import { CursorPearl } from "@/components/motion/hover-pearl";
import { prefersReducedMotion } from "@/lib/eval-flags";

/**
 * ⚠️ TEMPORARY — AN EVALUATION SWITCHER, NOT A FEATURE.
 *
 * D7 (docs/12) asked for two or three interactive-background concepts built so
 * Daniel can try them in practice and pick one. The remaining candidates are here
 * behind a URL parameter; the ones he does not pick get DELETED — component file,
 * styles in globals.css (§3) and this switcher. Nothing ships dormant, and nothing
 * here is a setting a visitor is meant to find.
 *
 *     /?hover=sand    THE DEFAULT — and it now mounts NOTHING. The default hover
 *                     experience is the sand floor itself (`SandFloor`,
 *                     sand-floor.tsx, globals.css §10): a real photograph of sand
 *                     behind the whole site that stirs under the pointer and under
 *                     a finger. It is mounted in the layout for EVERYONE, on every
 *                     variant below including `off`, because it is the page's
 *                     background rather than a cursor effect.
 *                     Until 0.11.4 this variant also put a small pearl on the sand
 *                     that followed the cursor. Daniel, 2026-07-30: "remove that
 *                     fucking pearl from the mouse." It is gone, component and all.
 *     /?hover=glow    a soft warm light that follows the cursor
 *     /?hover=grid    a dot field that brightens around the cursor
 *     /?hover=pearl   a large pearl in the hero that leans toward the cursor
 *                     (a background object, NOT a cursor follower)
 *     /?hover=off     identical to `sand` now, and kept only so that the parameter
 *                     still has a way to say "no extra layer" out loud
 *
 * The parameter is read once, on mount, and persisted NOWHERE: no localStorage,
 * no cookie, nothing about this visitor written to her device. Internal
 * navigation drops it, so add it to whichever page you want to look at.
 *
 * ── WHO NEVER GETS ANY OF THIS ──
 * Touch devices (a cursor effect with no cursor is dead weight in the bundle and
 * on the GPU) and anyone who has turned the accessibility panel's "הפחתת תנועה"
 * switch on. Both are checked before
 * a variant mounts, so there is no layer, no listener and no rAF loop at all.
 * Neither exclusion applies to the sand floor, which is a background: it is drawn
 * for touch devices too, and its ripple has its own reduced-motion gate.
 */

export type HoverVariant = "sand" | "glow" | "grid" | "pearl" | "off";

const VARIANTS: readonly HoverVariant[] = [
  "sand",
  "glow",
  "grid",
  "pearl",
  "off",
];
const DEFAULT_VARIANT: HoverVariant = "sand";

function isVariant(value: string | null): value is HoverVariant {
  return value !== null && (VARIANTS as readonly string[]).includes(value);
}

/** Nothing to subscribe to: the choice is read once and never changes for the
 *  life of the page (it comes from the URL, and internal navigation drops it). */
const subscribe = () => () => {};

function readVariant(): HoverVariant | null {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    return null;
  }
  // `prefersReducedMotion` — not `matchMedia` directly — so `?motion=force`
  // can mount a variant for evaluation on a machine that has reduce-motion on.
  // See src/lib/eval-flags.ts.
  if (prefersReducedMotion()) {
    return null;
  }
  const requested = new URLSearchParams(window.location.search).get("hover");
  return isVariant(requested) ? requested : DEFAULT_VARIANT;
}

/** The server render, and the hydration pass: these layers are client-only by
 *  nature and must never appear in the static HTML. */
const readServerVariant = (): HoverVariant | null => null;

export function HoverLayer() {
  const variant = useSyncExternalStore(
    subscribe,
    readVariant,
    readServerVariant
  );

  if (variant === "glow") return <CursorGlow />;
  if (variant === "grid") return <CursorGrid />;
  if (variant === "pearl") return <CursorPearl />;
  // `sand`, `off`, and every case the gates above rejected: the sand floor is the
  // whole hover design and it is mounted in the layout, not here.
  return null;
}
