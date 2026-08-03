"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import { Price } from "@/components/ui/price";
import { prefersReducedMotion } from "@/lib/eval-flags";

/**
 * The free call's value moment, and the page's conversion beat — as of 0.21.0 a
 * three-rung PRICE LADDER:
 *
 *     המחיר הרגיל לשיחה אישית איתי      ₪690  ✕
 *                    ↓
 *     המחיר שקבעתי לנשים שמגיעות דרך האתר  ₪490  ✕
 *                    ↓
 *              היום, בשבילך
 *                 ללא עלות
 *                 [ button ]
 *
 * ── THIS IS THE ONE PLACE THE PAGE IS ALLOWED TO RAISE ITS VOICE ──
 * Everything else on this site whispers on purpose. Daniel's call (2026-07-29)
 * is that this single panel may be warm, gold, large and openly pleased with
 * itself, because what it is announcing is a gift and a gift may be announced.
 * That licence is LOCAL: it stops at the edge of this panel.
 *
 * ── ⚠️ TWO OF THIS FILE'S OWN RULES WERE REVERSED, BY THE PEOPLE WHO SET THEM ──
 * The paragraph that stood here forbade a strikethrough and forbade anything
 * that loops, and both are now allowed. Neither was overruled by an agent:
 *
 * 1. **THE STRIKETHROUGH IS BACK, AND THE REASON THE BAN EXISTED IS GONE.**
 *    AGENTS.md rule 4 banned struck-through prices because the ones the template
 *    shipped were INVENTED — "the only ones that ever existed here were invented".
 *    ₪690 and ₪490 are Pnina's own numbers, given on the 2026-08-03 call, and she
 *    asked for the ladder herself after seeing the one on Daniel's other landing
 *    page. A strikethrough on a number a person really charges is a disclosure;
 *    the ban was about fiction, not about the line through the digits.
 *    ⚠️ It still may not become a DISCOUNT: no red, no "%", no "היה/עכשיו", no
 *    countdown, no capacity claim, no "נשארו N מקומות". The Yarin panel this was
 *    ported from carries "ל-10 הראשונים החודש" and "נשארו מעט מקומות לחודש הזה";
 *    NEITHER came across, and neither may.
 *
 * 2. **THE PANEL'S GLOW MAY LOOP. THE PRICES MAY NOT.** Daniel, 2026-08-04, asked
 *    directly why the glow could not breathe forever the way Yarin's does. It can,
 *    and it does: a slow box-shadow breath says "this panel is special", which is
 *    not a pressure mechanic — nothing about it communicates scarcity or a
 *    deadline. What did NOT come across is Yarin's `.price-pulse`, which scales
 *    the struck prices up and down forever like a television ad. That one is the
 *    thing rule 4 named, and pointing a repeating flash at a woman reading about
 *    her own assault is where the line actually is.
 *    So: the panel breathes; the numbers hold still; everything in the SEQUENCE
 *    below (the rungs landing, the X stamps, the arrows drawing, the shine, the
 *    button's bloom) still happens exactly ONCE per arrival.
 *    ⚠️ And the glow is gated on the accessibility panel's switch like everything
 *    else — see §9. Yarin's version `!important`s its way through reduced motion;
 *    rule 5 forbids that here, and it costs nothing to obey.
 *
 * ── THE COMPOSITION ──
 * A vertical descent rather than 0.17.x's single diagonal. Each rung is a label
 * and a struck price; between rungs an arrow draws downward; the last step lands
 * on "ללא עלות", set in the body face at a real 700 in the warmest gold that is
 * legal for type, sized just under the section's own h2. Then the button.
 *
 * ⚠️ THE OLD CURVING ARROW IS GONE ON PURPOSE. There used to be one long curve
 * sweeping from the value line down to the gift. Pnina asked for it replaced by
 * arrows BETWEEN the price steps ("instead of having that weird curving arrow…
 * a nice arrow animation between each section of the price"), which is also what
 * makes the ladder legible: the arrow is now the operator between two numbers
 * rather than decoration beside one.
 *
 * The stack is capped (17rem) so the ladder keeps its proportions on a phone,
 * where the column is much wider than the 19rem it gets on a desktop. The
 * button is NOT capped: it spans the column.
 *
 * ── HOW IT PLAYS, AND WHY THIS ONE IS NOT A view() TIMELINE ──
 * The rest of the motion system (globals.css §1, §2, §5, §6) is scroll-driven:
 * those effects track the scrollbar and therefore run again, backwards, when
 * you scroll back up. That is right for a hairline that draws as you read past
 * it and wrong for this, which is a composed sequence with its own internal
 * timing — the value lands, the line reaches over with some weight, the gift
 * arrives, light crosses it, the button blooms. So it is an IntersectionObserver
 * playing a fixed CSS sequence, not a timeline glued to the scrollbar.
 *
 * ── IT REPLAYS ON RE-ENTRY (Daniel, 2026-07-30) ──
 * It used to play exactly once per page load and then unobserve itself. Daniel
 * asked for the "disappear-reappear": scroll the panel off the screen and back,
 * and the sequence runs again. So the observer now watches TWO thresholds and
 * the component is a small state machine:
 *
 *     out of view entirely (ratio 0)  →  reset to "armed" (the pre-roll frame)
 *     ≥35% of it back in view,
 *       having been seen approaching  →  "playing" (the sequence, from the top)
 *     armed and shown blank too long  →  "static" (the finished design, no show)
 *
 * The third row is the watchdog, two sections down; it is what guarantees that
 * `armed` — which is an INVISIBLE panel — can never be what a reader is left
 * looking at.
 *
 * WHY TWO THRESHOLDS AND NOT ONE: with a single 0.35 threshold, parking the
 * scroll right at the boundary — which is exactly what a thumb does on a phone —
 * would cross it repeatedly and restart the sequence from frame one over and
 * over, one frame at a time. That is a stutter, and on this panel a stutter
 * reads as a throb, which rule 4 forbids. Requiring a FULL exit before the next
 * arming means a partial scroll can never interrupt anything: while any pixel of
 * the panel is on screen the state cannot go backwards, so a sequence that has
 * started always finishes. Re-arming is also skipped while the sequence is still
 * running for the same reason.
 *
 * THIS IS STILL NOT A LOOP. Nothing here repeats on a timer, and nothing repeats
 * while the reader is looking at it: every replay costs a deliberate scroll away
 * and back. That is the same contract as every other reveal on the site, which
 * re-runs when you scroll past it again. An `infinite` keyframe is still the
 * answer no.
 *
 * ── ARMED IS AN INVISIBLE PANEL, SO NOTHING MAY BE LEFT IN IT ──
 * `armed` writes frame zero out as plain properties, and frame zero of this
 * sequence is opacity 0 on the value, on "ללא עלות" and on the CTA — which is
 * the section's ONLY button. So for as long as the panel is armed AND on the
 * screen, a woman is looking at an empty gold rectangle with no way out of it.
 * That is the worst failure this component can have, and it is worse than
 * having no animation at all. Two things now make it impossible.
 *
 * 1. A JUMP DOES NOT PLAY. The sequence is only bearable because it starts
 *    BEFORE the reader can see its blank first frame — which is what
 *    approaching by scrolling gives it, and what an anchor jump, a restored
 *    scroll position or a `scrollTo` does not: those hand her the finished
 *    scroll position and a blank panel in the same instant. So the play gate
 *    asks whether the panel was SEEN APPROACHING (`approached`, in the effect)
 *    and refuses it otherwise. This is the same argument the `onScreenAtMount`
 *    check makes for the first paint, applied to every later arrival.
 *    Scrolling in — including scrolling back in after a full exit, which is
 *    Daniel's replay — is untouched and still plays every time.
 *
 * 2. A FRAME-COUNTING WATCHDOG ENDS `armed` WHEN NOTHING ELSE WILL. While the
 *    panel is armed and properly in view, an animation-frame loop counts the
 *    frames the reader has actually been SHOWN it blank; past a small budget it
 *    snaps the panel to `static` — the finished composition, at full volume,
 *    with no animation. Not a fast replay, not a fade: the design, on screen,
 *    now. That covers a jump (nothing was ever going to play) and an observer
 *    starved of frames alike.
 *    It counts frames rather than milliseconds on purpose; the reasoning is on
 *    `runWatchdog` in the effect, and it is the difference between a guarantee
 *    and a race.
 *
 * The happy path never reaches the watchdog: the observer plays within a frame
 * of the panel crossing the threshold, and `playing` stops the loop. None of
 * this can make anything move — its only power is to REMOVE animation — nothing
 * in it repeats, and under a real reduced-motion preference it does not exist,
 * because the effect returns before any of it is installed.
 *
 * ── THE STATIC STATE IS THE DESIGN, NOT A FALLBACK ──
 * The base CSS is the FINISHED composition, at full volume: warm panel, value
 * present, arrow fully drawn, "ללא עלות" at full size, the button hot. Reduced
 * motion, no JavaScript, a dead bundle, no IntersectionObserver, or an element
 * already on screen at mount all land there — nothing is ever hidden waiting
 * for an animation to reveal it, which is rule 1 of the motion system. A
 * reduced-motion visitor gets the loud design; she just does not get the show.
 *
 * Reduced motion is gated HERE, in JavaScript, through `prefersReducedMotion()`
 * — the one helper that reads the accessibility panel's switch and the
 * `?motion=force` evaluation override. That is why globals.css §9 needs no
 * gate of its own and no mirrored copy in §7: with that switch on, this
 * component simply never arms. AND IT NEVER REPLAYS EITHER:
 * the observer is never created, so the panel is the finished still and the
 * re-entry behaviour above does not exist for her.
 */
