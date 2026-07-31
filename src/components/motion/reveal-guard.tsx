"use client";

import { useEffect } from "react";

/**
 * The reveal watchdog. Mounted once, in the locale layout.
 *
 * ── THE BUG IT EXISTS FOR ──
 * Reported 2026-07-31: on a Samsung phone the audience section, the offers
 * section and the testimonials section rendered their headings and then a strip
 * of empty space where the paragraph under each heading should have been. Space
 * reserved, ink missing, and missing FOREVER — not a slow fade, not a flicker.
 * On other phones the same page was fine.
 *
 * That is the signature of a reveal that armed and never released. Both reveal
 * paths can produce it, and neither could recover on its own:
 *
 *   • the CSS path (globals.css §1) starts the element at `opacity: 0` inside
 *     `@supports (animation-timeline: view())` and lets a view-progress timeline
 *     bring it back. `@supports` proves the declaration PARSES. It does not
 *     prove the timeline ever advances — an ancestor that turns out to be a
 *     scroll container, a timeline that never attaches, an early
 *     scroll-driven-animations build, a compositor layer that is evicted and
 *     never re-rastered. Every one of those passes the feature test and leaves
 *     the text at frame zero.
 *   • the JS path (`Reveal`) hides the element the moment it arms it and waits
 *     for an IntersectionObserver. An observer that is present but never
 *     delivers — older Samsung Internet builds, some embedded webviews — leaves
 *     it hidden with nothing else watching.
 *
 * ── THREE TESTS, NONE OF WHICH CAN MISFIRE ON A HEALTHY BROWSER ──
 * One sweep, paced off `requestAnimationFrame` so it costs nothing in a
 * background tab, asks:
 *
 *  1. THE OBSERVER NEVER ANSWERED. `reveal-boot-script.ts` observes the
 *     document element before the first paint and the spec requires an initial
 *     observation on the next frame. If `data-reveal-observer="ok"` has still
 *     not appeared after ~0.9s, IntersectionObserver callbacks are not coming,
 *     so every element the JS path has armed is released at once.
 *
 *  2. A REVEAL SCROLLED CLEAN OFF THE TOP AND IS STILL TRANSPARENT. Past the
 *     end of its range a `both`-filled animation holds its LAST frame, so an
 *     element entirely above the viewport is opaque on every working
 *     implementation, without exception. One that is not proves the engine is
 *     dead, and the verdict is global: every reveal on the page is released and
 *     nothing is hidden again for the rest of the visit. This is the test that
 *     rescues the reader BEFORE she reaches the section — by the time the
 *     audience block is on screen, the hero and the founder block have already
 *     answered the question.
 *
 *  3. THIS ONE IS PAST ITS OWN RANGE AND IS STILL TRANSPARENT. Per element,
 *     with a strike count, for the case where 2 has not had a chance to fire.
 *
 * Every threshold below sits past the end of the reveal, so on a browser that
 * works the sweep only ever confirms elements and drops them. Motion for
 * supported browsers is byte-for-byte what it was; nothing here uses
 * `!important`, and nothing here reads a device preference — the accessibility
 * panel's "הפחתת תנועה" switch already forces every `[data-reveal]` visible,
 * which this sweep simply sees as "settled".
 */

/** Sweep cadence. Slow on purpose: this is a safety net, not an engine. */
const SWEEP_MS = 150;

/**
 * How far through its own cover range an element must be before a missing
 * paragraph counts as a fault rather than as the animation doing its job.
 * `travelled / (viewport + element height)` IS cover progress, and the latest
 * range end on the site is cover 42% (`entry 8% cover 26%` plus up to 16 points
 * of stagger shift — see `Reveal`), so at 45% a healthy browser has finished
 * every reveal it was going to run and this can only ever confirm them.
 */
const SETTLED_AT_COVER = 0.45;

/** Opaque enough to call it visible. */
const VISIBLE_ENOUGH = 0.9;

/**
 * Consecutive sweeps (~1.8s) of "should be readable, is not" before we
 * intervene. Long enough that a slow phone finishing a 620ms transition with a
 * 320ms stagger delay is never mistaken for a broken one; short enough that
 * nobody sits and stares at a blank strip.
 */
const STRIKES = 12;

/**
 * Sweeps to wait for `data-reveal-observer="ok"` before concluding that
 * IntersectionObserver callbacks are never coming. The boot script starts that
 * probe before the first paint and the spec answers it on the very next frame,
 * so ~0.9s of silence is not a slow browser, it is a broken one.
 */
const OBSERVER_GRACE_SWEEPS = 6;

export function RevealGuard() {
  useEffect(() => {
    let frame = 0;
    let last = 0;
    let sweeps = 0;
    let engineBroken = false;
    const strikes = new WeakMap<Element, number>();
    const settled = new WeakSet<Element>();

    const release = (el: Element) => {
      el.setAttribute("data-reveal-off", "");
      settled.add(el);
    };

    const sweep = () => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (!vh) return;
      sweeps += 1;

      // Test 1 — see the header. Applies to the JS path only: the CSS path
      // never asks the observer anything.
      const observerDead =
        sweeps > OBSERVER_GRACE_SWEEPS &&
        document.documentElement.getAttribute("data-reveal-observer") !== "ok";

      const nodes = document.querySelectorAll<HTMLElement>("[data-reveal]");
      for (const el of nodes) {
        if (settled.has(el)) continue;
        // Already released, or released by the JS path having done its job.
        // Either way it is somebody else's problem now.
        if (
          el.hasAttribute("data-reveal-off") ||
          el.hasAttribute("data-reveal-shown")
        ) {
          settled.add(el);
          continue;
        }

        if (engineBroken) {
          release(el);
          continue;
        }
        if (observerDead && el.hasAttribute("data-reveal-ready")) {
          release(el);
          continue;
        }

        const rect = el.getBoundingClientRect();
        if (rect.height <= 0) continue; // not laid out yet
        if (rect.top >= vh) continue; // still below the fold

        const opacity = parseFloat(getComputedStyle(el).opacity);

        // Test 2 — scrolled clean off the top and still not opaque. Nothing
        // that works does this, so stop trusting the mechanism entirely.
        if (rect.bottom <= 0) {
          if (opacity < VISIBLE_ENOUGH) {
            engineBroken = true;
            release(el);
          } else {
            settled.add(el);
          }
          continue;
        }

        // Test 3 — past its own range, per element.
        const travelled = vh - rect.top;
        if (travelled < SETTLED_AT_COVER * (vh + rect.height)) continue;

        if (opacity >= VISIBLE_ENOUGH) {
          settled.add(el);
          continue;
        }

        const count = (strikes.get(el) ?? 0) + 1;
        strikes.set(el, count);
        if (count >= STRIKES) release(el);
      }
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (now - last < SWEEP_MS) return;
      last = now;
      sweep();
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return null;
}
