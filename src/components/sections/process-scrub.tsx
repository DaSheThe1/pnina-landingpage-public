"use client";

/**
 * The "pearl reveal" process experience — a scroll-scrubbed frame sequence.
 *
 * Four stations map 1:1 to the four process steps: closed shell → half open →
 * pearl revealed → pearl risen. Scroll position drives which frame the canvas
 * shows; CSS scroll-snap parks the visitor exactly on each station, and the
 * step's text enters only after the motion has settled.
 *
 * Every behaviour here was validated with Daniel on real devices before landing
 * (see private-media/motion-masters/GENERATION-LOG.md for the full record):
 *
 *  - Snap stations with `scroll-snap-stop: always` — one flick advances exactly
 *    one step; a hard fling cannot skip the story. That is the behaviour INSIDE
 *    the section and it is unchanged; what changed on 2026-07-30 is WHEN the
 *    section is allowed to take the scroll over at all — see the long note on
 *    `applySnap` in the effect below.
 *  - The canvas chases the scroll at a CONSTANT rate (~2.4s per act) instead of
 *    mirroring it, so a flick plays the act as an animation after the snap.
 *  - Adjacent frames are alpha-blended while moving, but a settled station
 *    always draws ONE exact frame — blending two frames at a segment joint
 *    shows as a double exposure.
 *  - Desktop stations 2-4 dissolve into approved clean STILLS before the text
 *    enters, so copy always lands on a finished image, never a video frame.
 *  - Text cards are a directional carousel: enter from the right, exit left,
 *    with the Hebrew reading flow.
 *
 * ── THIS COMPONENT NEVER DECIDES WHETHER IT MAY RUN ──
 * It is mounted only by `ProcessExperience`, which has already established that
 * motion is allowed, data-saver is off, a CDN is configured AND that frame 1
 * actually downloaded. So there is no gate in here, and no speculative
 * fetching: by the time this mounts, the sequence is known to exist.
 *
 * ── WHERE THE FRAMES COME FROM ──
 * `sequence-source.ts`, the single definition of the bucket layout
 * (`motion/<collection>/{m,d}/f_001.webp …`, docs/13 §5) and of how many frames
 * were exported. This component used to carry its own copy of both, pointed at
 * a different frame count than the one the ffmpeg recipe in docs/13 §6 actually
 * uploads; if the sequence should be longer or smoother, change it in
 * `SEQUENCE_FRAME_COUNTS` there and re-export to match, after re-reading the
 * memory note beside that table.
 *
 * ── KNOWN FOLLOW-UP FOR WHEN THE FRAMES LAND ──
 * The static section carries the section's `h2` ("איך זה עובד") and this stage
 * does not; a page whose process section has upgraded therefore loses one
 * heading from its outline. It cannot bite while the frames are missing (the
 * static section is what everyone sees), but it wants a visually-hidden heading
 * here before the sequence goes live. Flagged rather than guessed at, because
 * the right answer depends on how the finished frames read.
 */

import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";

import {
  frameUrl,
  type SequenceSource,
} from "@/components/motion/sequence-source";

const STATIONS = 4;
/** How far inside the first and last stations the root-level snap zone starts,
 *  in pixels. Wide enough that resting on an end station is reliably OUTSIDE it
 *  (fractional scroll offsets, mobile URL-bar resizes), small enough that
 *  scrolling inward hands the story back to the snap within a few pixels. */
const SNAP_EDGE = 12;
/** How fast a frame has to travel, in px, before it counts as a flick rather
 *  than a nudge. A mouse-wheel notch is a single-frame impulse and is excluded by
 *  the "was it already travelling" test instead; a touch or trackpad fling moves
 *  40-76px per frame at 60fps, and far more when the page is janking. */
const FLING_SPEED = 20;
/** A gesture is still in flight this long after the last frame that moved. Long,
 *  because at 4-8fps the browser commits the scroll on alternate ticks and two
 *  frames of one flick can be half a second apart. */
