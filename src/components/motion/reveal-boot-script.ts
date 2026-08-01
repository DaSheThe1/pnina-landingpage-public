/**
 * Reveal boot script — runs parser-blocking in <body>, before the first paint.
 *
 * ── WHAT IT DECIDES, AND WHY IT IS A SCRIPT AND NOT A MEDIA QUERY ──
 * The repeatable scroll reveal (globals.css → MOTION SYSTEM §1) moves an
 * explicitly opted-in element through a small 16px rise on a `view()` timeline.
 * Ordinary one-time reveals use the observer path below because a view timeline
 * is reversible.
 * `@supports (animation-timeline: view())` proves that the browser PARSES that
 * declaration. It does not prove the timeline ever advances, and the two are
 * not the same claim: an engine can report support and still leave the element
 * parked on frame zero — an ancestor that turns out to be a scroll container, a
 * timeline that never attaches, an early scroll-driven-animations build.
 *
 * This script stamps `data-reveal-engine="css"` when the browser parses
 * `animation-timeline: view()`. The animation never changes opacity, so a false
 * positive now leaves copy shifted by at most 16px instead of leaving it blank.
 *
 * Without the attribute §1 never matches, so a browser with no JavaScript or a
 * blocked bundle gets the authored position and loses only the movement.
 *
 * It runs before the first paint for the same reason the accessibility boot
 * script does: deciding this in a React effect would let a reader scroll to a
 * paragraph, read it, and then watch it blink out and fade back in as hydration
 * lands.
 *
 * ── AND IT PROVES THE OBSERVER, TOO ──
 * The one-time path still proves IntersectionObserver before arming its 16px
 * offset. The script observes the document element and stamps
 * `data-reveal-observer="ok"` from the first callback. A silent observer leaves
 * every element at its authored position.
 */
export const REVEAL_BOOT_SCRIPT = `(function(){try{var h=document.documentElement;if(typeof CSS!=="undefined"&&CSS.supports&&CSS.supports("animation-timeline","view()")){h.setAttribute("data-reveal-engine","css")}if(typeof IntersectionObserver==="function"){var o=new IntersectionObserver(function(){h.setAttribute("data-reveal-observer","ok");o.disconnect()});o.observe(h)}}catch(e){}})();`;
