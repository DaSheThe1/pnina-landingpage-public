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
    // So the snap zone simply STOPS SHORT of both end stations by `SNAP_EDGE`.
    // Sitting on station 0 or station 3, snapping is off and the page is
    // ordinary; scrolling outward just leaves, with nothing to race. Scrolling
    // INWARD crosses into the zone within a few pixels and mandatory snapping
    // takes over for the rest of the story, exactly as before — one flick, one
    // step. Entering the section can therefore never jump either: the zone's
    // edges sit a few pixels inside the first and last snap positions, so
    // whichever end the visitor arrives at, the snap it engages with is the one
    // she is already standing on.
    let snapOn = false;
    const applySnap = () => {
      const r = track.getBoundingClientRect();
      const on =
        r.top < -SNAP_EDGE && r.bottom > window.innerHeight + SNAP_EDGE;
      if (on === snapOn) return;
      snapOn = on;
      document.documentElement.style.scrollSnapType = on ? "y mandatory" : "";
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