const GESTURE_MS = 700;
/** …and the page counts as settled this long after it stops, which is what
 *  re-opens the end stations so nothing traps. Short, because it is only there
 *  to protect the browser's own snap-back animation from being cancelled. */
const MOTION_MS = 250;
/** The entry lock lets go once nothing has needed correcting for this long. */
const LOCK_QUIET_MS = 250;
/** How many frames of travel AHEAD of itself a sustained fling arms the snap,
 *  and the hard cap on that, as a fraction of the viewport. The cap is what
 *  keeps the reach from ever becoming a pull: a quarter of a screen means the
 *  section is already most of the way onto it before anything can arm, so a
 *  visitor parked 300px above it and nudging is never touched. */
const REACH_FRAMES = 2.5;
const MAX_REACH = 0.25;
/** The longest the entry lock may hold the visitor on the station she arrived
 *  at while the rest of a flick's momentum spends itself. A touch fling decays
 *  in about a second; this is the ceiling that guarantees the page is hers
 *  again even if something keeps scrolling. */
const LOCK_MS = 1200;
/** Scrub playback speed in progress-units/second: one act (1/3) in ~2.4s. */
const SPEED = 0.14;
/** Desktop stations that dissolve into a clean approved still at rest. */
const STILL_STATIONS = [1, 2, 3] as const;

type ProcessCopy = { title: string; lines: string[] };

export type ProcessScrubProps = {
  /** Resolved by `useSequenceSource("pearl")` in `ProcessExperience`. */
  source: SequenceSource;
  /** Frame 1, already downloaded by the probe that decided this may mount. */
  firstFrame: HTMLImageElement;
};

