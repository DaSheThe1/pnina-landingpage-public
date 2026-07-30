"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Play, Volume2 } from "lucide-react";

import { usePrefersReducedMotion } from "@/components/motion/use-reduced-motion";
import { trackEvent, type AnalyticsEvent } from "@/lib/analytics";
import { useFullscreenLetterbox } from "@/lib/use-fullscreen-letterbox";
import { cn } from "@/lib/utils";

// iOS Safari has no Element.requestFullscreen — videos expand through the
// native player via this vendor method instead.
type FullscreenVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
};

export type MessageVideoLabels = {
  playWithSound: string;
  playAria: string;
  loading: string;
  noVideoNote: string;
  fullscreen: string;
  fullscreenAria: string;
  /** Optional chip pinned to the frame's top corner. */
  hint?: string;
  /**
   * Name shown in the browser's subtitle menu, e.g. "עברית". Only meaningful
   * alongside a `captions` src. Left unset for now: `<track>` without a label
   * still works (the UA falls back to the language), and inventing a message
   * key before a single caption file exists is copy nobody has approved.
   */
  captionsLabel?: string;
};

/**
 * A vertical, click-to-play video of Pnina speaking.
 *
 * Every clip she has is a 9:16 phone recording, so the frame is a phone: the
 * landscape "browser window" frame this replaced pillarboxed a portrait video
 * into two thick black bars either side of her.
 *
 * Playback is deliberately two-stage. Until the first tap the clip loops muted,
 * because browsers block autoplay with sound and a silent still frame reads as
 * broken. The first tap restarts it from zero with sound, unmuted and once
 * through, which is the only way to actually hear what she is saying.
 *
 * `src: null` is a fully supported state and renders a quiet poster panel with
 * no <video> element mounted at all — pointing a <video> at a file that does
 * not exist makes every visitor's browser issue a failing request on load.
 *
 * CAPTIONS. `captions` takes a WebVTT URL and is `null`/undefined everywhere
 * today, which mounts no `<track>` at all — the same reasoning as `src: null`,
 * since a `<track>` pointing at a missing .vtt makes the browser fetch and fail
 * on every load. The hero clip carries burnt-in Hebrew captions in the picture,
 * but the /about clip is a long spoken piece with none, so a Deaf or
 * hard-of-hearing visitor currently gets nothing from it. The transcript is
 * owed by Pnina (docs/12 §C); once it exists the VTT drops into
 * `public/video/` and `captions` in src/content/media.ts points at it. Nothing
 * else has to change.
 */
