"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Maximize2, Pause, Play, Volume2 } from "lucide-react";

import { usePrefersReducedMotion } from "@/components/motion/use-reduced-motion";
import { trackEvent } from "@/lib/analytics";
import { siteConfig } from "@/config/site";
import { useFullscreenLetterbox } from "@/lib/use-fullscreen-letterbox";
import { posterSrc, videoSrc } from "@/content/media";

// iOS Safari has no Element.requestFullscreen — videos expand through the
// native player via this vendor method instead.
type FullscreenVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
};

/**
 * Production streams the hero from the Cloudflare R2 media bucket, falling back
 * to the bundled /public copy for local work. `videoSrc` owns that decision —
 * see the resolver in src/content/media.ts and docs/06-media-and-cdn.md.
 */
const VIDEO_SRC = videoSrc("hero");
const POSTER = posterSrc("hero");

/**
 * `caption` is the copy that sits INSIDE the frame, above the clip.
 *
 * Daniel asked for this three times before it landed (2026-08-02 and twice on
 * 2026-08-03: *"the text needs to be inside the rectangle above the video"*),
 * and it is exactly what the reference page Pnina sent does — the instruction
 * and its footnote live on the dark card WITH the video, not floating on the
 * page above it. It is passed in rather than rendered here because the strings
 * are hero copy and belong to `HeroSection`; this component owns the frame, not
 * the words.
 *
 * ⚠️ It sits inside the mount but OUTSIDE the `aspect-video` box, so it can
 * never be covered by the clip, the letterbox fill, the unmute panel or the
 * corner controls, and it does not change the video's own geometry. It DOES
 * spend fold budget — it is real layout inside the frame — so `hero-fold.spec`
 * is the check after any change to it.
 */
