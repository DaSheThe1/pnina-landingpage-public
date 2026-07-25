"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Play, Volume2 } from "lucide-react";

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
 */
export function MessageVideo({
  src,
  poster,
  labels,
  trackAs,
  className,
}: {
  src: string | null;
  poster?: string;
  labels: MessageVideoLabels;
  /** Analytics event fired once, on the first play-with-sound. */
  trackAs?: AnalyticsEvent;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const trackedRef = useRef(false);

  // Fullscreen shows the whole 9:16 clip with black bars, not a cropped zoom.
  useFullscreenLetterbox(videoRef);

  // `canplay` can fire before hydration attaches a React listener (the video
  // starts loading with the SSR HTML), so check readyState on mount too.
  useEffect(() => {
    if (!src) return;
    const video = videoRef.current;
    if (!video) return;
    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      setReady(true);
      return;
    }
    const onCanPlay = () => setReady(true);
    video.addEventListener("canplay", onCanPlay);
    return () => video.removeEventListener("canplay", onCanPlay);
  }, [src]);

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
        className="pointer-events-none absolute -inset-x-6 -top-8 bottom-0 rounded-[3rem] bg-brand/18 blur-[80px] sm:-inset-x-14"
      />

      <div className="ring-shine relative overflow-hidden rounded-[2rem] border border-foreground/[0.08] bg-surface-1 p-2 shadow-[0_36px_80px_-40px_rgba(38,20,31,0.5)]">
        <div className="relative aspect-[9/16] overflow-hidden rounded-[1.6rem] bg-foreground">
          {src ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              poster={poster}
              preload="metadata"
              onClick={started ? undefined : playWithSound}
              className={cn(
                "absolute inset-0 h-full w-full object-cover",
                ready && !started && "cursor-pointer"
              )}
            >
              <source src={src} type="video/mp4" />
            </video>
          ) : null}

          {!ready ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-gradient-to-b from-surface-2 via-brand-wash to-surface-1">
              <span className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-brand/25 bg-white/70 text-brand-accent">
                {src ? (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-2xl bg-brand-accent/20" />
                ) : null}
                <Play className="relative h-7 w-7 fill-current" />
              </span>
              <p className="relative max-w-xs px-6 text-center text-sm leading-6 text-muted-foreground">
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
              <span className="relative flex h-18 w-18 items-center justify-center rounded-full bg-brand-deep text-white shadow-[0_12px_44px_-6px_rgba(138,31,88,0.9)] transition-transform duration-300 group-hover:scale-110">
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
              className="absolute bottom-3 end-3 inline-flex h-9 items-center gap-2 rounded-lg border border-white/15 bg-black/60 px-3 text-xs font-medium text-white backdrop-blur transition-colors hover:border-white/30 hover:bg-black/75"
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
