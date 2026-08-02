/**
 * ⚠️ TEMPORARY — EVALUATION KNOBS, NOT FEATURES.
 *
 * Three URL parameters that exist so Daniel can judge design work in a real
 * browser during the 2026-07 redesign round. All are read on the client only.
 *
 *     /?motion=force     ⚠️ INERT BY DEFAULT SINCE 2026-07-30, and scheduled for
 *                        deletion. It overrides the site's "הפחתת תנועה" panel
 *                        switch, which is now the ONLY thing that reduces
 *                        motion — so on a browser that has not switched it on
 *                        (i.e. every browser, by default) it changes nothing at
 *                        all. Kept working only so a stored key from the review
 *                        round keeps behaving predictably until it is removed.
 *     /?motion=reset     forget it again (see "STICKY", below). Still worth
 *                        typing once on a machine that stored `force` during the
 *                        review round.
 *     /?font=amatic|notosans|bonanova|bellefair|frank|noto|david|sans|assistant
 *                        swap the display (headline) face. `notosans` (Noto Sans
 *                        Hebrew at a real 700) is what the site ships — the face
 *                        Pnina's Canva document turned out to be set in;
 *                        `bonanova` is the display serif it replaced. The one
 *                        exception is `assistant`, which swaps the BODY face
 *                        back to Assistant instead.
 *     /?accent=sea|peach|pink|amber|gold
 *                        swap the ACCENT family — the filled CTA and the colour
 *                        of light on a panel. `sea` (Pnina's טורקיז) is the
 *                        shipped site and changes nothing; `peach` is the warm
 *                        first cut of the same brief; `pink` is the
 *                        orchid-magenta that shipped from 0.12.x to 0.16.x.
 *     /?accent=reset     forget the stored accent
 *
 * ── WHY `motion=force` EXISTED, AND WHY IT IS NOW REDUNDANT ──
 * It was built because Daniel's OS has "reduce motion" switched on: the site
 * used to follow that signal, so on his machine it rendered its reduced-motion
 * design — no hover layer, spine already drawn, reveals already visible — and he
 * could not see the work he was reviewing.
 *
 * On 2026-07-30 he decided the signal should not drive the site at all
 * ("Usually we want animations on by default. We don't want the clients to
 * override it by default using the browser thing"). The motion layer now plays
 * for everyone, so the problem this override solved no longer exists. It is kept
 * FUNCTIONAL rather than deleted today only so that a browser still holding the
 * stored key behaves predictably, and it now overrides just one thing: the
 * site's own accessibility-panel switch. It goes with the `?hover=` switcher at
 * the end of the round, and it must not be widened in the meantime.
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

/** The faces in §8 of globals.css. `notosans` is the shipped headline — Noto Sans
 *  Hebrew 700, the face identified from Pnina's own Canva document — and it lives
 *  in `:root` via the `--font-display` variable, not in §8, so selecting it
 *  explicitly is how you get back to today's headlines inside a tab that has
 *  already been switched. `bonanova` is the 0.12.x-0.16.x rendering, `bellefair`
 *  the 0.12.0 one and `frank` the pre-0.12.0 one.
 *
 *  ⚠️ `noto` is Noto SERIF Hebrew and predates all of this — it is NOT the
 *  shipped face. The shipped one is `notosans`. Do not merge them.
 *
 *  ⚠️ `assistant` is the odd one out: every other key swaps the HEADLINE face,
 *  that one puts the BODY back on Assistant, which Heebo replaced when Pnina
 *  asked for "Helvetica World". It rides on this parameter rather than getting a
 *  second one because it is the same question — which of the client's two
 *  requested faces is on screen — and because this whole switcher is deleted in
 *  one piece at the end of the review round. */
export const FONT_VARIANTS = [
  "amatic",
  "notosans",
  "bonanova",
  "bellefair",
  "frank",
  "noto",
  "david",
  "sans",
  "assistant",
] as const;
export type FontVariant = (typeof FONT_VARIANTS)[number];

/** The accent families in §11 of globals.css. `sea` is the shipped site —
 *  Pnina's turquoise lives in `:root`, not in §11 — so selecting it explicitly
 *  is how you get back to today's look without clearing the key. `peach` is the
 *  first cut of her 2026-08-02 brief (warm, before she asked for sea colours);
 *  `pink` is the 0.12.x-0.16.x rendering; `amber` is the pre-0.11.4 one. */
export const ACCENT_VARIANTS = ["sea", "peach", "pink", "amber", "gold"] as const;
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
 * The single question every JS motion gate outside the React tree should ask.
 *
 * Exactly ONE thing says "less motion, please": the site's own "הפחתת תנועה"
 * switch in the accessibility panel, read off the `data-a11y-reduce-motion`
 * attribute that both the pre-paint boot script and `AccessibilityProvider`
 * stamp on <html>. That keeps this a plain function with no React dependency.
 *
 * ⚠️ The device's `prefers-reduced-motion` setting is deliberately NOT read
 * here, and a `matchMedia` call must not be added back. Since 2026-07-30 the
 * site moves for every visitor by default and the panel switch is the only
 * opt-out — Daniel's call, in full in CLAUDE.md rule 5. This function is the
 * non-React half of that contract; `usePrefersReducedMotion`
 * (src/components/motion/use-reduced-motion.ts) is the other, re-rendering when
 * the switch changes where this one answers for a single moment in time.
 *
 * The `?motion=force` override can still answer "no" to the switch, but with
 * motion already on for everyone it is inert unless the switch is on.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  if (motionForced()) return false;
  return document.documentElement.dataset.a11yReduceMotion === "true";
}

/** The requested face, or null for the shipped pair (Noto Sans Hebrew 700 for the
 *  headlines, Heebo for the body). Deliberately NOT sticky: a font is judged by
 *  looking at it, so it is fine to ask for it every time, and a remembered one
 *  would silently mis-report which face the site actually ships. */
export function requestedFont(): FontVariant | null {
  const value = param("font");
  return (FONT_VARIANTS as readonly string[]).includes(value ?? "")
    ? (value as FontVariant)
    : null;
}
