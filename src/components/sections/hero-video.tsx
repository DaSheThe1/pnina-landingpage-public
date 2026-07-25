"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Maximize2 } from "lucide-react";

import { trackEvent } from "@/lib/analytics";
import { siteConfig } from "@/config/site";
import { useFullscreenLetterbox } from "@/lib/use-fullscreen-letterbox";
import { videoSrc, videos } from "@/content/media";

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
const POSTER = videos.hero.poster;

export function HeroVideo() {
  const t = useTranslations("heroVideo");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
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
        className="pointer-events-none absolute -inset-x-12 top-1/3 bottom-0 rounded-[3rem] bg-teal/15 blur-[80px]"
      />

      <div className="ring-shine relative overflow-hidden rounded-[2rem] border border-foreground/[0.08] bg-surface-1 p-2 shadow-[0_36px_80px_-40px_rgba(38,20,31,0.5)]">
        <div className="relative aspect-[9/16] overflow-hidden rounded-[1.6rem] bg-foreground">
          {/* The branded poster panel sits underneath and shows whenever no
              video can play: no video supplied yet, a slow connection, or a
              blocked autoplay. It is designed to look deliberate rather than
              broken, so the page is presentable at every stage. */}
          {!ready ? <HeroPoster /> : null}

          {VIDEO_SRC ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              poster={POSTER}
              preload="metadata"
              onClick={expand}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                ready ? "cursor-zoom-in opacity-100" : "opacity-0"
              }`}
            >
              <source src={VIDEO_SRC} type="video/mp4" />
            </video>
          ) : null}

          {ready ? (
            <button
              type="button"
              onClick={expand}
              aria-label={t("fullscreenAria")}
              className="absolute bottom-3 end-3 inline-flex h-9 items-center gap-2 rounded-lg border border-white/15 bg-black/60 px-3 text-xs font-medium text-white backdrop-blur transition-colors hover:border-white/30 hover:bg-black/75"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              {t("fullscreen")}
            </button>
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
        className="flex h-16 w-16 items-center justify-center rounded-full border border-brand/30 bg-white/70 font-display text-2xl text-brand-accent shadow-card"
      >
        {siteConfig.monogram}
      </span>
      <p className="font-display text-xl text-foreground sm:text-2xl">
        {siteConfig.name}
      </p>
      <p className="max-w-sm text-sm leading-6 text-muted-foreground">
        {t("posterNote")}
      </p>
    </div>
  );
}
