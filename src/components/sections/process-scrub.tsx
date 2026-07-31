"use client";

/**
 * The "pearl reveal" process experience — a scroll-scrubbed frame sequence.
 *
 * Four stations map 1:1 to the four process steps: closed shell → half open →
 * pearl revealed → pearl risen. Scroll position drives which frame the canvas
 * shows; CSS scroll-snap parks the visitor exactly on each station, and the
 * step's text enters in the last second of the motion that leads to it.
 *
 * Every behaviour here was validated with Daniel on real devices before landing
 * (see private-media/motion-masters/GENERATION-LOG.md for the full record):
 *
 *  - Snap stations with `scroll-snap-stop: always` — one flick advances exactly
 *    one step; a hard fling cannot skip the story. What changed on 2026-07-30 is
 *    WHEN the section is allowed to take the scroll over at all, and on
 *    2026-07-31 that one-step rule stopped relying on the browser honouring it:
 *    the wheel is held to one station per gesture by `onWheel`, and a finger by
 *    the touch clamp in `applySnap` (a rapid series of flicks was still skipping
 *    steps on a Samsung). Both are argued where they live.
 *  - The canvas chases the scroll at a CONSTANT rate (~2.4s per act) instead of
 *    mirroring it, so a flick plays the act as an animation after the snap.
 *  - Adjacent frames are alpha-blended while moving, but a settled station
 *    always draws ONE exact frame — blending two frames at a segment joint
 *    shows as a double exposure.
 *  - Desktop stations 2-4 dissolve into approved clean STILLS as the act ends.
 *    Until 2026-07-31 the text waited for that dissolve to finish, so copy
 *    always landed on a finished image; Daniel asked for the copy a full second
 *    sooner than that, so it now arrives while the picture is still settling.
 *    The dissolve is unchanged — see TEXT_LEAD below for the whole argument.
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
 * ── AND HOW THEY GET HERE: `frame-store.ts` ──
 * This file no longer fetches anything itself. Requesting, decoding and — the
 * new part — RELEASING frames is `createFrameStore`, and the reasoning for all
 * three lives in that file's header. The one-line version: the old loader fired
 * every request in a single tick and then held every decoded frame forever, and
 * on Daniel's iPhone and S25 Ultra that cost ~15 seconds of page load and a
 * scrub that got jerkier the longer you used it. Nothing about the choreography
 * below changed for it; `draw` just asks the store for the nearest frame it has,
 * exactly as it always did.
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

import { createFrameStore } from "@/components/motion/frame-store";
import { type SequenceSource } from "@/components/motion/sequence-source";

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
/** ── WHEN THE STATION'S COPY IS ALLOWED IN (Daniel, 2026-07-31) ──
 *  *"You can make the text that appears at the end of the animation quicker by
 *  probably 1 second. Like, start the animation and when it appears, one second
 *  earlier."*
 *
 *  The playhead travels at `SPEED` progress-units per second, so ONE SECOND OF
 *  PLAYBACK IS EXACTLY `SPEED` OF PROGRESS — which is why the shift below is
 *  written as `+ SPEED` rather than as a new pair of magic numbers. Both gates
 *  in the rAF loop moved by that one second and by nothing else:
 *
 *    • `SETTLE_BAND` (was 0.16, ~1.1s of travel left) — the general "the motion
 *      has nearly arrived" test, which is what governs station 1 and every
 *      station on a phone;
 *    • `STILL_BAND` (was 0.04, ~0.3s) — the desktop stations that dissolve into
 *      a clean still. This was the binding gate there, and it is why the copy
 *      used to land only once everything had come to rest.
 *
 *  ⚠️ THIS DELIBERATELY BREAKS THE OLD "COPY ONLY EVER LANDS ON A FINISHED
 *  STILL" RULE, and the header comment at the top of this file says so. The
 *  still dissolve itself is UNCHANGED — it still completes before the playhead
 *  settles — so what a visitor now sees is the card arriving while the picture
 *  is still finishing, which is what was asked for. Do not "fix" the mismatch
 *  by pulling the dissolve forward to meet it: freezing the last second and a
 *  half of a 2.4s act onto a still is a bigger loss than the one this trades
 *  away. */
const TEXT_LEAD = SPEED;
const SETTLE_BAND = 0.16 + TEXT_LEAD;
const STILL_BAND = 0.04 + TEXT_LEAD;
/** Desktop stations that dissolve into a clean approved still at rest. */
const STILL_STATIONS = [1, 2, 3] as const;

/** ── THE EXIT RELEASE (see the long note beside `applySnap`) ──
 *  How long an outward gesture at an end station keeps snapping switched off,
 *  measured from the last frame that still saw the gesture. Long enough that a
 *  touch fling's momentum carries clear of the section on its own, short enough
 *  that a visitor who changes her mind and scrolls back in gets the normal
 *  arrival behaviour. */
