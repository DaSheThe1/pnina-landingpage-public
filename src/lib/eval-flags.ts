/**
 * ⚠️ TEMPORARY — EVALUATION KNOBS, NOT FEATURES.
 *
 * Three URL parameters that exist so Daniel can judge design work in a real
 * browser during the 2026-07 redesign round. All are read on the client only.
 *
 *     /?motion=force     ignore this machine's reduced-motion setting, so the
 *                        motion layer can be evaluated
 *     /?motion=reset     forget it again (see "STICKY", below)
 *     /?font=bonanova|bellefair|frank|noto|david|sans
 *                        swap the display (headline) face. `bonanova` (at a real
 *                        700) is what the site ships as of 0.12.x; `bellefair`
 *                        is the one-weight 0.12.0 rendering it replaced.
 *     /?accent=pink|amber|gold
 *                        swap the ACCENT family — the filled CTA and the colour
 *                        of warm light on a panel. `pink` (a dusty rose) is the
 *                        shipped site and changes nothing.
 *     /?accent=reset     forget the stored accent
 *
 * ── WHY `motion=force` EXISTS, AND WHY IT IS NOT A LOOPHOLE ──
 * Daniel's OS has "reduce motion" switched on, so on his machine the site
 * correctly renders its reduced-motion design: no hover layer, the process
 * spine already drawn, reveals already visible. That is the right behaviour and
 * rule 5 in CLAUDE.md is not negotiable — but it also means he cannot see the
 * work he is reviewing.
 *
 * So this is an explicit, opt-in override that a person can only ever turn ON
 * by typing a query string. A visitor's preference is still honoured
 * absolutely: with nothing ever having been typed, nothing in this file changes
 * a single computed style, and the reduced-motion block in globals.css keeps
 * the last word.
 *
 * ── STICKY (2026-07-29, at Daniel's request) ──
 * `?motion=force` used to be per-tab and had to be re-typed on every page load,
 * which during a review round means typing it dozens of times — and forgetting
 * it once means reviewing the wrong rendering without noticing. So the choice is
 * now remembered in `localStorage` under `EVAL_MOTION_KEY`, and re-applied on
 * later loads with no parameter present. `?motion=reset` removes the key and
 * hands the machine straight back to its real preference.
 *
 * What that does NOT change:
 *   - Nothing is ever written for a person who has not typed the parameter. The
 *     key is created by that one keystroke and by nothing else — no default, no
 *     UI control, no automatic opt-in. A real visitor's device stays untouched,
 *     which is why this needs no mention on the privacy page: it is a developer
 *     switch, not a record of anybody.
 *   - It stores a rendering preference for THIS browser and nothing about a
 *     person: one key, one word, no id, never sent anywhere.
 *   - It is still deleted at the end of the redesign round, together with the
 *     `?hover=` switcher, every `[data-motion="force"]` rule in globals.css §7,
 *     and `src/components/eval/`.
 *
 * Applied pre-paint by the inline script in `src/components/eval/eval-motion-
 * script.tsx`; `EvalOverrides` then asserts the same answer after hydration.
 */

/** The headline faces in §8 of globals.css. `bonanova` is the shipped one — it
 *  lives in `:root` via the `--font-display` variable, not in §8 — so selecting
 *  it explicitly is how you get back to today's headlines inside a tab that has
 *  already been switched. `bellefair` is the 0.12.0 rendering and `frank` the
 *  pre-0.12.0 one. */
export const FONT_VARIANTS = [
  "bonanova",
  "bellefair",
  "frank",
  "noto",
  "david",
  "sans",
] as const;
export type FontVariant = (typeof FONT_VARIANTS)[number];

/** The accent families in §11 of globals.css. `pink` is the shipped site — the
 *  dusty rose lives in `:root`, not in §11 — so selecting it explicitly is how you
 *  get back to today's look without clearing the key. `amber` is the pre-0.11.4
 *  rendering, which is what Pnina should be shown if she does not bless the rose. */
export const ACCENT_VARIANTS = ["pink", "amber", "gold"] as const;
export type AccentVariant = (typeof ACCENT_VARIANTS)[number];