export function ProcessScrub({ source, firstFrame }: ProcessScrubProps) {
  const t = useTranslations("process");
  const steps = t.raw("steps") as ProcessCopy[];

  const trackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pillRef = useRef<HTMLDivElement>(null);
  const whereRef = useRef<HTMLSpanElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);

  // The orientation is whatever the frame source already resolved. Asking
  // matchMedia a second time here would let the layout and the files disagree.
  const isMobile = source.aspect === "9/16";

  // The canvas backing store is the frames' own resolution (docs/13 §5 caps it,
  // and the guardrail there is about decoded bytes). Taken from the real file
  // rather than hard-coded, so a re-export at another size needs no edit here.
  const dims = useMemo(
    () => ({
      w: firstFrame.naturalWidth || (isMobile ? 540 : 960),
      h: firstFrame.naturalHeight || (isMobile ? 960 : 540),
    }),
    [firstFrame, isMobile]
  );

  // "שלב 2 מתוך 4" for each station, resolved up front. The rAF loop only ever
  // indexes this array, so it never has to call `t` — and so it does not have
  // to restart whenever a render produces a new translator.
  const stationLabels = useMemo(
    () =>
      Array.from({ length: STATIONS }, (_, i) =>
        t("progress", { current: i + 1, total: STATIONS })
      ),
    [t]
  );

  useEffect(() => {
    const base = source.baseUrl;
    const frameCount = source.frameCount;
    const track = trackRef.current;
    const canvas = canvasRef.current;
    if (!track || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Size the backing store HERE and not only through the JSX attributes.
    // The cleanup below zeroes it to release the bitmap, and React does not
    // restore an attribute it already believes it has set — so on any second
    // run of this effect (a dependency change, or React's development
    // double-invoke) the canvas would still be 0×0 and every `drawImage` would
    // silently paint nothing. That is exactly what happened the first time the
    // frames were real enough to draw.
    canvas.width = dims.w;
    canvas.height = dims.h;

    // Phones fetch every 2nd frame — half the bytes and decoded memory; the
    // constant-rate playback plus blending hides the halved temporal detail.
    const step = isMobile ? 2 : 1;
    const frames: (HTMLImageElement | undefined)[] = new Array(frameCount);
    frames[0] = firstFrame;
    const stills: Record<number, HTMLImageElement> = {};
    let disposed = false;
    let started = false;

    const load = () => {
      if (started) return;
      started = true;
      for (let i = step; i < frameCount; i += step) {
        const img = new Image();
        img.src = frameUrl(base, i + 1);
        img
          .decode()
          .then(() => {
            if (!disposed) frames[i] = img;
          })
          .catch(() => {});
      }
      if (!isMobile) {
        for (const s of STILL_STATIONS) {
          const img = new Image();
          img.src = `${base}/still-${s + 1}.webp`;
          img
            .decode()
            .then(() => {
              if (!disposed) stills[s] = img;
            })
            .catch(() => {});
        }
      }
    };

    // Start fetching well before the section scrolls into view, so frame 0 is
    // ready when the stage pins. Never await a full preload — draw() falls back
    // to the nearest loaded frame.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) load();
      },
      { rootMargin: "150%" }
    );
    io.observe(track);

    // ── WHEN THE SECTION IS ALLOWED TO CAPTURE THE SCROLL ──
    // Root-level snapping is switched on and off from the rAF loop below (see
    // `applySnap`), and ONLY while the sticky stage actually fills the viewport.
    //
    // It used to be an IntersectionObserver with `rootMargin: "-10% 0px"`, which
    // fired the moment ANY part of this 300vh track touched the viewport. Turning
    // on `y mandatory` re-snaps the scroller immediately, so one line of scroll
    // into the section — from either direction, but especially scrolling back UP
    // from below — yanked the visitor a whole station inwards. Daniel, 2026-07-30:
    // "Something that I don't like a little bit is the pull of the motion section
    // … When I scroll back up even a little bit to that section, like one line, it
    // will pull me inside the full motion. We need to do it like you need to
    // scroll half the screen or something and not instantly pull."
    //
    // The gate is now the PINNED state, which is a stronger version of the "half
    // a viewport of overlap" he asked for, and it is stronger on purpose: at 50%
    // overlap mandatory snapping still has to travel the remaining ~50vh to reach
    // the nearest station, so it would still yank — just half a screen later. The
    // pinned boundaries, by construction, ARE the first and last snap positions
    // (station 0 sits at `r.top === 0`, station 3 at `r.bottom === innerHeight`),
    // so engaging exactly there costs ZERO movement. Entering therefore takes a
    // full viewport of deliberate scrolling from first contact and then lands on a
    // station without a jump, in both directions.
    //
    // AND IT MUST NEVER TRAP, which needs slightly more than "is it pinned".
    // Parked on the FIRST station the stage exactly fills the viewport, so a
    // plain pinned test kept `y mandatory` on there — and mandatory snapping
    // resolves a small nudge back to the station it started from, because that
    // station is the nearest snap position. Measured: a 60px wheel nudge off
    // station 0, and off station 3, both ended exactly where they began.
    //
    // ⚠️ THE RELEASE HAS TO BE GEOMETRIC, NOT GESTURAL. Two attempts that do NOT
    // work, so nobody re-tries them: reading the scroll DIRECTION from `scrollY`
    // (the browser cancels the scroll before it commits, so at a trapped station
    // the delta is zero forever), and releasing from a `wheel`/`touchmove`
    // listener (it races Chromium's snap resolution for that same gesture and
    // loses about half the time — it tested green at 1440 and red at 390).
    //
    // So the snap zone AT REST simply STOPS SHORT of both end stations by
    // `SNAP_EDGE`. Sitting on station 0 or station 3, snapping is off and the
    // page is ordinary; scrolling outward just leaves, with nothing to race.
    //
    // ── AND THAT ALONE LEFT THE PHONE WITH NO LOCK AT ALL (Daniel, 2026-07-30) ──
    // "It doesn't pull you, which is good, but if I scroll it will keep scrolling
    // past the step … instead of first locking me into this full page it will go
    // straight to the animation in step 2. Same when we scroll up. It won't lock
    // you on the screen even the first time you enter. That's on mobile."
    //
    // A mouse wheel is a train of separate one-frame impulses, so the frame after
    // the zone is entered is already a NEW gesture and snaps normally — which is
    // why the rule above tested green at 1440. A finger is not: one flick is a
    // single gesture whose momentum coasts for a second or more, and a scroller
    // that had `scroll-snap-type: none` when that gesture began keeps it for the
    // whole flight. Measured on a 390×844 touch context with real Chromium
    // flings: entering fast from above landed on station 2, entering fast from
    // below landed on station 0, and a flick from an end station sailed straight
    // out of the section. The 12px hole is exactly the width of the problem — the
    // one place a phone gesture ALWAYS starts is an end station.
    //
    // So while the scroll is actually MOVING, the zone reaches out ahead of
    // itself, and only in the direction of travel:
    //
    //   • one sustained fling (`FLING_FRAMES` moving frames in a row, still above
    //     `FLING_SPEED`) arms the snap up to `REACH_FRAMES` frames of travel
    //     BEFORE the section, so the snap is already live when the momentum
    //     arrives and Chromium resolves it to the station the visitor is entering
    //     at — station 0 from above, station 3 from below — instead of one or two
    //     stations further in;
    //   • a wheel notch, a slow drag or a parked page never reaches that
    //     threshold, so approaching gently arms nothing and the geometry above is
    //     what runs. Daniel's 45px nudge still moves 45px;
    //   • the reach only ever points INWARD (`d > 0` above the section, `d < 0`
    //     below it), so a flick that LEAVES an end station is never armed and can
    //     never be pulled back. That is what keeps the release geometric rather
    //     than gestural, which the two failed approaches above are about.
    //
    // ── AND ONE BACKSTOP, BECAUSE THE PHONE IS NOT ALWAYS AT 60fps ──
    // Traced on the real page at 390×844: while the 90 mobile frames are still
    // decoding, this rAF loop runs at EIGHT frames a second. One frame is then
    // 125ms of travel — measured, a single frame carried the scroll from 96px
    // above the section to 1372px inside it — and nothing predictive can survive
    // that, because the reach is computed from a previous frame that was still
    // showing the finger's slow drag. So there is a second, non-predictive rule:
    // on the ONE frame where the section goes from not filling the viewport to
    // filling it, if the visitor arrived faster than `FLING_SPEED` and overshot,
    // she is put back on the station she entered at — station 0 from above,
    // station 3 from below — and mandatory snapping takes it from there.
    // It fires ONLY on that entry frame, so an anchor jump that crosses the whole
    // section (nav link, deep link) is never caught by it, and at a healthy frame
    // rate the reach above has already snapped her cleanly and there is nothing
    // to correct, so it never fires at all.
    //
    // ── AND THE SNAP IS NEVER DROPPED MID-MOVEMENT ──
    // `scroll-behavior: smooth` is set on `html` (globals.css), so the browser
    // performs its own re-snap as an ANIMATED scroll. That animation travels
    // through the `SNAP_EDGE` band on its way to an end station, and an earlier
    // cut of this rule switched snapping off underneath it — which cancels the
    // animation and strands the visitor 20px off the station. Hence: while the
    // scroll is moving at all, an engaged snap stays engaged; it is only
    // re-evaluated once everything has come to rest.
    //
    // Inside the section nothing changed: `y mandatory` + `scroll-snap-stop:
    // always` still means one flick, one step, in both directions.
    let snapOn = false;
    let lastY: number | null = null;
    let lastScrollY: number | null = null;
    /** When the scroll last actually moved, and how fast and which way it was
     *  going then. Kept in TIME rather than in frames: while the frames decode
     *  this loop drops to 4-8fps and the browser commits the scroll on every
     *  OTHER tick, so a "moving frames in a row" counter never gets past one and
     *  every flick reads as a standing start. Measured, on the real page. */
    let lastMoveAt = -Infinity;
    let lastSpeed = 0;
    let lastDir = 0;
    /** Which side of the section the gesture in flight started on: -1 above,
     *  +1 below, 0 "it started inside, or there is no gesture in flight". */
    let cameFrom = 0;
    /** The station an entry lock is holding the visitor on, while it holds. */
    let lockAt: number | null = null;
    let lockEnds = 0;
    let lastClampAt = 0;
    const setSnap = (on: boolean) => {
      if (on === snapOn) return;
      snapOn = on;
      document.documentElement.style.scrollSnapType = on ? "y mandatory" : "";
    };
    const scrollBy = (px: number) => {
      window.scrollTo({ top: window.scrollY + px, behavior: "instant" });
    };
    const applySnap = () => {
      const r = track.getBoundingClientRect();
      const vh = window.innerHeight;
      // How far the visitor has travelled into the track, and the offset of the
      // last station — which is also the last pixel at which the stage still
      // fills the viewport.
      const y = -r.top;
      const end = r.height - vh;
      const now = performance.now();
      // Speed and direction come from `scrollY`, NOT from the change in `y`:
      // `y` also moves when something ABOVE this section changes height (a photo
      // arriving, a reveal running), and a layout shift read as 300px of scroll
      // armed the snap and pulled a visitor who had not moved at all into the
      // section. Position is measured from the rect; motion is measured from the
      // scroller.
      const sy = window.scrollY;
      const d = lastScrollY === null ? 0 : sy - lastScrollY; // + = scrolling down
      lastScrollY = sy;
      lastY = y;
      const speed = Math.abs(d);
      // Was the page ALREADY travelling when this frame arrived? That is the one
      // thing that tells a flick apart from a TELEPORT (a restored scroll
      // position, a script placing the page), which is a single huge frame out
      // of a standstill and must never be treated as an arrival.
      const travelling = now - lastMoveAt < GESTURE_MS;
      if (speed > 0.5) {
        lastMoveAt = now;
        lastSpeed = speed;
        lastDir = Math.sign(d);
      }
      const settled = now - lastMoveAt > MOTION_MS;
      // Which side of the section the gesture that is running now started on.
      // It STAYS set while she travels through the section, and is forgotten
      // only when the gesture is over — that is what makes it "the flick that
      // brought her here" rather than "the last frame".
      if (y < 0) cameFrom = -1;
      else if (y > end) cameFrom = 1;
      if (!travelling) cameFrom = 0;

      // Hold the entry lock. A programmatic scroll does NOT cancel a touch fling
      // — measured: put back on station 0, the same flick carried on and ended on
      // station 3 — so the lock is held frame by frame until the momentum has
      // spent itself (nothing left to correct for `LOCK_QUIET_MS`) or `LOCK_MS`
      // is up, whichever comes first. Both are times and not frame counts, for
      // the same reason as above.
      if (lockAt !== null) {
        if (Math.abs(y - lockAt) > 1) {
          scrollBy(lockAt - y);
          lastY = lockAt;
          lastScrollY = window.scrollY;
          lastClampAt = now;
        }
        if (now > lockEnds || now - lastClampAt > LOCK_QUIET_MS) {
          lockAt = null;
          cameFrom = 0;
        }
        setSnap(true);
        return;
      }

      // The backstop: a flick that started OUTSIDE has brought the section to
      // fill the screen. She is put on the station she arrived at — station 0
      // from above, station 3 from below — and held there until that flick's
      // momentum is spent. No overshoot test: at a healthy frame rate the reach
      // below has usually snapped her onto the station already, and the rest of
      // the same flick would otherwise carry her straight off it.
      if (cameFrom !== 0 && y >= 0 && y <= end && travelling && lastSpeed > FLING_SPEED) {
        const target = cameFrom < 0 ? 0 : end;
        setSnap(true);
        if (Math.abs(y - target) > 1) {
          scrollBy(target - y);
          lastY = target;
          lastScrollY = window.scrollY;
        }
        lockAt = target;
        lockEnds = now + LOCK_MS;
        lastClampAt = now;
        return;
      }

      const reach =
        !settled && lastSpeed > FLING_SPEED
          ? Math.min(lastSpeed * REACH_FRAMES, vh * MAX_REACH)
          : 0;
      const inside = y > SNAP_EDGE && y < end - SNAP_EDGE;
      if (settled) setSnap(inside);
      else if (snapOn || inside) setSnap(true);
      else if (y <= SNAP_EDGE) setSnap(lastDir > 0 && y >= -reach);
      else setSnap(lastDir < 0 && y <= end + reach);
    };

    const nearestLoaded = (idx: number) => {
      for (let d = 0; d < frameCount; d++) {
        if (frames[idx - d]) return idx - d;
        if (frames[idx + d]) return idx + d;
      }
      return -1;
    };

    const draw = (p: number, settled: boolean) => {
      const f = p * (frameCount - 1);
      if (settled) {
        const i = nearestLoaded(Math.round(f));
        if (i >= 0) ctx.drawImage(frames[i]!, 0, 0, dims.w, dims.h);
      } else {
        const i0 = nearestLoaded(Math.floor(f));
        if (i0 >= 0) ctx.drawImage(frames[i0]!, 0, 0, dims.w, dims.h);
        const i1 = Math.floor(f) + step;
        const frac = f - Math.floor(f);
        if (frac > 0 && frames[i1]) {
          ctx.globalAlpha = frac;
          ctx.drawImage(frames[i1]!, 0, 0, dims.w, dims.h);
          ctx.globalAlpha = 1;
        }
      }
      if (!isMobile) {
        // Clean still dissolves in across the approach and is fully opaque
        // BEFORE the text is allowed to enter (see stillDone below).
        for (const s of STILL_STATIONS) {
          const w = (0.1 - Math.abs(p - s / (STATIONS - 1))) / 0.06;
          if (w > 0 && stills[s]) {
            ctx.globalAlpha = Math.min(1, w);
            ctx.drawImage(stills[s], 0, 0, dims.w, dims.h);
            ctx.globalAlpha = 1;
          }
        }
      }
    };

    let targetP = 0;
    let smoothP = 0;
    let lastT = 0;
    let raf = 0;

    const progress = () => {
      const r = track.getBoundingClientRect();
      return Math.min(1, Math.max(0, -r.top / (r.height - window.innerHeight)));
    };
    const pinned = () => {
      const r = track.getBoundingClientRect();
      return r.top <= 0 && r.bottom >= window.innerHeight;
    };

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - lastT) / 1000 || 0.016);
      lastT = now;
      targetP = progress();
      const delta = targetP - smoothP;
      const stepP = SPEED * dt;
      smoothP =
        Math.abs(delta) <= stepP ? targetP : smoothP + Math.sign(delta) * stepP;
      draw(smoothP, smoothP === targetP);

      const station = Math.round(targetP * (STATIONS - 1));
      const nearSettle = Math.abs(delta) < 0.16;
      const stillDone =
        isMobile ||
        !STILL_STATIONS.includes(station as 1 | 2 | 3) ||
        Math.abs(smoothP - station / (STATIONS - 1)) <= 0.04;

      beatRefs.current.forEach((b, i) => {
        if (!b) return;
        b.classList.toggle("scrub-on", nearSettle && stillDone && i === station);
        b.classList.toggle(
          "scrub-gone",
          i < station || (!nearSettle && i === station && delta < 0)
        );
      });
      if (whereRef.current)
        whereRef.current.textContent = stationLabels[station] ?? "";
      if (arrowRef.current)
        arrowRef.current.style.visibility =
          station >= STATIONS - 1 ? "hidden" : "visible";
      pillRef.current?.classList.toggle("scrub-on", pinned());
      applySnap();

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      document.documentElement.style.scrollSnapType = "";
      // iOS keeps canvas backing stores alive aggressively; zeroing the
      // dimensions releases the bitmap on unmount.
      canvas.width = 0;
      canvas.height = 0;
    };
  }, [source.baseUrl, source.frameCount, isMobile, firstFrame, dims, stationLabels]);

  return (
    <div ref={trackRef} className="relative h-[300vh]">
      {Array.from({ length: STATIONS }, (_, s) => (
        <div
          key={s}
          aria-hidden
          className="absolute h-px w-full"
          style={{
            top: `calc((100% - 100svh) * ${s / (STATIONS - 1)})`,
            scrollSnapAlign: "start",
            scrollSnapStop: "always",
          }}
        />
      ))}
      <div className="sticky top-0 grid h-svh place-items-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={dims.w}
          height={dims.h}
          role="img"
          aria-label={t("motionAlt")}
          className={
            isMobile
              ? "block h-svh w-auto max-w-[100vw] object-cover"
              : "block h-svh w-screen object-cover"
          }
        />
        {steps.map((s, i) => (
          <div
            key={s.title}
            ref={(el) => {
              beatRefs.current[i] = el;
            }}
            className={
              isMobile
                ? // `top-20` (5rem), not the `top-[2.5%]` this arrived with:
                  // the stage is `h-svh` and pins at the very top of the
                  // viewport, so 2.5% put the card's first line — the "שלב N"
                  // label — underneath the 65px sticky header, where it was
                  // simply not readable.
                  "scrub-beat absolute inset-x-[5%] top-20 rounded-2xl border border-white/15 bg-[rgba(43,26,14,0.66)] p-4 text-center text-white backdrop-blur-md"
                : "scrub-beat absolute start-[5%] top-1/2 w-[min(560px,44vw)] -translate-y-1/2 rounded-2xl border border-white/50 bg-[rgba(251,247,241,0.55)] p-6 text-start text-[#4a3527] backdrop-blur-lg"
            }
          >
            {/* No `tracking-wider` here, deliberately: the static section
                dropped exactly that class for exactly this string, because
                letter-spacing pulls the two Hebrew letters of "שלב" apart into
                ש ל ב. The digit is `dir="ltr"` for the same reason it is there.
                Pink type at label size is `--rose-ink`, never `--brand-accent`
                (CLAUDE.md, design tokens). */}
            <span
              className={
                isMobile
                  ? "mb-1 block text-base font-bold"
                  : "mb-1.5 block text-base font-bold text-rose-ink"
              }
            >
              {t("stepLabel")} <span dir="ltr">{i + 1}</span>
            </span>
            <span className="mb-2 block text-xl font-bold leading-snug sm:text-2xl">
              {s.title}
            </span>
            {s.lines.map((line) => (
              <p
                key={line}
                className="mb-1.5 text-sm leading-relaxed sm:text-base"
              >
                {line}
              </p>
            ))}
            {i === STATIONS - 1 && (
              <p className="mt-2 text-xs italic opacity-80 sm:text-sm">
                {t("endpoint")}
              </p>
            )}
          </div>
        ))}
        <div
          ref={pillRef}
          className="scrub-pill pointer-events-none absolute inset-x-0 bottom-[4.5%] grid place-items-center gap-0.5 text-white"
        >
          <span
            ref={whereRef}
            className="rounded-full bg-[rgba(43,26,14,0.55)] px-4 py-1.5 text-sm font-semibold backdrop-blur-sm"
          />
          <span ref={arrowRef} className="scrub-arrow text-lg" aria-hidden>
            ▼
          </span>
        </div>
      </div>
    </div>
  );
}