const ESCAPE_MS = 700;
/** How much raw input counts as "she means it" rather than jitter, so a finger
 *  trembling on an arrival lock cannot eject itself. Wheel in normalised px,
 *  touch in CSS px of travel since the last reading. */
const INTENT_WHEEL_MIN = 2;
const INTENT_TOUCH_MIN = 8;

/** ── THE DESKTOP WHEEL TRAIN (see `onWheel`) ──
 *  Wheel events closer together than this belong to the same gesture. A mouse
 *  notch train runs 50-100ms apart and a trackpad ~10-16ms, so 220ms groups both
 *  without joining two deliberate flicks. */
const TRAIN_GAP = 220;
/** How much accumulated, deltaMode-normalised wheel travel a train needs before
 *  it moves a station. One Chrome mouse notch (~100px) clears it on its own; a
 *  train of small trackpad notches adds up to it, which is the pre-existing bug
 *  where a gentle trackpad scroll snapped back forever without ever advancing. */
const WHEEL_THRESHOLD = 40;
/** After a train has moved a station, no further wheel input may move another
 *  one until this is up. This is the fix for "two quick scrolls jump two or more
 *  stations": people double-scroll when they think the page has not responded,
 *  and the second scroll must be absorbed, not obeyed. */
const STATION_COOLDOWN = 550;
/** How long after a wheel-driven station move `applySnap` leaves the CSS snap
 *  alone, so mandatory snapping cannot fight the smooth scroll we started. */
const WHEEL_MOVE_MS = 900;
/** How far a REFUSED touch flick is allowed to drift off its station before it
 *  is put back, in stations. Small, so a flick that may not advance costs the
 *  canvas almost no playback to undo (see the touch clamp in `applySnap`); not
 *  so small that a finger resting on a moving page re-triggers it. 0.15 of a
 *  station is ~84px on a 390x844 phone. */
const TOUCH_HOLD = 0.15;
/** ── THE ARRIVAL GESTURE IS SPENT (see `notePinned` and `onWheel`) ──
 *  Once the stage pins, the gesture that brought her here may not also advance
 *  a station: she has to see the first image. A new gesture is one that starts
 *  after this much wheel silence. Deliberately the same figure as
 *  `STATION_COOLDOWN` — arriving IS a station move, so it earns the same pause
 *  — but expressed as a QUIET GAP rather than a deadline, because a sustained
 *  train that simply waits out a deadline is still the same gesture. */
