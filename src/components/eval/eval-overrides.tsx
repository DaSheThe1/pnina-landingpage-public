"use client";

import { useEffect } from "react";

import { motionForced, requestedAccent, requestedFont } from "@/lib/eval-flags";

/**
 * ⚠️ TEMPORARY — the DOM half of the evaluation knobs in `src/lib/eval-flags.ts`.
 * Read that file's header first; it explains why these exist and when they go.
 *
 * All this does is stamp three attributes on <html>:
 *
 *     ?motion=force  →  <html data-motion="force">    (globals.css §7)
 *     ?font=noto     →  <html data-eval-font="noto">  (globals.css §8)
 *     ?accent=gold   →  <html data-accent="gold">     (globals.css §11)
 *
 * It runs in an effect rather than during render, so the server HTML and the
 * hydration pass are byte-identical for every visitor whether or not a
 * parameter is present. With nothing ever having been asked for it writes
 * nothing at all: a real visitor's document never learns this component exists.
 *
 * ── THE MOTION AND ACCENT HALVES ARE A SECOND OPINION, NOT THE DECISION ──
 * Both are set BEFORE the first paint by the inline script in
 * `eval-motion-script.tsx` — they have to be, now that they are remembered
 * across loads. This effect re-asserts the same answers afterwards purely so the
 * attributes are still correct if that script never ran, and REMOVES them when
 * the answer is no, which is what makes `?motion=reset` and `?accent=reset` take
 * effect immediately rather than on the next load.
 */
export function EvalOverrides() {
  useEffect(() => {
    const root = document.documentElement;
    if (motionForced()) root.dataset.motion = "force";
    else delete root.dataset.motion;
    const accent = requestedAccent();
    if (accent) root.dataset.accent = accent;
    else delete root.dataset.accent;
    const font = requestedFont();
    if (font) root.dataset.evalFont = font;

    return () => {
      delete root.dataset.motion;
      delete root.dataset.accent;
      delete root.dataset.evalFont;
    };
  }, []);

  return null;
}
