"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Maximize2, Pause, Play } from "lucide-react";

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
  const siteMotionChoiceReduced = usePrefersReducedMotion();
  const userControlledRef = useRef(false);
  // Fire the "watched" analytics event at most once per mount, so repeated
  // expand clicks don't spam the tracker.
  const trackedRef = useRef(false);

  // Fullscreen shows the whole 9:16 clip with black bars, not a cropped zoom.
  useFullscreenLetterbox(videoRef);

  // `canplay` can fire before hydration attaches a React listener (the video
  // starts loading with the SSR HTML), so check readyState on mount too.
  useEffect(() => {
    if (!VIDEO_SRC) return;
    const video = videoRef.current;
    if (!video) return;
    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      setReady(true);
      return;
    }
    const onCanPlay = () => setReady(true);
    video.addEventListener("canplay", onCanPlay);
    return () => video.removeEventListener("canplay", onCanPlay);
  }, []);

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
  // Playback is still started HERE rather than with an `autoplay` attribute, so
  // that a refusal is something we can handle: iOS Low Power Mode and strict
  // autoplay policies reject the promise, and in that case we fall back to the
  // poster and mark the frame ready off `loadedmetadata` — otherwise it would
  // sit on the branded placeholder forever and the play control, which is gated
  // on `ready`, would never render for the visitor to press.
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
      const onMeta = () => setReady(true);
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) onMeta();
      else video.addEventListener("loadedmetadata", onMeta);
      return () => video.removeEventListener("loadedmetadata", onMeta);
    }

    // Already playing because she pressed play herself: never restart it.
    if (userControlledRef.current) return;

    let cleanup: (() => void) | undefined;

    void video.play().catch(() => {
      // `canplay` needs readyState >= HAVE_FUTURE_DATA, which with
      // preload="metadata" only arrives once something asks the clip to play.
      // Nothing will now, so treat "metadata is in" as ready.
      const onMeta = () => setReady(true);
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) onMeta();
      else {
        video.addEventListener("loadedmetadata", onMeta);
        cleanup = () => video.removeEventListener("loadedmetadata", onMeta);
      }
    });

    return () => cleanup?.();
  }, [siteMotionChoiceReduced]);

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
    const video = videoRef.current as FullscreenVideo | null;
    if (!video) return;
    if (!trackedRef.current) {
      trackedRef.current = true;
      trackEvent("hero_video_watch");
    }
    if (video.requestFullscreen) {
      void video.requestFullscreen();
    } else if (video.webkitEnterFullscreen) {
      video.webkitEnterFullscreen();
    }
  }

  return (
    // The clip is a vertical 9:16 phone recording, so the frame is a phone.
    // A portrait video inside the 16:9 frame this used to be either pillarboxed
    // into two grey bars or cropped her head off — neither is acceptable when
    // the video IS the introduction. Capped narrow so it doesn't tower over the
    // hero copy on a desktop screen.
    <div className="relative mx-auto w-full max-w-[19rem] sm:max-w-[21rem]">
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
        <div className="relative aspect-[9/16] overflow-hidden rounded-[1.6rem] bg-foreground">
          {/* The branded poster panel sits underneath and shows whenever no
              video can play: no video supplied yet, a slow connection, or a
              blocked autoplay. It is designed to look deliberate rather than
              broken, so the page is presentable at every stage. */}
          {!ready ? <HeroPoster /> : null}

          {VIDEO_SRC ? (
            <video
              ref={videoRef}
              // No `autoPlay` attribute — playback is started in an effect so a
              // refusal (Low Power Mode) has somewhere to be handled, and so the
              // accessibility panel's motion switch can veto it. See the effect
              // above.
              muted
              loop
              playsInline
              poster={POSTER}
              preload="metadata"
              onClick={expand}
              // `cursor-pointer`, NOT `cursor-zoom-in`: the zoom cursor renders
              // as a magnifying glass with a plus in it, which is a photo-viewer
              // affordance and reads as "inspect this woman's face". A play/
              // expand surface is a plain pointer. Same in message-video.tsx —
              // keep the two matched.
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                ready ? "cursor-pointer opacity-100" : "opacity-0"
              }`}
            >
              <source src={VIDEO_SRC} type="video/mp4" />
            </video>
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
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-surface-2 via-brand-wash to-surface-1 px-6 text-center">
      <span
        aria-hidden
        className="flex h-16 w-16 items-center justify-center rounded-full border border-brand/30 bg-surface-1/70 font-display text-[1.7rem] text-brand-accent shadow-card"
      >
        {siteConfig.monogram}
      </span>
      <p className="font-display text-[1.45rem] text-foreground sm:text-[1.7rem]">
        {siteConfig.name}
      </p>
      <p className="max-w-sm text-sm leading-6 text-muted-foreground">
        {t("posterNote")}
      </p>
    </div>
  );
}