/** The share of the panel that counts as "properly in view". The observer plays
 *  at this ratio and the watchdog measures itself against the same number, so
 *  there is one definition of "arrived" rather than two that can drift. */
const PLAY_RATIO = 0.35;
/** How many PAINTED frames a panel that arrived rather than approached — a
 *  jump, an anchor, a restored scroll position — may spend blank on screen.
 *  Nothing is coming for it (the play gate refuses a jump), so this is only
 *  large enough that a single odd frame during the arrival cannot trigger it. */
const BLANK_FRAMES_ARRIVED = 2;
/** The same budget for a panel that WAS seen approaching. Its sequence is on
 *  its way, and animation-frame callbacks run before intersection observations
 *  in the same frame, so a healthy observer costs exactly one of these. The
 *  extra frames are slack for an observer that is merely late, not broken. */
const BLANK_FRAMES_APPROACHING = 4;

export type LadderRung = {
  /** What the number IS. Without this a struck price is a number with a line
   *  through it and no argument — see the TODO(client) note in `OffersSection`. */
  label: string;
  /** "₪690" / "₪490", already formatted with the sign. Hers, both of them. */
  price: string;
};

export function FreeCallAnchor({
  rungs,
  freeLabel,
  free,
  children,
}: {
  /** offers.ladder.rungs — the struck rungs, in descending order. */
  rungs: LadderRung[];
  /** offers.ladder.freeLabel — "היום, בשבילך", the line above the payoff. */
  freeLabel: string;
  /** offers.intro.free — "ללא עלות". */
  free: string;
  /** The section's one CTA. It lives inside the sequence so it can be the last
   *  beat of it rather than a button that happens to sit underneath. */
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // "static"  → no attribute: the finished composition. The server state, and
  //             where every non-animating path stays for good.
  // "armed"   → the animations are attached but paused on their first frame.
  //             Entered before the first play AND again after every full exit.
  // "playing" → they run, start to finish. A replay is literally another
  //             armed → playing transition: globals.css §9 declares the
  //             animations ONLY on `playing` and writes frame zero out as plain
  //             properties on `armed`, so the declaration appears fresh each
  //             time and the keyframes restart. (They did not, before 0.12.0,
  //             when both states shared one declaration and `armed` merely
  //             paused it — read the note above the armed block in §9.)
  const [state, setState] = useState<"static" | "armed" | "playing">("static");

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // A real reduced-motion preference ends it here — the block is already in
    // its final state and stays there. No observer, so no replay either.
    if (prefersReducedMotion()) return;
    if (typeof IntersectionObserver === "undefined") return;

    // Already on screen when this mounts (a very tall window, a deep link, a
    // restored scroll position)? Then the reader is looking at it, and hiding
    // the price she is already reading so it can fade back in is worse than no
    // animation at all. Same rule as `Reveal`. The observer is still attached,
    // so it will play properly the first time she scrolls away and back.
    const rect = node.getBoundingClientRect();
    const onScreenAtMount = rect.top < window.innerHeight && rect.bottom > 0;
    if (!onScreenAtMount) setState("armed");

    // The state machine, in one place. `playing` may only be reached FROM
    // `armed`; `armed` may only be reached from a full exit — which is what
    // makes a half-scroll at the boundary a no-op instead of a stutter — and
    // `static` may also be reached from `armed` by the watchdog below, which is
    // the "show the design, skip the show" escape hatch.
    let current: "static" | "armed" | "playing" = onScreenAtMount
      ? "static"
      : "armed";
    const go = (next: typeof current) => {
      if (next === current) return;
      current = next;
      setState(next);
      if (next === "armed") {
        approached = false;
        watchArmed();
      } else stopWatchdog();
    };

    // ── The watchdog (see "ARMED IS INVISIBLE" in the header) ──
    // Measured against the REAL viewport, deliberately not against the
    // observer's root box: the 6% bottom inset exists to delay the START of a
    // sequence, and it must never delay showing a panel that is already there.
    // The denominator is capped at the window height so a panel taller than the
    // screen — which can never show 35% of itself — still counts as arrived
    // once it fills the window.
    const panel = node;
    const viewportHeight = () =>
      window.innerHeight || document.documentElement.clientHeight;
    const visibleFraction = () => {
      const r = panel.getBoundingClientRect();
      const vh = viewportHeight();
      if (r.height <= 0 || vh <= 0) return 0;
      const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      if (visible <= 0) return 0;
      return visible / Math.min(r.height, vh);
    };

    let watchdog: number | undefined;
    let blankFrames = 0;
    // ── DID IT ARRIVE, OR WAS IT ALREADY THERE? ──
    // The sequence is only ever tolerable because it starts BEFORE the reader
    // can see the blank first frame. Approaching by scrolling gives it that:
    // the panel comes up from below and the animation is already running by the
    // time she is looking at it. A JUMP does not — she is handed the finished
    // position and a blank panel in the same instant, which is the failure this
    // whole block exists to stop, and it is the same argument the
    // `onScreenAtMount` check above makes for the first paint.
    //
    // So the panel is only allowed to play if it was SEEN ON ITS WAY IN: at
    // least one observation, since this arming, with the panel within a screen
    // of the fold and not yet play-eligible. A scroll event is dispatched per
    // frame and even a hard fling moves ~100-200px in one, so no real scroll
    // can cross a whole viewport-height band without being seen; an anchor
    // jump, a restored scroll position or a `scrollTo` crosses it in one step
    // and never is. Reset on every arming, so a replay has to earn itself the
    // same way the first play did.
    let approached = false;

    const stopWatchdog = () => {
      if (watchdog !== undefined) cancelAnimationFrame(watchdog);
      watchdog = undefined;
      blankFrames = 0;
    };

    // ── IT COUNTS PAINTED FRAMES, NOT MILLISECONDS ──
    // The first version of this was a `setTimeout`, and a timer is the wrong
    // instrument: the observer fires on the frame clock and the timer runs on
    // the wall clock, so on a page that is painting slowly the two race and the
    // outcome — the designed sequence, or the snap — is decided by luck.
    // Measured on a browser rendering this page at ~2fps, where a 1.2s fuse and
    // the observer landed within one frame of each other and the result flipped
    // between runs.
    //
    // A frame count has no race in it, because it measures the only thing that
    // actually matters: how many times the reader has been SHOWN a blank panel.
    // No frame, no harm — she is not looking at anything yet. And the ordering
    // is fixed by the HTML spec's "update the rendering" steps: animation-frame
    // callbacks run BEFORE intersection observations are delivered, so on a
    // healthy frame this loop sees the panel armed exactly once and the observer
    // has flipped it to `playing` before the loop's next tick. Two ticks means
    // the observer had its frame and did not use it.
    //
    // The budget therefore scales with the device instead of fighting it: at
    // 60fps the panel can be blank for ~33ms, at 10fps for ~200ms, and on a page
    // that never paints, never. Nothing here can run while the tab is in the
    // background (rAF does not tick), and the loop only exists while the panel
    // is both armed and on screen — which is the only situation it is about.
    const runWatchdog = () => {
      watchdog = requestAnimationFrame(() => {
        watchdog = undefined;
        if (current !== "armed") {
          stopWatchdog();
          return;
        }
        // Only frames where the sequence OUGHT to have started already count.
        // Below the play ratio the panel is a sliver at the edge of the screen
        // on its way in, which is the designed approach and not a fault.
        if (visibleFraction() < PLAY_RATIO) {
          blankFrames = 0;
          runWatchdog();
          return;
        }
        blankFrames += 1;
        const budget = approached ? BLANK_FRAMES_APPROACHING : BLANK_FRAMES_ARRIVED;
        if (blankFrames < budget) {
          runWatchdog();
          return;
        }
        stopWatchdog();
        // `static` carries no animation at all, so this is the finished
        // composition appearing instantly and silently — not a sped-up replay,
        // and not something that can be mistaken for one.
        go("static");
      });
    };

    // Only ever SCHEDULES; it never changes state synchronously, so it is safe
    // to call from inside `go()` and from inside the observer callback.
    function watchArmed() {
      if (current !== "armed") {
        stopWatchdog();
        return;
      }
      const fraction = visibleFraction();

      // Seen on its way in. Deliberately NOT recorded for an observation that
      // is already play-eligible: that is the landing, not the approach, and
      // counting it would let a jump authorise its own sequence.
      if (fraction < PLAY_RATIO) {
        const r = panel.getBoundingClientRect();
        const vh = viewportHeight();
        if (r.top < vh * 2 && r.bottom > -vh) approached = true;
      }

      if (fraction <= 0) {
        // Off screen: armed is correct and invisible to everyone. Stop counting
        // frames, so the loop cannot tick for the whole time the reader is
        // somewhere else on the page.
        stopWatchdog();
        return;
      }

      if (watchdog === undefined) {
        blankFrames = 0;
        runWatchdog();
      }
    }

    // Scroll is what makes a discrete arrival discrete. Cheap: it reads one
    // rect, and only while the panel is armed.
    const onViewportChange = () => {
      if (current === "armed") watchArmed();
    };
    window.addEventListener("scroll", onViewportChange, { passive: true });
    window.addEventListener("resize", onViewportChange, { passive: true });

    // Arm the clock for the initial `armed` set above (`go` was not involved).
    watchArmed();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // FULLY out of the viewport: re-arm, ready for the next arrival. This
          // is the only transition that can undo a finished sequence, and it can
          // only happen when there is nothing on screen to see it happen.
          if (entry.intersectionRatio === 0 && !entry.isIntersecting) {
            // Checked against the REAL viewport, not the observer's root box.
            // `rootMargin` shrinks the bottom edge by 6%, so "ratio 0" can fire
            // while the panel is still visible in that strip — and re-arming
            // there would blank a panel the reader can see. This is the guard
            // against that.
            const r = entry.boundingClientRect;
            if (r.bottom <= 0 || r.top >= window.innerHeight) go("armed");
            continue;
          }
          // Properly in view: play. Refused unless we are ARMED — which is both
          // what stops a sequence in flight being restarted from the top by a
          // small scroll, and what stops the panel animating for a reader who
          // was already looking at it when the page loaded (that path never
          // leaves "static") — and unless the panel was seen approaching, which
          // is what tells a scroll apart from a jump (see `approached`). A jump
          // falls through to the watchdog and gets the finished design instead.
          if (
            entry.intersectionRatio >= PLAY_RATIO &&
            current === "armed" &&
            approached
          ) {
            go("playing");
          }
        }
        // A callback that changed nothing still tells us the panel moved (a
        // late-loading image above it, a font swap), and that is an arrival the
        // scroll listener never sees. Re-check the clock.
        if (current === "armed") watchArmed();
      },
      // TWO thresholds. 0 is the full-exit edge that re-arms; 0.35 is "properly
      // in view" — a third of the block rather than half, because the block is
      // tall and on a short laptop window half of it is more than a screenful.
      // `rootMargin` pulls the play edge a little inside the bottom of the
      // screen so the sequence starts when the panel has arrived, not as its
      // first pixel appears.
      { threshold: [0, PLAY_RATIO], rootMargin: "0px 0px -6% 0px" }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onViewportChange);
      window.removeEventListener("resize", onViewportChange);
      stopWatchdog();
    };
  }, []);

  return (
    <div
      ref={ref}
      className="free-anchor"
      data-anchor={state === "static" ? undefined : state}
    >
      <div className="free-anchor__ladder max-w-[17rem]">
        {/* ── The metal, declared once for every arrow and every X below ──
            A flat gold stroke is a gold-coloured line; a line that runs pale →
            deep → pale along its length is a line made of METAL, and that is the
            whole difference. Bright stops are safe here in a way they are not in
            type: all of this is decorative and `aria-hidden`, so it is under no
            contrast obligation at all.
            The id is global to the document, which is fine — this component
            renders once per page — but do not copy the pattern to anything that
            can appear twice without giving it a unique id. globals.css §9
            declares `stroke: var(--gold)` immediately before
            `stroke: url(#free-anchor-metal)`, so a renderer that cannot resolve
            the reference paints the bright gold rather than nothing. */}
        <svg aria-hidden focusable="false" width={0} height={0} className="absolute">
          <defs>
            <linearGradient id="free-anchor-metal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffd97a" />
              <stop offset="45%" stopColor="#d4a017" />
              <stop offset="100%" stopColor="#f6c84c" />
            </linearGradient>
          </defs>
        </svg>

        {rungs.map((rung, index) => (
          <div
            key={rung.price}
            className="free-anchor__rung"
            // Drives the per-rung animation delays in §9, so adding a third rung
            // is a copy change and not a CSS change.
            style={{ "--rung": index } as CSSProperties}
          >
            <p className="free-anchor__rung-label">{rung.label}</p>

            {/* The price and its X share a positioning context so the strokes
                are drawn across the digits rather than beside them. `w-fit` is
                what keeps the X the width of the number instead of the column. */}
            <p className="free-anchor__rung-price">
              <span className="free-anchor__rung-figure">
                <Price>{rung.price}</Price>
                {/* Two strokes, corner to corner. `preserveAspectRatio="none"`
                    plus `vector-effect="non-scaling-stroke"` lets the box
                    stretch to whatever the number measures while the stroke
                    stays 2px — the one place in this file where non-scaling IS
                    correct, because these are straight lines with no dash
                    pattern to resolve. */}
                <svg
                  aria-hidden
                  focusable="false"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="free-anchor__x"
                >
                  <line
                    className="free-anchor__x-stroke"
                    x1="3"
                    y1="16"
                    x2="97"
                    y2="84"
                    vectorEffect="non-scaling-stroke"
                    pathLength={1}
                  />
                  <line
                    className="free-anchor__x-stroke free-anchor__x-stroke--second"
                    x1="97"
                    y1="14"
                    x2="4"
                    y2="86"
                    vectorEffect="non-scaling-stroke"
                    pathLength={1}
                  />
                </svg>
              </span>
            </p>

            {/* The operator between this rung and the next. Decorative: a screen
                reader reads label, price, label, price, "ללא עלות" in order and
                loses nothing. */}
            <svg
              aria-hidden
              focusable="false"
              className="free-anchor__step-arrow"
              viewBox="0 0 24 44"
              width={24}
              height={44}
            >
              {/* ⚠️ NOT PERFECTLY VERTICAL, AND THAT IS A BUG FIX, NOT A DESIGN
                  CHOICE. This was `M 12 2 L 12 34` and rendered NOTHING while
                  the arrowhead beside it rendered fine.

                  The cause is an SVG rule that is easy to lose a morning to: the
                  stroke is painted from `#free-anchor-metal`, and a
                  `<linearGradient>` defaults to `gradientUnits="objectBoundingBox"`.
                  A perfectly vertical line has a bounding box of ZERO WIDTH, a
                  gradient over a zero-area box is undefined, and the spec says
                  the element is simply not rendered. The chevron below has both
                  width and height, which is why only half the arrow appeared.

                  Leaning the line by 0.8 units over 32 gives the box a real
                  width. That is a 1.4° tilt on a 2px stroke — invisible — and it
                  keeps the metal gradient, which is the whole point of the
                  stroke. The alternative was `gradientUnits="userSpaceOnUse"`,
                  which would have re-based the X strokes sharing this gradient
                  as well.

                  The path is 32 units long and globals.css §9 uses that number
                  as the dash for the draw. Change one, change the other. */}
              <path className="free-anchor__step-line" d="M 11.6 2 L 12.4 34" />
              <path className="free-anchor__step-head" d="M 4.5 26 L 12 35.5 L 19.5 26" />
            </svg>
          </div>
        ))}

        <p className="free-anchor__free-label">{freeLabel}</p>

        {/* No `text-gold-deep` here on purpose: the colour is `.free-anchor__free`
            in globals.css §9, because the word is painted from a metallic
            gradient with a solid `--gold-deep` fallback underneath it, and a
            utility class on the element would only obscure which of the two is
            actually in play. */}
        <p className="free-anchor__free font-display leading-none">
          {free}
        </p>
      </div>

      <div className="free-anchor__cta mt-7">{children}</div>
    </div>
  );
}
