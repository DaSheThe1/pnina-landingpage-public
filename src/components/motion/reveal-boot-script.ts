/**
 * Reveal boot script — runs parser-blocking in <body>, before the first paint.
 *
 * ── WHAT IT DECIDES, AND WHY IT IS A SCRIPT AND NOT A MEDIA QUERY ──
 * The scroll reveal (globals.css → MOTION SYSTEM §1) starts every element it
 * touches at `opacity: 0` and relies on a `view()` timeline to bring it back.
 * `@supports (animation-timeline: view())` proves that the browser PARSES that
 * declaration. It does not prove the timeline ever advances, and the two are
 * not the same claim: an engine can report support and still leave the element
 * parked on frame zero — an ancestor that turns out to be a scroll container, a
 * timeline that never attaches, an early scroll-driven-animations build. When
 * that happens there is nothing in CSS that can rescue the text, and a woman
 * looking for help reads a blank strip where a paragraph should be. That is the
 * bug this file exists to make impossible; the long version is in the header of
 * `reveal-guard.tsx`.
 *
 * So the hidden state is only ever armed when something is standing by to
 * un-arm it. This script stamps `data-reveal-engine="css"` on <html> when, and
 * only when, BOTH are true:
 *
 *   1. the browser parses `animation-timeline: view()`, and
 *   2. JavaScript is running at all — which is what puts `RevealGuard` on the
 *      page, the watchdog that releases anything the timeline leaves behind.
 *
 * Without the attribute §1 never matches, so a browser with no JavaScript, a
 * bundle that failed to load, or a script blocked by an extension renders every
 * section plainly visible instead of blank. It costs the no-JS visitor the
 * animation and nothing else.
 *
 * It runs before the first paint for the same reason the accessibility boot
 * script does: deciding this in a React effect would let a reader scroll to a
 * paragraph, read it, and then watch it blink out and fade back in as hydration
 * lands.
 *
 * ── AND IT PROVES THE OBSERVER, TOO ──
 * The other reveal path hides an element and waits for an IntersectionObserver
 * to tell it the element is on screen. `typeof IntersectionObserver` being a
 * function proves the constructor exists; it does not prove the callback ever
 * arrives, and on the browsers this bug was reported from that is exactly the
 * part that fails. So the script observes an element it knows is there — the
 * document element itself, so nothing is inserted into the tree React is about
 * to hydrate — and stamps `data-reveal-observer="ok"` from the first callback.
 * The spec requires an initial observation, so a healthy browser answers on the
 * next frame, long before hydration. `RevealGuard` treats a silent observer as
 * a dead one and releases every reveal on the page rather than letting them sit
 * hidden waiting for a call that is not coming.
 */
export const REVEAL_BOOT_SCRIPT = `(function(){try{var h=document.documentElement;if(typeof CSS!=="undefined"&&CSS.supports&&CSS.supports("animation-timeline","view()")){h.setAttribute("data-reveal-engine","css")}if(typeof IntersectionObserver==="function"){var o=new IntersectionObserver(function(){h.setAttribute("data-reveal-observer","ok");o.disconnect()});o.observe(h)}}catch(e){}})();`;