const ENTRY_QUIET_MS = 550;

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

    /** Which frame each snap station rests on, snapped to the fetch grid. These
     *  are the images a visitor actually STOPS on, so the store fetches them
     *  first and never evicts them — a station is always drawable exactly, even
     *  if the act leading to it has been released. */
    const stationIndices = Array.from({ length: STATIONS }, (_, s) =>
      Math.round((s / (STATIONS - 1)) * (frameCount - 1))
    );

    const store = createFrameStore({
      baseUrl: base,
      frameCount,
      step,
      stationIndices,
      stillStations: isMobile ? [] : STILL_STATIONS,
      frameBytes: dims.w * dims.h * 4,
      cut: isMobile ? "mobile" : "desktop",
      firstFrame,
    });

    // Start fetching well before the section scrolls into view, so frame 0 is
    // ready when the stage pins. Starting early is only a problem when it
    // STARVES the page, and since the store caps concurrency and marks every
    // request `fetchPriority: "low"` it no longer does — so the 150% margin
    // stays. Never await a full preload: draw() falls back to the nearest frame
    // the store happens to hold.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) store.start();
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
    //
    // ── AND THEN THE SAMSUNG TRAP (Daniel, 2026-07-30, S25 Ultra) ──
    // "It's very hard to get out of the section once you're inside — you need to
    // pull with the finger really really hard."
    //
    // Everything above is about getting IN. Nothing above was about getting OUT,
    // and two of its rules combine into a wall:
    //
    //   • the arrival lock sets `snapOn` while it holds, and
    //   • "the snap is never dropped mid-movement" means that once `snapOn` is
    //     true it STAYS true for as long as the scroll keeps moving.
    //
    // Sitting on station 0 the nearest snap position IS station 0, so mandatory
    // snapping resolves an outward flick straight back to where it started. The
    // scroller therefore never comes to rest anywhere else, `settled` never
    // becomes true, the snap is never re-evaluated, and the only way out is to
    // out-muscle the browser's own snap animation. That is the "pull really
    // really hard".
    //
    // THE RELEASE. Locking is for travel BETWEEN stations. At the first station
    // going up, or the last station going down, there is no next station to
    // protect and nothing to hold on to, so neither the lock nor mandatory
    // snapping may engage at all — one ordinary flick has to leave.
    //
    // Which needs the gesture's DIRECTION, and the note above is right that
    // `scrollY` cannot supply it: at a trapped station the browser cancels the
    // scroll before it commits and the delta reads zero forever. So the raw
    // input is read for its INTENT only — a wheel's `deltaY` sign, a finger's
    // travel between two `touchmove`s — and it is read from PASSIVE listeners
    // that never call `preventDefault`, so there is nothing for Chromium's snap
    // resolution to race. The geometry still decides everything; the input only
    // says which way she is asking to go.
    //
    // And the release is STICKY (`ESCAPE_MS`) rather than per-frame, because a
    // touch fling stops producing events the moment the finger lifts while the
    // momentum runs on for a second. One outward frame at a boundary switches
    // snapping off for the whole flight; an inward intent cancels it early, so
    // changing her mind and scrolling back in gets the ordinary arrival above.
    // It only ever switches snapping OFF, so it can never pull anybody anywhere.
    let snapOn = false;
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
    /** Which way the RAW INPUT says she wants to go, and when it last said so.
     *  Never used for position or speed — only for direction, and only at the
     *  two end stations. */
    let intentDir = 0;
    let intentAt = -Infinity;
    /** While `performance.now()` is under this, snapping stays off no matter
     *  what the geometry says: she is on her way out. `escapeDir` is the
     *  direction that armed it, so an intent the other way can cancel it. */
    let escapeUntil = 0;
    let escapeDir = 0;
    /** Set by the wheel-train handler while it is driving a station move of its
     *  own; see `onWheel` and the `applySnap` branch that reads it. */
    let wheelMoveUntil = 0;
    /** ── THE TOUCH SIDE OF "ONE GESTURE, ONE STATION" ──
     *  Which station the flick in flight started on, or `null` when there is no
     *  flick or it started outside the pinned stage; and when a touch flick last
     *  actually moved a station, which is what rate-limits the next one. Read by
     *  the branch in `applySnap` that carries the argument. */
    let touchFrom: number | null = null;
    let touchMovedAt = -Infinity;
    /** Whether the flick in flight is allowed to move a station at all, decided
     *  ONCE when the finger lands and never re-read after that. It has to be a
     *  snapshot: the test includes "has the canvas finished playing", and the
     *  drag's own first pixels immediately make that false, so asking again
     *  mid-drag would refuse every flick including the first. */
    let touchMayMove = false;
    /** Has the canvas finished playing its way to the station the scroll is
     *  parked on? Written once a frame by the rAF loop, read by the touch clamp
     *  — it is what "and only then can keep scrolling" means, in code. */
    let scrubSettled = true;
    const noteIntent = (dir: number) => {
      if (!dir) return;
      intentDir = dir;
      intentAt = performance.now();
    };
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

      // ── THE EXIT RELEASE ──
      // Read the long note above `snapOn`. `atFirst`/`atLast` deliberately stay
      // true once she is PAST the end of the section as well as on it, so the
      // release keeps refreshing all the way out rather than expiring halfway.
      const atFirst = y <= SNAP_EDGE;
      const atLast = y >= end - SNAP_EDGE;
      if (intentDir !== 0 && now - intentAt < GESTURE_MS) {
        if ((atFirst && intentDir < 0) || (atLast && intentDir > 0)) {
          escapeDir = intentDir;
          escapeUntil = now + ESCAPE_MS;
          // An arrival lock is for holding her on the station she came in at.
          // She is asking to leave from it, which is the one thing it must not
          // outrank.
          lockAt = null;
          cameFrom = 0;
        } else if (escapeDir !== 0 && intentDir !== escapeDir) {
          // She changed her mind and is heading back in. Give the section its
          // ordinary arrival behaviour back immediately.
          escapeUntil = 0;
          escapeDir = 0;
        }
      }
      if (now < escapeUntil) {
        // The only place that drops the snap while the scroll is still moving.
        // The rule it breaks exists to protect the browser's own re-snap
        // animation — and at a boundary station that animation IS the trap.
        setSnap(false);
        return;
      }

      // A wheel train is driving a smooth scroll of our own (see `onWheel`).
      // Mandatory snapping would fight it for the whole animation.
      if (now < wheelMoveUntil) {
        setSnap(false);
        return;
      }

      // Hold the entry lock. A programmatic scroll does NOT cancel a touch fling
      // — measured: put back on station 0, the same flick carried on and ended on
      // station 3 — so the lock is held frame by frame until the momentum has
      // spent itself (nothing left to correct for `LOCK_QUIET_MS`) or `LOCK_MS`
      // is up, whichever comes first. Both are times and not frame counts, for
      // the same reason as above.
      if (lockAt !== null) {
        if (Math.abs(y - lockAt) > 1) {
          scrollBy(lockAt - y);
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

      // ── ONE FLICK, ONE STATION, ON TOUCH TOO (Daniel, 2026-07-31) ──
      // *"If scrolling multiple times with finger it will skip steps in
      // animations which I don't like, the user should be forced to see each
      // animation and only then can keep scrolling. If he want to skip and go
      // up we got the arrow button for it."*
      //
      // Inside the section the desktop wheel is held to one station per gesture
      // by `onWheel`, which can do it the easy way: it takes the scroll over
      // outright with `preventDefault`. Touch cannot. Every touch listener in
      // this file is passive on purpose — the note above `snapOn` records that a
      // non-passive one races Chromium's own snap resolution and loses about
      // half the time — and `scroll-snap-stop: always` was supposed to cover it,
      // but on Daniel's second Samsung a quick series of flicks still skipped
      // steps, because each flick's momentum is committed before the snap for
      // the previous one has resolved.
      //
      // So it is done with the mechanism that IS proven on touch here: the
      // arrival lock. `touchFrom` is the station the current flick began on
      // (recorded on `touchstart`, and only while the stage is pinned); the
      // moment the page has travelled more than one station from it, she is put
      // on the ADJACENT one and held there while the rest of the momentum spends
      // itself, exactly as an arrival is held. A flick can therefore advance one
      // station and never two.
      //
      // And a further flick does nothing at all — it holds her where she is
      // rather than advancing — until BOTH of these are true:
      //
      //   • `STATION_COOLDOWN` has passed, the same 550ms rate limit the wheel
      //     train uses, which is what absorbs the double-flick a visitor makes
      //     when she thinks nothing happened; and
      //   • the canvas has finished playing the act it is on (`scrubSettled`).
      //     This is the literal form of what Daniel asked for — *"the user
      //     should be forced to see each animation and only then can keep
      //     scrolling"* — and it is a better rule than a longer timer because it
      //     self-tunes: it costs the ~2.4s an act actually takes, and nothing at
      //     all where there was no act left to play. It cannot feel like a dead
      //     page either, because the thing it is waiting for is a picture that
      //     is visibly moving.
      //
      // He accepted the cost of being carried through every step explicitly,
      // and named the way out: the back-to-top button, which is a scripted
      // scroll and never comes through here at all.
      //
      // ⚠️ IT CANNOT TOUCH AN EXIT. The exit release above runs first and
      // `return`s, so at the first station scrolling out, or the last station
      // scrolling out, this code never executes: one flick still leaves. It also
      // never runs during an ARRIVAL, because a flick that began outside the
      // pinned stage leaves `touchFrom` null and the backstop below owns that
      // case.
      //
      // ── AND A REFUSED FLICK IS REFUSED EARLY ──
      // The first cut only intervened once she had travelled a WHOLE station,
      // which meant every refused flick still scrolled a full act's worth before
      // being put back — and the canvas dutifully played that act forwards and
      // then backwards at its constant rate, keeping `scrubSettled` false for
      // seconds and refusing the next flick too. Measured: three quick flicks
      // left the section unable to advance for over five seconds. So a flick
      // that is not allowed to move a station is stopped as soon as it has
      // meaningfully left the one it is on (`TOUCH_HOLD`), while a flick that IS
      // allowed still gets its full station.
      if (touchFrom !== null && y > 0 && y < end) {
        const stationPx = end / (STATIONS - 1);
        const travelled = y / stationPx - touchFrom;
        const to = touchMayMove
          ? Math.abs(travelled) > 1.02
            ? Math.min(
                STATIONS - 1,
                Math.max(0, touchFrom + Math.sign(travelled))
              )
            : null
          : Math.abs(travelled) > TOUCH_HOLD
            ? touchFrom
            : null;
        if (to !== null) {
          if (to !== touchFrom) touchMovedAt = now;
          const target = to * stationPx;
          setSnap(true);
          scrollBy(target - y);
          lastScrollY = window.scrollY;
          lockAt = target;
          lockEnds = now + LOCK_MS;
          lastClampAt = now;
          // The flick has had its station. Anything left of it is momentum, and
          // the lock above owns that from here.
          touchFrom = to;
          return;
        }
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

    /**
     * What the canvas last painted, as a string.
     *
     * The rAF loop below runs every frame whether or not anything has changed,
     * and this used to redraw regardless — so a visitor PARKED on a station,
     * reading the four lines of copy, was paying for a full-viewport `drawImage`
     * (three more on desktop, for the still dissolve) sixty times a second,
     * forever, for a picture that was identical every time. On a phone that is
     * the difference between a section that idles at nothing and one that never
     * stops working; it also came straight out of the budget the scrub itself
     * needs while it IS moving. Now the loop is free whenever the resolved
     * picture has not changed.
     *
     * The signature is the resolved frame INDICES rather than the raw progress,
     * so it also covers the other direction: when a frame finishes decoding,
     * `nearestIndex` starts answering with it, the signature changes, and the
     * canvas updates without anything having to tell it to.
     */
    let lastSig = "";

    const draw = (p: number, settled: boolean) => {
      const f = p * (frameCount - 1);
      // Frames only exist on the fetch grid (every `step`), so the blend runs on
      // the grid too. It used to interpolate between `floor(f)` and
      // `floor(f) + step`, which on a phone is only a real pair of frames half
      // the time — the other half asked for an odd index that is never fetched
      // and silently drew no second layer at all.
      const g0 = Math.min(
        Math.floor((frameCount - 1) / step) * step,
        Math.floor(f / step) * step
      );
      const frac = (f - g0) / step;

      let i0: number;
      let i1 = -1;
      if (settled) {
        i0 = store.nearestIndex(Math.round(f));
      } else {
        i0 = store.nearestIndex(g0);
        // Blend only between two frames that are genuinely adjacent AND both
        // decoded. If the nearest loaded frame is not the one the blend is
        // anchored on, a second layer at partial alpha is a double exposure of
        // two unrelated moments, which is exactly what the header comment about
        // settled stations is warning against.
        if (frac > 0.02 && i0 === g0 && store.at(g0 + step)) i1 = g0 + step;
      }
      if (i0 < 0) return;

      let sig = `${i0}:${i1}:${i1 < 0 ? 0 : Math.round(frac * 32)}`;
      // Clean still dissolves in across the approach and is fully opaque BEFORE
      // the text is allowed to enter (see stillDone below).
      const stillAlpha: number[] = [];
      if (!isMobile) {
        for (const s of STILL_STATIONS) {
          const w = (0.1 - Math.abs(p - s / (STATIONS - 1))) / 0.06;
          const a = w > 0 && store.still(s) ? Math.min(1, w) : 0;
          stillAlpha.push(a);
          sig += `:${Math.round(a * 32)}`;
        }
      }
      if (sig === lastSig) return;
      lastSig = sig;

      ctx.drawImage(store.at(i0)!, 0, 0, dims.w, dims.h);
      if (i1 >= 0) {
        ctx.globalAlpha = frac;
        ctx.drawImage(store.at(i1)!, 0, 0, dims.w, dims.h);
        ctx.globalAlpha = 1;
      }
      if (!isMobile) {
        STILL_STATIONS.forEach((s, k) => {
          const a = stillAlpha[k];
          if (a > 0) {
            ctx.globalAlpha = a;
            ctx.drawImage(store.still(s)!, 0, 0, dims.w, dims.h);
            ctx.globalAlpha = 1;
          }
        });
      }
    };

    let targetP = 0;
    let smoothP = 0;
    let lastT = 0;
    let raf = 0;
    /** Mirrors `data-scrub-pinned` on <html>, so the attribute is only written
     *  on the frame it actually changes. Written only through `notePinned`. */
    let pinnedNow = false;

    /** ── WHEEL TRAIN STATE (see `onWheel`) ──
     *  When the current train last saw an event and how much it has
     *  accumulated; when a station move last fired; when ANY wheel event last
     *  arrived (kept even while the section is nowhere near, because that is
     *  what identifies the gesture that scrolled her in); and whether that
     *  arrival gesture has been spent (see `notePinned`). */
    let trainAt = 0;
    let trainDelta = 0;
    let firedAt = -Infinity;
    let lastWheelAt = -Infinity;
    let entrySpent = false;

    const progress = () => {
      const r = track.getBoundingClientRect();
      return Math.min(1, Math.max(0, -r.top / (r.height - window.innerHeight)));
    };
    /** Does the sticky stage fill the viewport right now?
     *
     *  The half-pixel tolerance is not slop. The track's height is fractional
     *  (300vh of a fractional viewport), so parked exactly on the LAST station
     *  the bottom edge lands a fraction of a pixel short and a strict `>=` reads
     *  "not pinned" — which hid the "שלב 4 מתוך 4" pill on the very station it
     *  names, and flickered `data-scrub-pinned` at the one place a visitor
     *  stops. Measured at 390×844 and 1440×900: the shortfall is 0.375px. */
    const pinned = () => {
      const r = track.getBoundingClientRect();
      return r.top <= 0.5 && r.bottom >= window.innerHeight - 0.5;
    };
    /**
     * ── THE ONE PLACE THAT SEES THE STAGE ENGAGE ──
     *
     * Called from BOTH the rAF loop and the wheel handler, because either can
     * observe the transition first: the scroll that pins the stage is committed
     * by the compositor, so the next wheel event can arrive before the next
     * animation frame does. If only the loop watched for it, that one wheel
     * event would slip through and advance a station — which is the bug this
     * exists for.
     *
     * ── WHY ARRIVING SPENDS THE GESTURE (Daniel, 2026-07-31, desktop) ──
     * *"The scrolling animation won't stop on the first thing so it will keep
     * going to the second straight away when I scroll. We need to make it stop
     * on the first image."*
     *
     * Reproduced: scrolling in from above, the stage pins on station 0, and the
     * very next notch of the SAME continuous wheel gesture met a wheel train
     * with an empty accumulator, a cooldown that had never fired and nothing
     * saying she had only just got here — so it read as a fresh, deliberate
     * request for the next station and served it instantly. The first image was
     * never on screen long enough to look at.
     *
     * So arriving is treated as what it is: a station move made by the gesture
     * in flight. That gesture is now SPENT — every further event it produces is
     * absorbed — and the next station needs a genuinely new one, which is a
     * wheel event arriving after `ENTRY_QUIET_MS` of silence.
     *
     * ⚠️ IT CANNOT TRAP HER. The exit rule in `onWheel` is checked BEFORE any of
     * this: at the first station scrolling up (or the last scrolling down) the
     * event is never intercepted, cooldown or no cooldown, so one ordinary
     * gesture still leaves the section immediately. And it says nothing about
     * the no-yank entry above it — the arrival lock still puts her exactly on
     * the station she came in at; this only stops the same gesture leaving it.
     *
     * Touch does not come through here and does not need to: a finger's flick
     * is one gesture that the arrival lock (`lockAt`, above) already clamps to
     * the arrival station for as long as its momentum runs, which is the same
     * rule expressed on the other input.
     */
    const notePinned = (isPinned: boolean) => {
      if (isPinned === pinnedNow) return;
      pinnedNow = isPinned;
      document.documentElement.toggleAttribute("data-scrub-pinned", isPinned);
      if (!isPinned) return;
      entrySpent = true;
      trainDelta = 0;
    };
    /** Where the visitor is inside the track, in track-pixels, and where the
     *  last station sits. Both are also the two ends of the pinned range. */
    const geometry = () => {
      const r = track.getBoundingClientRect();
      const end = Math.max(1, r.height - window.innerHeight);
      return { y: -r.top, end };
    };

    // ── RAW INPUT, FOR ITS DIRECTION ONLY ──
    // Both listeners are passive and neither one moves anything. They exist so
    // `applySnap` can tell which way the visitor is ASKING to go at an end
    // station, which the committed scroll position cannot say — see the note
    // above `snapOn`.
    let touchY = 0;
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) touchY = touch.clientY;
      // Where this flick begins, in stations. `null` unless the stage is
      // already pinned: a flick that starts outside is an ARRIVAL, and the
      // arrival lock owns that. See the branch in `applySnap`.
      if (!pinned()) {
        touchFrom = null;
        return;
      }
      const { y, end } = geometry();
      touchFrom = Math.round((y / end) * (STATIONS - 1));
      // …and whether this flick may advance at all, decided now, while the page
      // is still where the last one left it. Both halves of the test are about
      // the PREVIOUS flick: has its act finished playing, and has the 550ms rate
      // limit lapsed.
      touchMayMove =
        scrubSettled && performance.now() - touchMovedAt >= STATION_COOLDOWN;
    };
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      // Finger travelling UP drags the content up, which is scrolling DOWN.
      const dy = touchY - touch.clientY;
      if (Math.abs(dy) < INTENT_TOUCH_MIN) return;
      touchY = touch.clientY;
      noteIntent(Math.sign(dy));
    };

    /** One wheel event in CSS pixels, whichever unit it arrived in. */
    const wheelPx = (event: WheelEvent) => {
      if (event.deltaMode === 1) return event.deltaY * 16;
      if (event.deltaMode === 2) return event.deltaY * window.innerHeight;
      return event.deltaY;
    };

    /**
     * ── ONE WHEEL GESTURE, ONE STATION ──
     * Daniel, on desktop: two quick scrolls travel two or more stations at once.
     * People double-scroll when they think a page has not responded, and this
     * section takes ~2.4s to play an act, so it looks unresponsive for exactly
     * as long as it takes to double-scroll — and then they overshoot the step
     * they were trying to read. The mirror-image bug was already here and is
     * fixed by the same accumulator: a train of SMALL notches (a trackpad, a
     * free-spinning wheel) never reached a snap threshold at all, so each notch
     * snapped back and the section could not be advanced gently.
     *
     * So while the stage is pinned, the wheel does not scroll the page — it asks
     * for a station. A move needs `WHEEL_THRESHOLD` of accumulated, normalised
     * travel, the accumulator is reset whenever the wheel has been quiet for
     * `TRAIN_GAP`, and — the rule that actually does the work — no move may
     * follow another inside `STATION_COOLDOWN`. Taking the scroll over outright
     * is what makes "never more than one" true: there is no native scroll left
     * to race and no momentum left to arrive late.
     *
     * The consequence worth stating plainly: a SUSTAINED gesture (a trackpad
     * drag held for seconds) advances one station per cooldown rather than one
     * in total. That is deliberate. "One station per gesture, forever" would
     * mean a visitor holding a trackpad scroll sits motionless until she lets
     * go, which reads as a dead page — the same complaint from the other side.
     * Two flicks in quick succession are what must not overshoot, and they do
     * not.
     *
     * ⚠️ IT NEVER INTERCEPTS AN EXIT. At the first station scrolling up, or the
     * last scrolling down, the event is left completely alone: no
     * `preventDefault`, no accumulation, nothing. The direction is known from
     * the FIRST event of the train, so the beginning of a leaving gesture is
     * never swallowed and then regretted. That is the same rule as the exit
     * release in `applySnap`, expressed on the other input.
     *
     * Touch never reaches here: a phone has the CSS snap path and the release
     * above, and this listener is the only non-passive one in the file precisely
     * so that it is the only place a `preventDefault` can happen.
     */
    const onWheel = (event: WheelEvent) => {
      // Pinch-zoom arrives as a ctrl-wheel and is not a scroll.
      if (event.ctrlKey) return;
      const px = wheelPx(event);
      const dir = Math.sign(px);
      if (!dir) return;
      const now = performance.now();
      // How long the wheel had been silent BEFORE this event. Read (and reset)
      // for every wheel event the page sees, including the ones that arrive
      // while the section is still far away — those are what make the gesture
      // that scrolls her in recognisable once it gets here.
      const quietFor = now - lastWheelAt;
      lastWheelAt = now;
      if (Math.abs(px) >= INTENT_WHEEL_MIN) noteIntent(dir);
      // Either this or the rAF loop can be first to see the stage engage; both
      // report, and `notePinned` acts once. See the long note on it.
      notePinned(pinned());
      if (!pinnedNow) return;

      const { y, end } = geometry();
      if ((dir < 0 && y <= SNAP_EDGE) || (dir > 0 && y >= end - SNAP_EDGE)) {
        trainAt = 0;
        trainDelta = 0;
        return;
      }

      event.preventDefault();

      // ── THE GESTURE THAT BROUGHT HER IN IS SPENT ──
      // Checked here, AFTER the exit rule above, so a cooldown can never stand
      // between her and the way out, and before everything below, because it
      // outranks them: no accumulation, no threshold, no station. It clears
      // itself the moment a wheel event arrives out of `ENTRY_QUIET_MS` of
      // silence, which is the definition of a new gesture. See `notePinned`.
      if (entrySpent) {
        if (quietFor < ENTRY_QUIET_MS) {
          trainAt = now;
          trainDelta = 0;
          return;
        }
        entrySpent = false;
      }

      // ⚠️ THE COOLDOWN IS CHECKED FIRST, BEFORE THE TRAIN GROUPING, and that
      // ordering is the whole fix. The first cut had it the other way round —
      // group into trains, then rate-limit within a train — and it did not work,
      // because the reported gesture is TWO SEPARATE FLICKS. Measured in
      // Chromium: two "quick" wheel scrolls actually land ~400ms apart, which is
      // past `TRAIN_GAP`, so the grouping declared a fresh train, cleared the
      // fired flag and let the cooldown be skipped entirely. Two notches, two
      // stations — exactly the bug. The rate limit has to sit ABOVE the grouping
      // to be a rate limit at all.
      if (now - firedAt < STATION_COOLDOWN) {
        // Absorbed. Still cancelled, so nothing drifts, and the accumulator is
        // reset so the next gesture has to earn its threshold from zero rather
        // than firing the instant the cooldown lapses.
        trainAt = now;
        trainDelta = 0;
        return;
      }
      if (now - trainAt > TRAIN_GAP) trainDelta = 0;
      trainAt = now;
      trainDelta += px;
      if (Math.abs(trainDelta) < WHEEL_THRESHOLD) return;

      firedAt = now;
      const from = Math.round((y / end) * (STATIONS - 1));
      const to = Math.min(
        STATIONS - 1,
        Math.max(0, from + Math.sign(trainDelta))
      );
      const target = (end * to) / (STATIONS - 1);
      setSnap(false);
      wheelMoveUntil = now + WHEEL_MOVE_MS;
      window.scrollTo({
        top: window.scrollY + (target - y),
        behavior: "smooth",
      });
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: false });

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - lastT) / 1000 || 0.016);
      lastT = now;
      targetP = progress();
      const delta = targetP - smoothP;
      const stepP = SPEED * dt;
      smoothP =
        Math.abs(delta) <= stepP ? targetP : smoothP + Math.sign(delta) * stepP;
      // Where the playhead is, so the store can keep its decoded window around
      // it and reach for the frames she is about to need rather than the next
      // ones on its list. Cheap and idempotent: it returns immediately unless
      // the playhead has crossed onto a different stored frame.
      store.focus(Math.round(smoothP * (frameCount - 1)));
      draw(smoothP, smoothP === targetP);
      // The touch clamp asks this rather than a timer; see the branch in
      // `applySnap` that holds a second flick until the act has played.
      scrubSettled = smoothP === targetP;

      const station = Math.round(targetP * (STATIONS - 1));
      // Both bands carry the one-second lead — see TEXT_LEAD at the top of the
      // file. `nearStation` was called `stillDone` while it meant "the clean
      // still has finished dissolving in"; it now means "the playhead is within
      // a second of the station", which is a different claim and needed a
      // different name.
      const nearSettle = Math.abs(delta) < SETTLE_BAND;
      const nearStation =
        isMobile ||
        !STILL_STATIONS.includes(station as 1 | 2 | 3) ||
        Math.abs(smoothP - station / (STATIONS - 1)) <= STILL_BAND;

      beatRefs.current.forEach((b, i) => {
        if (!b) return;
        b.classList.toggle("scrub-on", nearSettle && nearStation && i === station);
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
      // ── TELL THE REST OF THE PAGE IT IS INVISIBLE ──
      // While the stage is pinned it fills the viewport with an opaque canvas,
      // so every fixed layer behind it — the drifting colour field, the sand
      // plate, and the WebGL sand simulation whenever that comes back off its
      // hold — is painting a picture nobody can see, on the one GPU the scrub
      // needs all of. `data-scrub-pinned` on <html> is how they find out; the
      // consumers are `.site-bg` in globals.css §10a, the header's own backdrop
      // (globals.css §10b — the bar stands down while the stage is on screen)
      // and the loop guards in site-background.tsx and sand-floor.tsx.
      //
      // The attribute is toggled on the exact frame the stage starts and stops
      // filling the viewport, which is also the exact frame the canvas starts
      // and stops covering those layers, so nothing can pop: at the boundary the
      // covered pixels are all canvas either way. (A wheel event landing between
      // two frames can beat this call to it by a millisecond or two — see
      // `notePinned` — which is the same instant by any measure that matters.)
      const isPinned = pinned();
      notePinned(isPinned);
      pillRef.current?.classList.toggle("scrub-on", isPinned);
      applySnap();

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      store.dispose();
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("wheel", onWheel);
      document.documentElement.removeAttribute("data-scrub-pinned");
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
                ? // `top-4`, and it used to be `top-20`. The 5rem was there to
                  // clear the 65px sticky header, which as of 2026-07-31 is
                  // hidden outright while this stage is pinned (globals.css
                  // §10b) — so the space it was avoiding is free, and Daniel
                  // asked for the card to take it: *"make the box where text
                  // starts higher as it covers the animation and image
                  // currently."* Every centimetre this moves up is a centimetre
                  // of the pearl it stops covering. It goes with the one-line
                  // heading below; the two together are what shortened the box.
                  "scrub-beat absolute inset-x-[5%] top-4 rounded-2xl border border-white/15 bg-[rgba(43,26,14,0.66)] p-4 text-center text-white backdrop-blur-md"
                : "scrub-beat absolute start-[5%] top-1/2 w-[min(560px,44vw)] -translate-y-1/2 rounded-2xl border border-white/50 bg-[rgba(251,247,241,0.55)] p-6 text-start text-[#4a3527] backdrop-blur-lg"
            }
          >
            {/* No `tracking-wider` here, deliberately: the static section
                dropped exactly that class for exactly this string, because
                letter-spacing pulls the two Hebrew letters of "שלב" apart into
                ש ל ב. The digit is `dir="ltr"` for the same reason it is there.
                Pink type at label size is `--rose-ink`, never `--brand-accent`
                (CLAUDE.md, design tokens).

                ── ONE LINE ON A PHONE, TWO ON A DESKTOP ──
                Daniel, 2026-07-31: *"move the text 'step x' to maybe 'step x |
                header' in the same line to save screen space."* On a 390px
                screen the label had a whole line to itself above the heading,
                on a card that is sitting over the picture; joined with a rule
                between them it costs nothing and gives the pearl a line back.
                The divider is a `|` GLYPH and not a word — no copy was invented
                here, and both halves are still the same two message keys. It is
                `aria-hidden` so a screen reader still hears "שלב 2" and the
                heading as two separate phrases rather than one run-on.
                The desktop card keeps the stacked arrangement: it has the room,
                the label is set in pink there, and stacking is what gives the
                title its own line to breathe on. */}
            {isMobile ? (
              // Inline flow, NOT flex: a flex row wraps as whole items, so the
              // long titles put the label on a line of its own again and the
              // saving was lost. As inline text the label, the rule and the
              // title are one paragraph that only breaks where it has to.
              <span className="mb-2 block text-xl font-bold leading-snug">
                <span className="text-base">
                  {t("stepLabel")} <span dir="ltr">{i + 1}</span>
                </span>
                <span aria-hidden className="mx-2 text-base opacity-45">
                  |
                </span>
                {s.title}
              </span>
            ) : (
              <>
                <span className="mb-1.5 block text-base font-bold text-rose-ink">
                  {t("stepLabel")} <span dir="ltr">{i + 1}</span>
                </span>
                <span className="mb-2 block text-xl font-bold leading-snug sm:text-2xl">
                  {s.title}
                </span>
              </>
            )}
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
