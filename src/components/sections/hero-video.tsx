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

export function HeroVideo() {
  const t = useTranslations("heroVideo");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
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

  // Native controls only once she has pressed "הפעלה עם קול", or while
  // fullscreen — silent and pre-play it stays a clean frame. Lifted verbatim
  // from MessageVideo so the two players behave identically.
  //
  // `started`, not `started && !video.paused`: since the first press also opens
  // fullscreen (see `playWithSound`), coming back OUT of fullscreen is now the
  // ordinary path rather than a corner case, and a visitor who paused before
  // leaving fullscreen would land on an inline frame with no controls at all
  // and no way to resume. Exiting fullscreen must never take playback away from
  // her, and that includes the means to restart it.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onChange = () => {
      video.controls = document.fullscreenElement === video || started;
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, [started]);

  // Track real playback state rather than assuming it, so the control's label
  // is never a lie — the browser can pause the clip on its own (backgrounded
  // tab, Low Power Mode, the end of a non-looping play).
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const sync = () => setPlaying(!video.paused && !video.ended);
    sync();
    video.addEventListener("play", sync);
    video.addEventListener("pause", sync);
    video.addEventListener("ended", sync);
    return () => {
      video.removeEventListener("play", sync);
      video.removeEventListener("pause", sync);
      video.removeEventListener("ended", sync);
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
   * standard method is missing.
   */
  function enterFullscreen() {
    const video = videoRef.current as FullscreenVideo | null;
    if (!video) return;
    try {
      if (video.requestFullscreen) {
        void video.requestFullscreen().catch(() => {
          try {
            video.webkitEnterFullscreen?.();
          } catch {
            /* No fullscreen here. The clip still plays inline. */
          }
        });
      } else {
        video.webkitEnterFullscreen?.();
      }
    } catch {
      /* Same: fullscreen is a bonus, never a precondition. */
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
   * This is MessageVideo's `playWithSound`, not a second state machine: same
   * four mutations in the same order, same muted retry when a browser still
   * refuses audio, same one-way `started` latch (the pill does not come back
   * when the clip ends, and a second tap goes to fullscreen like any other tap
   * on a started clip).
   *
   * ── AND IT ALSO GOES FULLSCREEN (Daniel, 2026-07-31) ──
   * *"Pressing on the video and the Hero Video won't make it full screen on the
   * first press. It will just make the audio play. We want to also make it full
   * screen."* So the ONE press does both. The order below is deliberate:
   * playback is asked for first and fullscreen last, so that if the expand is
   * refused — an embedded context, a desktop Safari quirk, a headless browser —
   * she still gets the sound, which is the part that carries her meaning. The
   * corner "מסך מלא" button is unchanged and still works on its own.
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
    video.controls = true;
    video.currentTime = 0;
    void video.play().catch(() => {
      // Some browsers still refuse audio without a more direct gesture. At
      // least keep something playing rather than freezing on a still.
      video.muted = true;
      void video.play();
    });
    enterFullscreen();
    setStarted(true);
  }

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
    // HeroSection), so the frame takes the column: 3xl from `sm`, 5xl from `lg`.
    // The phone cap stays where it was, because there the fold is the
    // constraint and 16:9 at full width is already 195px tall.
    <div className="relative mx-auto w-full max-w-[21.5rem] sm:max-w-2xl lg:max-w-4xl">
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

      <div className="ring-shine relative overflow-hidden rounded-[2rem] border border-foreground/[0.08] bg-surface-1 p-2 shadow-[0_36px_80px_-40px_var(--shadow-strong)]">
        {/* This used to carry `data-fab-avoid`, which made the floating WhatsApp
            button fade out whenever this frame was on screen. That is gone — see
            the header of floating-whatsapp.tsx. The collision it was avoiding is
            now solved by where the pause button sits (just below). */}
        <div className="relative aspect-video overflow-hidden rounded-[1.6rem] bg-foreground">
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
              // Brightness is held just under 1 so the sharp clip in front is
              // still the brighter thing, and saturation is up so the fill
              // carries the frame's warmth out to the edges instead of greying.
              className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover blur-[44px] brightness-[0.82] saturate-[1.35]"
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
              onClick={started ? expand : playWithSound}
              // `cursor-pointer`, NOT `cursor-zoom-in`: the zoom cursor renders
              // as a magnifying glass with a plus in it, which is a photo-viewer
              // affordance and reads as "inspect this woman's face". A play/
              // expand surface is a plain pointer. Same in message-video.tsx —
              // keep the two matched.
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
              className="absolute inset-0 h-full w-full cursor-pointer object-contain"
            >
              <source src={VIDEO_SRC} type="video/mp4" />
            </video>
          ) : null}

          {/* ── "הפעלה עם קול", the /about clip's control, now on the hero ──
              Rendered BEFORE the two corner buttons on purpose: they are all
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
              class came off the floating WhatsApp button for the same reason). */}
          {ready && !started ? (
            <button
              type="button"
              onClick={playWithSound}
              aria-label={t("playWithSoundAria")}
              className="group absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-black/10 via-black/20 to-black/35 transition-colors hover:from-black/20 hover:to-black/45"
            >
              <span className="relative flex h-18 w-18 items-center justify-center rounded-full bg-brand-deep text-white shadow-[0_12px_44px_-6px_rgba(90,63,43,0.9)] transition-transform duration-300 group-hover:scale-110">
                <Play className="relative ms-1 h-7 w-7 fill-current" />
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-4 py-1.5 text-sm font-medium text-white backdrop-blur">
                <Volume2 className="h-4 w-4 shrink-0 text-gold" />
                {t("playWithSound")}
              </span>
            </button>
          ) : null}

          {ready ? (
            <>
              {/* WCAG 2.2.2: anything that moves for more than five seconds
                  needs a way to stop it, and this clip is a minute long and
                  starts on its own. Always visible — not a hover-reveal, which
                  is unreachable on the phones most of these visitors are
                  holding.

                  ── BOTH CONTROLS LIVE ON THE TOP EDGE, AND THAT IS
                  LOAD-BEARING (2026-07-30) ──
                  They sat at `bottom-3 start-3` and `bottom-3 end-3` until
                  Daniel's launch review. The site has TWO bottom-pinned floating
                  buttons — WhatsApp at the viewport's bottom-inline-start,
                  the accessibility launcher at bottom-inline-end — and at
                  390x844 this clip's bottom corners collided with both: 12px
                  into the WhatsApp button, and a measured 17x8px into the
                  accessibility launcher. The old answer was to make the WhatsApp
                  button hide itself whenever this clip was on screen, i.e. hide
                  it at the top of the home page; Daniel asked for both floating
                  buttons to simply always show.
                  So the controls moved instead of the buttons. The top edge is
                  the one place a bottom-pinned FAB can never reach, and on these
                  9:16 clips it is the better edge anyway — the burned-in captions
                  sit along the bottom.
                  Keep both of these out of the bottom corners. */}
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? t("pause") : t("play")}
                className="absolute top-3 start-3 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 bg-black/60 text-white backdrop-blur transition-colors hover:border-white/30 hover:bg-black/75"
              >
                {playing ? (
                  <Pause className="h-3.5 w-3.5 fill-current" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-current" />
                )}
              </button>

              <button
                type="button"
                onClick={expand}
                aria-label={t("fullscreenAria")}
                // `top-3 end-3` — the opposite corner of the SAME (top) edge as
                // the pause button. See the note above for why neither of these
                // may sit at the bottom. h-11 matches the pause button; both
                // were h-9 (36px), under the 44px touch minimum.
                className="absolute top-3 end-3 inline-flex h-11 items-center gap-2 rounded-lg border border-white/15 bg-black/60 px-3 text-xs font-medium text-white backdrop-blur transition-colors hover:border-white/30 hover:bg-black/75"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                {t("fullscreen")}
              </button>
            </>
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
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-brand/30 bg-surface-1/70 font-display text-[1.92rem] text-brand-accent shadow-card sm:h-14 sm:w-14 sm:text-[2.2rem]"
      >
        {siteConfig.monogram}
      </span>
      <div className="min-w-0 text-start">
        <p className="font-display text-[2.13rem] leading-tight text-foreground sm:text-[2.56rem]">
          {siteConfig.name}
        </p>
        <p className="mt-1 hidden text-sm leading-normal text-muted-foreground sm:block">
          {t("posterNote")}
        </p>
      </div>
    </div>
  );
}