export function MessageVideo({
  src,
  poster,
  captions,
  labels,
  trackAs,
  className,
}: {
  src: string | null;
  poster?: string;
  /** WebVTT URL. `null` mounts no <track>. See the note above. */
  captions?: string | null;
  labels: MessageVideoLabels;
  /** Analytics event fired once, on the first play-with-sound. */
  trackAs?: AnalyticsEvent;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const trackedRef = useRef(false);
  const shouldReduceMotion = usePrefersReducedMotion();

  // Fullscreen shows the whole 9:16 clip with black bars, not a cropped zoom.
  useFullscreenLetterbox(videoRef);

  // `canplay` can fire before hydration attaches a React listener (the video
  // starts loading with the SSR HTML), so check readyState on mount too.
  useEffect(() => {
    if (!src) return;
    const video = videoRef.current;
    if (!video) return;
    const readyState = shouldReduceMotion
      ? HTMLMediaElement.HAVE_METADATA
      : HTMLMediaElement.HAVE_FUTURE_DATA;
    const readyEvent = shouldReduceMotion ? "loadedmetadata" : "canplay";

    if (video.readyState >= readyState) {
      setReady(true);
      return;
    }
    const onCanPlay = () => setReady(true);
    video.addEventListener(readyEvent, onCanPlay);
    return () => video.removeEventListener(readyEvent, onCanPlay);
  }, [shouldReduceMotion, src]);

  // The silent preview is decorative autoplay. Keep the manual play-with-sound
  // control in every mode, but do not start or continue the preview when either
  // reduced-motion preference is active.
  useEffect(() => {
    if (!src || started) return;
    const video = videoRef.current;
    if (!video) return;

    if (shouldReduceMotion) {
      video.pause();
      return;
    }

    void video.play().catch(() => {
      /* A blocked preview leaves the poster and manual play control in place. */
    });
  }, [shouldReduceMotion, src, started]);

  // Native controls only once it is really playing, or while fullscreen —
  // inline and pre-play it stays a clean frame.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onChange = () => {
      video.controls =
        document.fullscreenElement === video || (started && !video.paused);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [started]);

  const playWithSound = () => {
    const video = videoRef.current;
    if (!video) return;
    if (trackAs && !trackedRef.current) {
      trackedRef.current = true;
      trackEvent(trackAs);
    }
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
    setStarted(true);
  };

  const expand = () => {
    const video = videoRef.current as FullscreenVideo | null;
    if (!video || !ready) return;
    if (video.requestFullscreen) {
      void video.requestFullscreen().catch(() => {
        video.webkitEnterFullscreen?.();
      });
    } else {
      video.webkitEnterFullscreen?.();
    }
  };

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[19rem] sm:max-w-[21rem]",
        className
      )}
    >
      <div
        aria-hidden
        // The bleed is narrower on a phone on purpose: at the full -inset-x-14
        // this halo is 416px wide inside a 390px viewport, and on /about (whose
        // section does not clip) that alone gave the page horizontal scroll.
        //
        // 18% → 10% in 0.12.1. `--brand` is a dark natural brown, so this halo is
        // the only DARKENING decorative layer on the site, and an 80px blur off a
        // `-top-8` edge carries it a long way up — far enough to sit behind the
        // line above it. On /thank-you that line is "הפרטים הגיעו אליי בלבד", the
        // site's tightest small-text pair, and the halo alone was costing it 0.44
        // of a contrast ratio before the sand photograph was anywhere near it
        // (4.94:1 without the halo, 4.50:1 with). At 10% the glow still reads as
        // light behind the phone and the pair clears AA with the sand under it.
        className="pointer-events-none absolute -inset-x-6 -top-8 bottom-0 rounded-[3rem] bg-brand/10 blur-[80px] sm:-inset-x-14"
      />

      <div className="ring-shine relative overflow-hidden rounded-[2rem] border border-foreground/[0.08] bg-surface-1 p-2 shadow-[0_36px_80px_-40px_var(--shadow-strong)]">
        <div className="relative aspect-[9/16] overflow-hidden rounded-[1.6rem] bg-foreground">
          {src ? (
            <video
              ref={videoRef}
              muted
              loop
              playsInline
              poster={poster}
              preload="metadata"
              // No download, no picture-in-picture, no playback-rate menu, and
              // no right-click "save video as" — Daniel's call for EVERY video
              // on the site (2026-07-30): this is her own footage about her own
              // assault and it is not ours to hand out copies of. The three-dot
              // overflow these remove belongs to the browser's native controls,
              // which this player turns on after the first play-with-sound, so
              // without them the download item is one tap away from every
              // visitor. Unconditional, so no future state can leak it back.
              // Matched in sections/hero-video.tsx — keep the two in step.
              controlsList="nodownload noplaybackrate noremoteplayback"
              disablePictureInPicture
              onContextMenu={(event) => event.preventDefault()}
              onClick={started ? undefined : playWithSound}
              className={cn(
                "absolute inset-0 h-full w-full object-cover",
                ready && !started && "cursor-pointer"
              )}
            >
              <source src={src} type="video/mp4" />
              {captions ? (
                <track
                  kind="captions"
                  src={captions}
                  srcLang="he"
                  label={labels.captionsLabel}
                  // `default` so captions are ON without the visitor hunting
                  // through a menu. On a site read on a phone, often quietly,
                  // sound-off is the normal case rather than the exception.
                  default
                />
              ) : null}
            </video>
          ) : null}

          {!ready ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-gradient-to-b from-surface-2 via-brand-wash to-surface-1">
              <span className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-brand/25 bg-surface-1/70 text-brand-accent">
                {src ? (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-2xl bg-brand-accent/20" />
                ) : null}
                <Play className="relative h-7 w-7 fill-current" />
              </span>
              <p className="relative max-w-xs px-6 text-center text-sm leading-normal text-muted-foreground">
                {src ? labels.loading : labels.noVideoNote}
              </p>
            </div>
          ) : null}

          {/* Big tap target before the first play: dimmed video + CTA. */}
          {ready && !started ? (
            <button
              type="button"
              onClick={playWithSound}
              aria-label={labels.playAria}
              className="group absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-black/25 via-black/35 to-black/60 transition-colors hover:from-black/35 hover:to-black/70"
            >
              <span className="relative flex h-18 w-18 items-center justify-center rounded-full bg-brand-deep text-white shadow-[0_12px_44px_-6px_rgba(90,63,43,0.9)] transition-transform duration-300 group-hover:scale-110">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand/40" />
                <Play className="relative ms-1 h-7 w-7 fill-current" />
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-4 py-1.5 text-sm font-medium text-white backdrop-blur">
                <Volume2 className="h-4 w-4 shrink-0 text-gold" />
                {labels.playWithSound}
              </span>
            </button>
          ) : null}

          {ready ? (
            <button
              type="button"
              onClick={expand}
              aria-label={labels.fullscreenAria}
              // TOP-inline-end, moved off `bottom-3 end-3` on 2026-07-30 for the
              // same reason as the hero clip's controls (the argument is written
              // out in hero-video.tsx): the accessibility launcher is fixed at
              // the viewport's bottom-inline-end corner, and this clip appears on
              // /about and /thank-you, so at some scroll position the two always
              // find each other. The top edge is out of reach of both
              // bottom-pinned floating buttons. h-11, not h-9 — 44px touch
              // minimum, matched to the hero clip's controls.
              className="absolute top-3 end-3 inline-flex h-11 items-center gap-2 rounded-lg border border-white/15 bg-black/60 px-3 text-xs font-medium text-white backdrop-blur transition-colors hover:border-white/30 hover:bg-black/75"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              {labels.fullscreen}
            </button>
          ) : null}

          <div className="pointer-events-none absolute inset-0 rounded-[1.6rem] ring-1 ring-inset ring-white/10" />
        </div>
      </div>

      {labels.hint ? (
        <div className="absolute -end-3 -top-4 hidden rotate-3 items-center gap-2 rounded-full border border-foreground/12 bg-surface-2/90 px-3 py-1.5 text-xs text-foreground-soft shadow-card backdrop-blur sm:flex">
          <Play className="h-3 w-3 fill-brand-accent text-brand-accent" />
          {labels.hint}
        </div>
      ) : null}
    </div>
  );
}