export function HeroVideo({ caption }: { caption?: React.ReactNode }) {
  const t = useTranslations("heroVideo");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  /**
   * How far through the clip we are, 0-1, for the progress line under the frame
   * (Daniel, 2026-08-03: *"it doesn't show a progress bar of the video playing
   * at the bottom, like a filling white line showing video progress"*).
   *
   * Kept as a fraction rather than as seconds so the render is a pure `scaleX`
   * and nothing has to know the duration. See the bar itself further down for
   * why this is not a `<progress>` and not a scrubber.
   */
  const [progress, setProgress] = useState(0);
  // `started` = she has pressed "הפעלה עם קול". Same meaning, same name and the
  // same one-way latch as MessageVideo (components/ui/message-video.tsx): before
  // it the clip is a silent looping preview, after it the clip is the real thing
  // with sound and it never goes back to being a preview.
  const [started, setStarted] = useState(false);
  const siteMotionChoiceReduced = usePrefersReducedMotion();
  const userControlledRef = useRef(false);
  // Fire the "watched" analytics event at most once per mount, so repeated
  // expand clicks don't spam the tracker.
  const trackedRef = useRef(false);

  // Fullscreen shows the whole 9:16 clip with black bars, not a cropped zoom.
  useFullscreenLetterbox(videoRef);

  // `canplay` can fire before hydration attaches a React listener (the video
  // starts loading with the SSR HTML, and with `autoPlay` + `preload="auto"` it
  // now really does load), so check readyState on mount too.
  //
  // Under the site's reduced-motion switch nothing will ever ask the clip to
  // play, so `canplay`/HAVE_FUTURE_DATA may never arrive — settle for metadata
  // there, exactly as MessageVideo does, or the play control that is gated on
  // `ready` would never render for her to press.
  useEffect(() => {
    if (!VIDEO_SRC) return;
    const video = videoRef.current;
    if (!video) return;
    const wanted = siteMotionChoiceReduced
      ? HTMLMediaElement.HAVE_METADATA
      : HTMLMediaElement.HAVE_FUTURE_DATA;
    const wantedEvent = siteMotionChoiceReduced ? "loadedmetadata" : "canplay";

    if (video.readyState >= wanted) {
      setReady(true);
      return;
    }
    const onCanPlay = () => setReady(true);
    video.addEventListener(wantedEvent, onCanPlay);
    return () => video.removeEventListener(wantedEvent, onCanPlay);
  }, [siteMotionChoiceReduced]);

  // Autoplay, muted, for EVERYONE — Daniel's explicit call in the v0.8.0 pass.
  // This clip is her introducing herself and it is the first thing a visitor
  // sees; he wants it moving on arrival rather than waiting behind a play
  // button. It SUPERSEDES the "reduced-motion → poster, no autoplay" line still
  // written in docs/12 §D3; that doc predates the decision.
  //
  // An earlier version vetoed autoplay under `prefers-reduced-motion`. That veto
  // is gone, and as of 2026-07-30 so is the device signal it read: the whole
  // site now moves by default and the accessibility panel's switch is the single
  // opt-out (CLAUDE.md rule 5). This clip was simply the first thing to be moved
  // onto that contract. It is also a piece of CONTENT rather than decoration: it
  // is silent, it carries burnt-in captions, and the always-visible pause
  // control below satisfies WCAG 2.2.2 for it.
  //
  // ── BOTH PATHS START IT, AND THAT IS THE FIX (2026-07-30) ──
  // Until now playback was started ONLY here, in an effect, deliberately: a
  // refusal (iOS Low Power Mode, a strict autoplay policy) rejects the promise
  // and that rejection is what puts the styled fallback on screen instead of a
  // frame stuck on the branded placeholder forever.
  //
  // The cost of that was invisible until Daniel tested the live site on an
  // iPhone: the hero clip did not autoplay there while the /about clip did. An
  // effect cannot run before hydration, and on a cold, slow load hydration on
  // this page arrives many seconds after the first paint — by which time iOS has
  // long since decided nothing wants to play. So the clip just sat there, on the
  // one page every visitor lands on first.
  //
  // The declarative `autoPlay` attribute is in the SSR HTML and needs no
  // JavaScript at all; with `muted` + `playsInline` beside it, iOS honours it.
  // So the attribute starts the clip early, and the effect below stays exactly
  // as it was as the SECOND path — it re-asks for a play that the attribute may
  // not have got, and it is still the only place a refusal can be caught.
  //
  // The two do not fight. `play()` on a video that is already playing resolves
  // without restarting it (it does not seek, it does not re-trigger `play`), so
  // the effect is a no-op in the normal case; and if the attribute succeeded,
  // `canplay` has already fired and `ready` is true, so the blocked-autoplay
  // fallback never shows.
  //
  // The one seam: a visitor whose reduced-motion switch is ON gets the attribute
  // too (there is one HTML document for everybody, and the switch is only known
  // in the browser). Her clip can therefore play for the moment between first
  // paint and hydration, at which point the branch below pauses it. That is a
  // fraction of a second on a preference that is off by default, and it is the
  // price of the attribute being declarative; it is not worth a second document.
  //
  // ── THE ONE THING THAT DOES STOP IT ──
  // The site's own "הפחתת תנועה" switch, in the accessibility panel. That is a
  // deliberate request made ON THIS PAGE by the woman reading it, not a device
  // default she may have set years ago for something else, so it wins. The
  // device preference alone does not, which is exactly what Daniel asked for.
  // See `usePrefersReducedMotion` in components/motion/use-reduced-motion.ts —
  // there is no longer a hook-level split here, because with no OS seed the
  // provider's value IS the explicit choice.
  useEffect(() => {
    if (!VIDEO_SRC) return;
    const video = videoRef.current;
    if (!video) return;

    if (siteMotionChoiceReduced) {
      if (!userControlledRef.current) video.pause();
      return;
    }

    // Already playing because she asked for it herself — the pause control or
    // the "הפעלה עם קול" button. Never restart it under her.
    if (userControlledRef.current || started) return;

    let cleanup: (() => void) | undefined;

    void video.play().catch(() => {
      // Both starts refused. Treat "metadata is in" as ready so the poster gives
      // way to the real frame and the play control renders for her to press.
      const onMeta = () => setReady(true);
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) onMeta();
      else {
        video.addEventListener("loadedmetadata", onMeta);
        cleanup = () => video.removeEventListener("loadedmetadata", onMeta);
      }
    });

    return () => cleanup?.();
  }, [siteMotionChoiceReduced, started]);

  // ── NATIVE CONTROLS ARE A FULLSCREEN-ONLY THING NOW (Pnina, 2026-08-03) ──
  // Until today this read `document.fullscreenElement === video || started`, so
  // the moment she pressed "הפעלה עם קול" the browser's own control bar was
  // painted across the bottom of the inline frame for good. Her brief is a
  // player with no chrome on it — the frame is the clip and nothing else — and
  // that bar is the largest piece of chrome the frame had.
  //
  // It also actively fought the new tap contract. With native controls up,
  // Chrome toggles play/pause on a click of the video ITSELF, so our own
  // toggle would have fired second and cancelled it out; and iOS Safari does
  // something different again (a tap shows/hides the bar instead of toggling
  // playback), so "tap = play/pause" would simply not have been true on the
  // phones this audience holds.
  //
  // So inline the clip carries no native UI at all, and everything a visitor
  // needs is a real <button> of ours: a transparent full-frame play/pause
  // control and one small fullscreen control in the corner. Fullscreen is the
  // exception because there the frame has NO chrome of its own — a desktop
  // browser expanding a controls-less <video> gives a black screen with no
  // scrubber and no visible way out — so `enterFullscreen` switches them on for
  // the duration and this listener switches them back off on the way out.
  //
  // THE OLD WARNING STILL HOLDS, it is just answered differently: coming out of
  // fullscreen must never strand her on a frame with no way to resume. It
  // cannot now, because the full-frame toggle button is mounted the whole time
  // and does not depend on fullscreen state at all.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element };
      video.controls =
        document.fullscreenElement === video ||
        doc.webkitFullscreenElement === video;
    };
    onChange();
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  // Track real playback state rather than assuming it, so the control's label
  // is never a lie — the browser can pause the clip on its own (backgrounded
  // tab, Low Power Mode, the end of a non-looping play).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const sync = () => setPlaying(!video.paused && !video.ended);
    sync();
    /**
     * The progress line's only input.
     *
     * `timeupdate` rather than a rAF loop on purpose: the browser fires it about
     * 4-15 times a second, which is more than enough for a bar that is at most
     * ~1100px wide (a rAF loop would re-render 60 times a second to move it a
     * fraction of a pixel), and it stops firing by itself the moment the clip is
     * paused, backgrounded or ended. So this costs nothing at rest and needs no
     * cleanup of its own beyond the listener.
     *
     * `duration` is NaN until metadata lands and Infinity for a live stream, so
     * it is guarded — without that the first event divides by NaN and the bar
     * renders at `scaleX(NaN)`, which Chrome silently drops and Safari does not.
     */
    const onTime = () => {
      const total = video.duration;
      if (!Number.isFinite(total) || total <= 0) return;
      setProgress(Math.min(1, Math.max(0, video.currentTime / total)));
    };
    onTime();
    video.addEventListener("play", sync);
    video.addEventListener("pause", sync);
    video.addEventListener("ended", sync);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("loadedmetadata", onTime);
    // A seek (including the `currentTime = 0` restart inside `playWithSound`)
    // moves the playhead without a `timeupdate`, so the bar would keep the old
    // position until the next tick and visibly jump backwards.
    video.addEventListener("seeked", onTime);
    return () => {
      video.removeEventListener("play", sync);
      video.removeEventListener("pause", sync);
      video.removeEventListener("ended", sync);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadedmetadata", onTime);
      video.removeEventListener("seeked", onTime);
    };
  }, [ready]);

  /**
   * Ask the video element itself for fullscreen, synchronously.
   *
   * Two rules, both load-bearing:
   *
   *  1. IT MUST BE CALLED INSIDE THE GESTURE HANDLER. Browsers only grant
   *     fullscreen while the transient user activation from the tap is still
   *     live, so this cannot move into an effect or behind an `await`. Calling
   *     `play()` first is fine — playing a video does not consume the
   *     activation — but nothing else may sit between the tap and this call.
   *  2. IT IS ADDITIVE AND NEVER BLOCKING. Every failure path is swallowed:
   *     a rejected promise, a synchronous throw (Safari), an environment with
   *     neither API. The sound must play whether or not the frame expands, so
   *     this function can only ever succeed or do nothing.
   *
   * iOS Safari has no `Element.requestFullscreen` on a <video> at all — the
   * native player is entered through `webkitEnterFullscreen`, which is tried
   * both as the fallback of a rejected promise and as the only option when the
   * standard method is missing. That path also hands the clip to the iOS native
   * player, which brings its own controls and its own letterboxing, so the two
   * extra things this function does for the desktop path are simply ignored
   * there.
   *
   * IT NOW ALSO TURNS THE NATIVE CONTROLS ON, and turns them back off if the
   * expand is refused. Inline the clip is deliberately bare (see the effect
   * above); fullscreen without a control bar is a black screen with no scrubber
   * and no obvious exit, so the bar is lent for the duration and taken back by
   * the `fullscreenchange` listener. `controls` is set BEFORE the request and
   * synchronously, because everything in this function has to stay inside the
   * tap's transient activation.
   */
  function enterFullscreen() {
    const video = videoRef.current as FullscreenVideo | null;
    if (!video) return;
    video.controls = true;
    // Nothing expanded, so the borrowed control bar has to go back — otherwise
    // a refused fullscreen would leave the inline frame wearing chrome forever.
    const giveUp = () => {
      video.controls = false;
    };
    try {
      if (video.requestFullscreen) {
        void video.requestFullscreen().catch(() => {
          try {
            if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
            else giveUp();
          } catch {
            /* No fullscreen here. The clip still plays inline. */
            giveUp();
          }
        });
      } else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      } else {
        giveUp();
      }
    } catch {
      /* Same: fullscreen is a bonus, never a precondition. */
      giveUp();
    }
  }

  /**
   * The first tap: restart from zero, with sound, once through.
   *
   * Daniel, 2026-07-30, testing the live site: *"I like the thing that we have
   * on the About page video where it says 'Play with audio' and the center
   * thing... The user presses it and it plays with audio."* Until now tapping
   * the hero clip only expanded it to fullscreen and it stayed muted forever,
   * so what she is saying — the whole point of the clip — was unreachable from
   * the home page.
   *
   * This started as MessageVideo's `playWithSound` and still shares its shape:
   * the same mutations in the same order, the same muted retry when a browser
   * still refuses audio, and the same one-way `started` latch — the pill does
   * not come back when the clip ends, and every tap after this one is a plain
   * play/pause (`togglePlay`). The two files have diverged as of 2026-08-03
   * though, because only the hero was rebuilt against Pnina's reference player:
   * this one no longer expands and no longer turns the native controls on.
   * /about is untouched. Do not "re-sync" them without her asking.
   *
   * ── AND IT NO LONGER GOES FULLSCREEN (Pnina, 2026-08-03) ──
   * ⚠️ THIS REVERSES DANIEL'S 2026-07-31 CALL, and the client is the one who
   * reversed it. He had asked for the first press to expand as well as unmute
   * (*"We want to also make it full screen"*). Pnina, looking at the built page
   * and at the reference player she wants copied, asked for the opposite in as
   * many words: tapping the clip must NOT zoom and must NOT go fullscreen, it
   * must just keep playing inline. Fullscreen stays possible — it has its own
   * small button in the corner now — it is simply never automatic.
   *
   * So the press does exactly the four mutations plus `play()`, and nothing
   * else. `video.controls = true` came out with the expand: inline the frame
   * carries no native bar at all any more (see the effect above).
   */
  function playWithSound() {
    const video = videoRef.current;
    if (!video) return;
    if (!trackedRef.current) {
      trackedRef.current = true;
      trackEvent("hero_video_watch");
    }
    // This IS a deliberate press, so it counts as user control: the
    // reduced-motion branch above must not pause the clip she just asked for.
    userControlledRef.current = true;
    video.loop = false;
    video.muted = false;
    video.currentTime = 0;
    void video.play().catch(() => {
      // Some browsers still refuse audio without a more direct gesture. At
      // least keep something playing rather than freezing on a still.
      video.muted = true;
      void video.play();
    });
    setStarted(true);
  }

  /**
   * Tap the frame = play/pause. The whole of it, and nothing else.
   *
   * This is what carries Pnina's first instruction, and it is deliberately the
   * dullest function in the file: no unmuting, no seeking, no expanding, no
   * latch. Tap once to pause, tap again to resume, on a clip that stays exactly
   * where it is.
   *
   * `userControlledRef` is set for the same reason `playWithSound` sets it: a
   * pause she asked for is hers, and the autoplay effect must not walk over it.
   */
  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    userControlledRef.current = true;
    if (video.paused) {
      void video.play().catch(() => {});
    } else {
      video.pause();
    }
  }

  function expand() {
    if (!videoRef.current) return;
    if (!trackedRef.current) {
      trackedRef.current = true;
      trackEvent("hero_video_watch");
    }
    enterFullscreen();
  }

  return (
    // ── THE FRAME IS 16:9 AGAIN (0.17.0), AND THE CLIP STILL IS NOT ──
    // Pnina asked for the hero video to be horizontal. Her current clip is a
    // genuine 608×1080 phone recording, and she will send a real horizontal one
    // later, so until then the frame and the footage disagree and something has
    // to give.
    //
    // Cropping does not: `object-cover` on a 9:16 source in a 16:9 box throws
    // away 68% of the frame vertically, which here means the top of her head and
    // the burnt-in Hebrew captions along the bottom. The captions are the only
    // thing a visitor can read while the clip is still silent.
    //
    // So the clip is letterboxed at `object-contain` and the empty sides are
    // filled by a SECOND copy of the same element, blurred and darkened behind
    // it. That is the standard treatment for exactly this mismatch and it reads
    // as deliberate rather than as two grey bars.
    //
    // WHEN THE REAL HORIZONTAL CLIP ARRIVES: delete the backdrop <video> and
    // change `object-contain` to `object-cover`. Nothing else here changes.
    //
    // ── AND IT IS THE FULL WIDTH OF THE HERO (Daniel, 2026-08-02) ──
    // *"On the desktop view the video, now that it is horizontal, it's really
    // small and tiny. It should be the entire screen like it is on the landing
    // page website."* While the hero was a two-column grid this frame lived in a
    // 23rem track, which on a 1500px screen is about a fifth of the viewport —
    // a thumbnail. The hero is one centred column now (see the note in
    // HeroSection), so the frame takes the column.
    //
    // ── AND THEN BIGGER AGAIN (Pnina, 2026-08-03) ──
    // *"Almost all the way to the right and to the left and up and down."*
    // The caps below are the answer, and the "up and down" half comes for free:
    // the box is 16:9, so every pixel of width is 0.5625px of height. Measured
    // frame sizes (the mount, so including its own padding), against a browser
    // with a 10px scrollbar:
    //
    //                    was            now         frame w x h
    //     390px      20.5rem cap     bleeds out     332x193 → 372x215
    //     640px      2xl / 672       3xl / 768      582x335  (column-limited)
    //     1024px     4xl / 896       5xl / 1024     966x551  (column-limited)
    //     1440px     4xl / 896       no cap         1104x629
    //
    // ── THE PHONE ONE NEEDED A NEGATIVE MARGIN, AND THAT IS THE WHOLE TRICK ──
    // Dropping the `20.5rem` cap alone bought FOUR PIXELS. 20.5rem is 328px and
    // the hero column at 390px is 342px wide, so that cap was never what was
    // holding the frame in — the column's own `px-6` was. So on a phone the
    // frame steps OUT of that padding by 20px a side and runs to within 4px of
    // the screen, which is what "almost all the way to the right and to the
    // left" actually means on a 390px screen. `sm:mx-auto` puts it back inside
    // the column everywhere else, where the copy needs its measure.
    // This is safe against the horizontal-scroll test: it ends 4px INSIDE the
    // section, so nothing is clipped and nothing overflows. Do not push it to a
    // true full bleed — the frame has 2rem rounded corners and a shadow, and
    // both want a little air to read as a frame rather than as a band.
    //
    // ⚠️ THE PHONE RUNG IS THE ONE WITH A HARD LIMIT ON IT. Everything in this
    // hero is budgeted against an 844px fold (e2e/hero-fold.spec.ts, and the
    // long note in HeroSection). This pass spends 22px of that budget; it fits
    // because the headline and the form gave more than that back on the same
    // day. Measured after: the submit button's bottom edge is at 818 of 844.
    // If a future edit needs room, it does NOT come out of the spec's numbers.
    <div className="relative -mx-3 sm:mx-auto sm:w-full sm:max-w-3xl lg:max-w-5xl xl:max-w-none">
      {/* Soft warm halo behind the frame. On a light canvas this is a wash, not
          a glow: it should be barely perceptible. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-16 -top-10 bottom-0 rounded-[3rem] bg-brand/20 blur-[80px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-12 top-1/3 bottom-0 rounded-[3rem] bg-gold/15 blur-[80px]"
      />

      {/* `p-1.5` on a phone rather than `p-2`: the mount is decoration and the
          clip is the content, so on the one screen where every pixel of height
          is spent against the fold the mount gives 4px of its 16 back. From
          `sm` up there is no fold to fight and the wider bezel looks better. */}
      <div className="ring-shine relative overflow-hidden rounded-[2rem] border border-foreground/[0.08] bg-surface-1 p-1.5 shadow-[0_36px_80px_-40px_var(--shadow-strong)] sm:p-2">
        {/* The caption band. `px-4` so the copy is not flush with the bezel, and
            a little more room under it than over it so it reads as belonging to
            the clip below rather than floating in the middle of the card. */}
        {caption ? (
          <div className="px-4 pb-3 pt-2 text-center sm:pb-4 sm:pt-3">
            {caption}
          </div>
        ) : null}
        {/* This used to carry `data-fab-avoid`, which made the floating WhatsApp
            button fade out whenever this frame was on screen. That is gone — see
            the header of floating-whatsapp.tsx. The collision it was avoiding is
            now solved by where the pause button sits (just below). */}
        {/* ⚠️ `bg-canvas`, NOT `bg-foreground`. This is the letterbox the clip
            sits on, so it has to be DARK — and it was written as `bg-foreground`
            back when the page was cream and the ink was near-black (#241c16),
            where that read as "the darkest thing available". Going dark-only in
            0.19.0 inverted `--foreground` to her Pearl White #f8f7f4, which
            silently turned this into a NEAR-WHITE slab behind the video. It is
            mostly hidden by the blurred fill in front of it, which is why it
            survived review — but it flashes on a slow connection, and it is the
            whole frame if the fill ever fails to decode. Never name an INK token
            for a SURFACE; the two invert against each other by design. */}
        <div className="relative aspect-video overflow-hidden rounded-[1.6rem] bg-canvas">
          {/* The branded poster panel sits underneath and shows whenever no
              video can play: no video supplied yet, a slow connection, or a
              blocked autoplay. It is designed to look deliberate rather than
              broken, so the page is presentable at every stage. */}
          {!ready ? <HeroPoster /> : null}

          {/* The letterbox fill. Same source, same autoplay attributes, so the
              browser serves it from one buffer rather than fetching the clip
              twice; `aria-hidden` + no controls + `pointer-events-none` keep it
              out of the accessibility tree and out of every gesture, so the real
              element below is still the only thing anyone can tap.
              It is deliberately NOT driven by any of the state above: it has no
              ref, it is never paused and it never gains sound. If it drifts a
              frame or two out of step with the clip in front of it nobody can
              tell — it is 28px of blur — and wiring it to the same controls
              would mean two elements racing for the same play promise. */}
          {VIDEO_SRC ? (
            <video
              aria-hidden
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              tabIndex={-1}
              // The blur went 26px → 44px when the frame became the full width
              // of the hero. The proportion of the frame this fill occupies is
              // fixed by the two aspect ratios — a 9:16 clip inside a 16:9 box
              // leaves ~68% of the width to fill, at ANY size — so making the
              // frame bigger makes the fill bigger with it. At 26px it still
              // read as a recognisably smeared copy of the video, which at this
              // width is most of what you see. At 44px it reads as ambient
              // light off the clip, which is what it is for.
              // ⚠️ BRIGHTNESS WENT 0.82 → 0.30 WHEN THE SITE WENT DARK-ONLY
              // (0.19.0), and it is the single biggest visual fix in this file.
              // 0.82 was tuned against a CREAM page, where "just under 1" made
              // the sharp clip the brighter thing while the fill still sat
              // comfortably on paper. On a near-black canvas that same value is
              // a PALE GREY SLAB: this clip is a brightly lit indoor shot, the
              // fill occupies ~68% of the frame's width at any size (fixed by
              // the two aspect ratios, 9:16 inside 16:9), and at 0.82 it was by
              // far the lightest object on the page — the opposite of the dark
              // luxury look Pnina asked for, and it drowned the rays behind it.
              // At 0.30 it reads as ambient light spilling off the clip into the
              // dark, which is what it was always for.
              // Saturation stays UP so the spill carries the frame's warmth
              // rather than greying out, which matters more now, not less: at
              // this brightness a desaturated fill would be indistinguishable
              // from the canvas and the frame would lose its edges.
              // The blur ladder is unchanged and its reasoning still holds:
              // 26px → 44px when the frame became the hero's full width, and
              // 44px → 56px from `lg` now that it runs to 1104px, because a
              // bigger frame makes this fill bigger with it.
              className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover blur-[44px] brightness-[0.30] saturate-[1.45] lg:blur-[56px]"
            >
              <source src={VIDEO_SRC} type="video/mp4" />
            </video>
          ) : null}

          {VIDEO_SRC ? (
            <video
              ref={videoRef}
              // `autoPlay` AND the effect above. The attribute is what makes iOS
              // start the clip before hydration; the effect is what catches a
              // refusal and what lets the accessibility panel's motion switch
              // veto it. Read the long note on that effect before removing
              // either — they are two halves of one fix.
              autoPlay
              muted
              loop
              playsInline
              poster={POSTER}
              // `auto`, not `metadata`. This clip autoplays for every visitor by
              // an explicit product decision and it loops, so every byte
              // `metadata` withholds is fetched a moment later anyway — all
              // `metadata` bought was a later first frame. It also made the
              // ready state fragile: `canplay` needs HAVE_FUTURE_DATA, which
              // with `metadata` only arrives once something asks the clip to
              // play, which is precisely what was not happening on iOS.
              preload="auto"
              // No download, no picture-in-picture, no playback-rate menu, and
              // no right-click "save video as" — Daniel's call for EVERY video
              // on the site (2026-07-30), because this is her own footage about
              // her own assault and it is not ours to hand out copies of. The
              // three-dot overflow these remove is the browser's own, so it only
              // appears once native controls do (after "הפעלה עם קול"), but the
              // attributes are unconditional so no future state can leak it
              // back. Matched in message-video.tsx.
              controlsList="nodownload noplaybackrate noremoteplayback"
              disablePictureInPicture
              onContextMenu={(event) => event.preventDefault()}
              // ── NO `onClick` ON THE <video> ANY MORE (2026-08-03) ──
              // The tap is carried by a real, focusable, labelled <button> laid
              // over this element instead (the tap target below). A bare
              // click handler on a <video> is invisible to a keyboard and to a
              // screen reader, and it was only tolerable while native controls
              // came up beside it; they no longer do.
              //
              // ALWAYS VISIBLE — this is what lets `poster` actually paint. The
              // element used to sit at `opacity-0` until `ready`, which meant the
              // poster WebP (20 KB, fetched on every load) was never once shown:
              // visitors watched the monogram panel for the whole 5 MB buffer.
              // An unready <video> renders transparent until its poster arrives,
              // so HeroPoster still shows through for the first ~1s, then her
              // actual poster frame takes over (~1.2s measured), then playback.
              // The blocked/no-video cases still fall back to HeroPoster because
              // `ready` never flips there.
              // `object-contain`, not `object-cover` — see the frame note at the
              // top of the return. Cover on this portrait source would cut her
              // head off and take the burnt-in captions with it. Swap it back to
              // `cover` (and delete the blurred backdrop above) the day her real
              // horizontal clip lands.
              className="absolute inset-0 h-full w-full object-contain"
            >
              <source src={VIDEO_SRC} type="video/mp4" />
            </video>
          ) : null}

          {/* ── THE TAP TARGET (Pnina, 2026-08-03) ──
              *Tap = play/pause.* One transparent sheet over the whole frame,
              and it is a real <button> rather than a click handler on the
              <video>, deliberately: with the native control bar gone (see the
              controls effect above) a bare handler would have left this player
              with no keyboard route and nothing for a screen reader to announce.
              As a button it is tabbable, it takes Enter and Space for free, and
              its accessible name is the same "השהיית/הפעלת הסרטון" string the
              old corner control used, flipped by real playback state.

              It is mounted only once `started`, because before that the
              "הפעלה עם קול" sheet below owns the same rectangle and the first
              tap has a different job. The two therefore never both exist, which
              is what keeps the new toggle from fighting the unmute latch.

              `cursor-pointer`, NOT `cursor-zoom-in` — the zoom cursor is a
              magnifying glass with a plus in it, a photo-viewer affordance that
              reads as "inspect this woman's face". It was already wrong when
              this surface expanded the clip; now that it does not zoom at all
              it would also be a lie. */}
          {ready && started ? (
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? t("pause") : t("play")}
              className="group/tap absolute inset-0 flex h-full w-full cursor-pointer items-center justify-center bg-transparent outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-white/70"
            >
              {/* ── THE RESUME AFFORDANCE (Daniel, 2026-08-03) ──
                  *"if the video is stopped it should show the resume button in
                  the middle of the video, like the triangle icon."*

                  Without this, a paused clip was indistinguishable from a broken
                  one: the whole frame is the tap target, so there was nothing on
                  screen saying the video was merely paused or that tapping would
                  resume it. A still frame with no affordance reads as "this
                  stopped working", which on the one video the page is built
                  around is expensive.

                  It renders ONLY while paused — a triangle sitting on top of a
                  playing clip would be the thing it is not. The disc is the same
                  size and the same CTA pair as the "הפעלה עם קול" control this
                  surface replaces after the first tap, so the affordance a
                  visitor learned there is the affordance she finds here.
                  `pointer-events-none` because the BUTTON is the whole frame;
                  this is a picture of a control, not a second control, and
                  putting a hit target inside a hit target only creates a dead
                  ring where the two disagree. */}
              {!playing ? (
                <span className="pointer-events-none flex h-18 w-18 items-center justify-center rounded-full bg-cta-fill text-cta-ink shadow-[0_12px_44px_-6px_var(--cta-glow)] transition-transform duration-300 group-hover/tap:scale-110">
                  <Play className="relative ms-1 h-7 w-7 fill-current" />
                </span>
              ) : null}
            </button>
          ) : null}

          {/* ── "הפעלה עם קול", the /about clip's control, now on the hero ──
              Rendered BEFORE the corner controls on purpose: they are all
              absolutely positioned, so DOM order is paint order and the corner
              controls have to stay reachable on top of this sheet.

              The scrim is deliberately LIGHTER than MessageVideo's
              (black/25→black/60). This clip carries burnt-in Hebrew captions
              along its bottom edge, and MessageVideo's gradient is heaviest
              exactly there — it would grey out the one thing a visitor can read
              while the clip is still silent. The control it wraps is the same
              size and the same shape, so it still reads as the same affordance
              on both pages. There is deliberately no `animate-ping` halo behind
              the circle the way MessageVideo has one: this is the FIRST thing on
              the home page, and an endless pulse in a visitor's eyeline while she
              reads the hero is the mechanic CLAUDE.md rule 4 forbids (the same
              class came off the floating WhatsApp button for the same reason).

              Pnina's 2026-08-03 brief keeps this panel exactly as it is — it is
              the one thing about the current player she wants copied FROM, not
              changed: her reference shows the same large centred unmute over a
              muted autoplaying clip. Same wording, same latch. */}
          {ready && !started ? (
            <button
              type="button"
              onClick={playWithSound}
              aria-label={t("playWithSoundAria")}
              className="group absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-black/10 via-black/20 to-black/35 transition-colors hover:from-black/20 hover:to-black/45"
            >
              {/* The play disc wears the CTA PAIR, not `--brand-deep`.
                  It was `bg-brand-deep text-white` with a hard-coded brown
                  shadow, which was right on the cream page and wrong twice over
                  after 0.19.0: `--brand-deep` reads as a muddy teal against the
                  new navy, and the brown glow answered to a colour no longer on
                  the page. Through `--cta-fill` / `--cta-ink` it is her Soft
                  Gold with navy ink at a measured 8.35:1, and — the actual point
                  — it becomes the SAME colour as the send button below it, so
                  the two things the hero wants pressed look like each other.
                  The glow is the halo token rather than a literal, so it follows
                  any accent change instead of stranding a brown shadow again. */}
              <span className="relative flex h-18 w-18 items-center justify-center rounded-full bg-cta-fill text-cta-ink shadow-[0_12px_44px_-6px_var(--cta-glow)] transition-transform duration-300 group-hover:scale-110">
                <Play className="relative ms-1 h-7 w-7 fill-current" />
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-4 py-1.5 text-sm font-medium text-white backdrop-blur">
                <Volume2 className="h-4 w-4 shrink-0 text-gold" />
                {t("playWithSound")}
              </span>
            </button>
          ) : null}

          {/* ── THE TOP ROW IS GONE (Pnina, 2026-08-03) ──
              It was a 44px pause square at `top-3 start-3` and a labelled
              "מסך מלא" pill at `top-3 end-3` — together roughly 160px of chrome
              spanning the frame. Her words through Daniel: they eat too much
              space, take the row out. So:
                • the pause button is REPLACED by the tap target above, which is
                  the whole frame and costs no pixels at all;
                • fullscreen becomes one small icon-only button, no label.
              Against a frame that also just went from 332px wide to 372px on a
              phone, this corner is about a fifth of what was here.

              ── IT IS STILL ON THE TOP EDGE, AND THAT PART IS LOAD-BEARING ──
              Fullscreen belongs in a bottom corner in every video player ever
              made, and it cannot go in one here. The site has TWO viewport-fixed
              floating buttons — WhatsApp at bottom-inline-start, the
              accessibility launcher at bottom-inline-end — and as this frame
              scrolls past them BOTH of its bottom corners pass underneath one.
              That collision was measured at 390x844 in the 2026-07-30 review
              (12px into the WhatsApp button, 17x8px into the launcher) and the
              rule that came out of it is written into floating-whatsapp.tsx:
              when a control collides with those corners, MOVE THE CONTROL. The
              top edge is the one place a bottom-pinned FAB can never reach, and
              on a 9:16 clip it is the better edge anyway — the burnt-in captions
              run along the bottom.

              ── AND THE PAUSE CONTROL SURVIVES IN ONE STATE ONLY ──
              While the clip is still the silent looping preview, the tap target
              is not mounted (the unmute sheet owns that rectangle), so a
              pause-only twin sits beside the fullscreen button until she
              presses play-with-sound, and then never again. That is WCAG 2.2.2:
              motion that starts on its own and lasts more than five seconds
              needs a way to stop it, and this clip is a minute long and
              autoplays for everyone. It is always visible rather than a
              hover-reveal, which is unreachable on the phones these visitors
              hold.

              40px, not the old 44px: WCAG 2.5.8 (AA) asks for 24px and this is
              comfortably over it, while 44px (2.5.5, AAA) is what made the old
              controls read as a bar. Icon-only, so no copy key is needed for
              either — the aria-labels carry the names. */}
          {ready ? (
            <div className="absolute top-2 end-2 flex items-center gap-1.5 sm:top-3 sm:end-3">
              {!started ? (
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={playing ? t("pause") : t("play")}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur transition-colors hover:border-white/30 hover:bg-black/70"
                >
                  {playing ? (
                    <Pause className="h-3.5 w-3.5 fill-current" />
                  ) : (
                    <Play className="h-3.5 w-3.5 fill-current" />
                  )}
                </button>
              ) : null}

              <button
                type="button"
                onClick={expand}
                aria-label={t("fullscreenAria")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur transition-colors hover:border-white/30 hover:bg-black/70"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          {/* ── THE PROGRESS LINE (Daniel, 2026-08-03) ──
              *"currently it doesn't show a progress bar of the video playing at
              the bottom, like a filling white line showing video progress."*

              It is exactly that and nothing more: a hairline that fills left to
              right as the clip plays. It exists because the native control bar
              now only appears in fullscreen, so inline there was no way to tell
              a one-minute clip from a ten-minute one, or to see that it was
              nearly over. That matters here more than on a normal site — the
              whole hero asks her to "צפי בסרטון עד הסוף", and an unknown
              remaining length is a reason to stop watching.

              ⚠️ IT IS AN INDICATOR, NOT A SCRUBBER, and that is deliberate.
              `pointer-events-none`, no drag, no hit target. The entire frame is
              one big play/pause button (Pnina's instruction), so a draggable
              strip along its bottom edge would sit inside that button and steal
              taps meant for it — on a phone, where the strip would be ~10px of
              thumb reach from the frame's edge, that is a mis-tap machine.
              Seeking lives in fullscreen, where the real controls are.

              It renders only once she has started the clip: during the silent
              looping preview the bar would be a sawtooth resetting every loop,
              which reads as a glitch rather than as progress.

              `scaleX` on a `transform`, not an animated `width` — width is a
              layout property and animating it re-lays-out the frame 4-15 times a
              second; a transform is composited. `origin-left` with an explicit
              `dir="ltr"`: the document is RTL, so `origin-left` would otherwise
              flip and the bar would drain from the wrong end.
              No `transition` on the transform: `timeupdate` already arrives
              smoothly, and easing between ticks makes the bar lag the picture. */}
          {ready && started ? (
            <div
              dir="ltr"
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-white/15"
            >
              <div
                className="h-full origin-left bg-white/90"
                style={{ transform: `scaleX(${progress})` }}
              />
            </div>
          ) : null}

          <div className="pointer-events-none absolute inset-0 rounded-[1.6rem] ring-1 ring-inset ring-white/10" />
        </div>
      </div>
    </div>
  );
}

/**
 * Poster frame shown until (or instead of) a playable video: the monogram, the
 * name and a one-line reassurance over a warm wash. Deliberately NOT a "video
 * coming soon" box — this ships to real visitors whenever the video fails to
 * load, so it has to stand on its own.
 */
function HeroPoster() {
  const t = useTranslations("heroVideo");
  return (
    // Laid out ACROSS rather than down since 0.17.0. The frame it fills went
    // from 9:16 to 16:9, and at 390px wide that box is only ~192px tall — the
    // old stacked column (64px badge + 2rem name + a line of copy + two gaps)
    // did not fit in it and the note was clipped. Same three elements, same
    // order, turned on their side; the monogram shrinks and the note is allowed
    // to disappear under `sm` where there is genuinely no room for it.
    <div className="absolute inset-0 flex items-center justify-center gap-4 bg-gradient-to-b from-surface-2 via-brand-wash to-surface-1 px-5 text-center sm:gap-5">
      <span
        aria-hidden
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brand/30 bg-surface-1/70 font-display text-[1.35rem] text-brand-accent shadow-card sm:h-14 sm:w-14 sm:text-[1.55rem]"
      >
        {siteConfig.monogram}
      </span>
      <div className="min-w-0 text-start">
        <p className="font-display text-[1.5rem] leading-tight text-foreground sm:text-[1.8rem]">
          {siteConfig.name}
        </p>
        <p className="mt-1 hidden text-sm leading-normal text-muted-foreground sm:block">
          {t("posterNote")}
        </p>
      </div>
    </div>
  );
}