/** The two localStorage keys this site ever writes. Prefixed and spelled "eval"
 *  so it is obvious in a devtools pane that they are review knobs. Kept in step
 *  by hand with the strings in `eval-motion-script.tsx`, which cannot import
 *  them: that script is stringified into the document head. */
export const EVAL_MOTION_KEY = "pnina:eval-motion";
/** ⚠️ The accent key is NOT a widening of the motion override, and the warning
 *  in CLAUDE.md rule 5 about "no second stored preference" is about that
 *  override specifically. This key stores a COLOUR, never a motion decision: it
 *  cannot make anything move, it cannot overrule `prefers-reduced-motion`, and
 *  no rendering it selects animates. Like the motion key it is created by one
 *  typed parameter and by nothing else, and it is deleted with the rest of the
 *  switcher at the end of the round. */
export const EVAL_ACCENT_KEY = "pnina:eval-accent";

function param(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

/** Wrapped because storage access throws outright in a few configurations
 *  (Safari's private mode historically, and any browser with site data blocked)
 *  and an evaluation knob must never be able to break the page. */
function stored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function persist(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* ignore — see `stored()` */
  }
}

/**
 * Is the reduced-motion override switched on for this browser? Client-only;
 * always false during SSR, which is what keeps the server HTML identical for
 * everyone.
 *
 * Reading it also WRITES the parameter's intent, so that a load carrying
 * `?motion=force` or `?motion=reset` settles the stored answer even if the
 * pre-paint script never ran (blocked scripts, an odd CSP). It is idempotent.
 */
export function motionForced(): boolean {
  if (typeof window === "undefined") return false;

  const requested = param("motion");
  if (requested === "force") persist(EVAL_MOTION_KEY, "force");
  if (requested === "reset") persist(EVAL_MOTION_KEY, null);

  return stored(EVAL_MOTION_KEY) === "force";
}

/**
 * The accent family this browser has been told to render, or null for the
 * shipped one. Sticky for the same reason the motion override is: an accent is
 * judged by scrolling the whole site in it, and re-typing the parameter on every
 * page would mean comparing the wrong renderings without noticing.
 *
 * Reading it also WRITES the parameter's intent, so a load carrying `?accent=`
 * settles the stored answer even if the pre-paint script never ran. Idempotent.
 * `pink` is stored explicitly (rather than clearing the key) so that switching
 * back to the shipped accent is a choice you can see in devtools; `reset` is what
 * forgets, and lands in the same place.
 */
export function requestedAccent(): AccentVariant | null {
  if (typeof window === "undefined") return null;

  const requested = param("accent");
  if (requested === "reset") persist(EVAL_ACCENT_KEY, null);
  else if ((ACCENT_VARIANTS as readonly string[]).includes(requested ?? "")) {
    persist(EVAL_ACCENT_KEY, requested);
  }

  const value = stored(EVAL_ACCENT_KEY);
  return (ACCENT_VARIANTS as readonly string[]).includes(value ?? "")
    ? (value as AccentVariant)
    : null;
}

/**
 * The single question every JS motion gate outside the React tree should ask,
 * instead of calling `matchMedia("(prefers-reduced-motion: reduce)")` itself.
 *
 * Two things can say "less motion, please": the device, and the site's own
 * "הפחתת תנועה" switch in the accessibility panel. The switch is read off the
 * `data-a11y-reduce-motion` attribute that both the pre-paint boot script and
 * `AccessibilityProvider` stamp on <html>, so this stays a plain function with
 * no React dependency. Components inside the tree should use
 * `usePrefersReducedMotion` (src/components/motion/use-reduced-motion.ts),
 * which re-renders when either input changes; this one answers for a single
 * moment in time.
 *
 * The `?motion=force` override is the ONLY thing that can answer "no" to either,
 * and it can only be turned on from the URL bar.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  if (motionForced()) return false;
  if (document.documentElement.dataset.a11yReduceMotion === "true") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** The requested headline face, or null for the shipped one (Bona Nova 700).
 *  Deliberately NOT sticky: a font is judged by looking at it, so it is fine to
 *  ask for it every time, and a remembered one would silently mis-report which
 *  face the site actually ships. */
export function requestedFont(): FontVariant | null {
  const value = param("font");
  return (FONT_VARIANTS as readonly string[]).includes(value ?? "")
    ? (value as FontVariant)
    : null;
}
