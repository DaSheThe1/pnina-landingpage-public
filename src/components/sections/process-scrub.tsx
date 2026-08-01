"use client";

/**
 * The pearl process journey.
 *
 * Native document scroll is the only navigation mechanism here. The component
 * never cancels a touch/wheel event, locks the body or installs root scroll
 * snap. After a phone gesture and its momentum have completely ended, it may
 * settle the copy to one adjacent station; a new touch cancels that settle.
 *
 * The visible story is also independent from the media:
 *
 * - step 1 is in the server HTML and visible before hydration;
 * - one translucent dark panel keeps readable copy over a visible film;
 * - the stage has a local first-frame poster before the video is ready;
 * - a failed or late video changes neither the copy nor the section geometry.
 *
 * The old phone runtime decoded a window of WebP frames into ImageBitmaps. Its
 * nominal mobile ceiling was 80 MB plus five concurrent decodes, enough for
 * WebKit to evict nearby text/background compositor tiles on a real iPhone.
 * This process-only runtime uses one short-GOP H.264 file instead. Safari owns
 * its small decoder buffer, seeks are coalesced, and the poster stays visible
 * until a requested video frame has actually painted.
 */

import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";

import { prefersReducedMotion } from "@/lib/eval-flags";

const STATIONS = 4;
const MOBILE_QUERY = "(max-width: 640px)";
const LOAD_MARGIN = "300% 0px";
const SEEK_EPSILON_SECONDS = 0.055;
const COPY_HOLD_START = 0.34;
const COPY_HOLD_END = 0.66;
const SETTLE_IDLE_MS = 180;
const SETTLE_TOLERANCE_PX = 3;
const TOUCH_INTENT_VIEWPORT_RATIO = 0.06;
const TOUCH_INTENT_MIN_PX = 42;
const TOUCH_INTENT_MAX_PX = 64;

const PROCESS_MEDIA = {
  mobile: {
    src: "/motion/pearl/process-mobile.mp4",
  },
  desktop: {
    src: "/motion/pearl/process-desktop.mp4",
  },
} as const;

/**
 * The phone overlay is the concise visual edition. The complete approved copy
 * remains in the screen-reader story, the static-card rendering and the
 * desktop overlay. These omissions only reduce how much of the pearl a 390px
 * viewport has to cover.
 */
const MOBILE_OMITTED_LINES = new Set(["1:1", "2:3", "3:1"]);

type ProcessCopy = { title: string; lines: string[] };
type TouchGesture = {
  startScrollY: number;
  startStation: number;
};

export type ProcessScrubProps = {
  enabled: boolean;
};

type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: () => void) => number;
};

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));

/**
 * Give each step a long readable rest, then use the middle third of the next
 * viewport to move the copy rail. This is a position mapping, not a clock:
 * skipped rendering frames can only land on a later correct scroll state.
 */
const copyPositionAt = (position: number) => {
  const from = Math.min(STATIONS - 1, Math.max(0, Math.floor(position)));
  if (from === STATIONS - 1) return from;
  const local = position - from;
  const travel = clamp(
    (local - COPY_HOLD_START) / (COPY_HOLD_END - COPY_HOLD_START)
  );
  const eased = travel * travel * (3 - 2 * travel);
  return from + eased;
};

export function ProcessScrub({ enabled }: ProcessScrubProps) {
  const t = useTranslations("process");
  const steps = t.raw("steps") as ProcessCopy[];
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const copyRailRef = useRef<HTMLDivElement>(null);
  const whereRef = useRef<HTMLSpanElement>(null);
  const desiredProgressRef = useRef(0);
  const seekRef = useRef<(progress: number) => void>(() => undefined);

  const stationLabels = useMemo(
    () =>
      Array.from({ length: STATIONS }, (_, index) =>
        t("progress", { current: index + 1, total: STATIONS })
      ),
    [t]
  );

  /**
   * Media lifecycle.
   *
   * URLs live in this effect rather than in <video> markup, so Save-Data and
   * the site's accessibility switch still perform zero video requests. One
   * selected file begins when the process comes within three viewports. That is
   * early enough for an ordinary reading pace without putting process media on
   * the initial document/hero critical path.
   */
  useEffect(() => {
    const track = trackRef.current;
    const video = videoRef.current as VideoWithFrameCallback | null;
    if (!enabled || !track || !video) return;
    if (prefersReducedMotion()) return;
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    if (connection?.saveData === true) return;

    let disposed = false;
    let started = false;
    let sourceKey = "";
    let metadataReady = false;
    let frameReady = false;
    let seeking = false;
    let pendingTime = 0;

    const selectedMedia = () =>
      window.matchMedia(MOBILE_QUERY).matches
        ? PROCESS_MEDIA.mobile
        : PROCESS_MEDIA.desktop;

    const markPainted = () => {
      if (disposed || frameReady) return;
      const finish = () => {
        if (disposed) return;
        frameReady = true;
        video.dataset.ready = "";
        track.dataset.processMediaReady = "true";
      };
      if (video.requestVideoFrameCallback) {
        video.requestVideoFrameCallback(finish);
      } else {
        window.requestAnimationFrame(() =>
          window.requestAnimationFrame(finish)
        );
      }
    };

    const requestSeek = () => {
      if (
        disposed ||
        !metadataReady ||
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        !Number.isFinite(video.duration) ||
        video.duration <= 0
      ) {
        return;
      }

      const playableEnd = Math.max(0, video.duration - 0.04);
      pendingTime = desiredProgressRef.current * playableEnd;
      if (seeking) return;
      if (
        Math.abs(video.currentTime - pendingTime) <
        SEEK_EPSILON_SECONDS
      ) {
        markPainted();
        return;
      }

      seeking = true;
      try {
        video.currentTime = pendingTime;
      } catch {
        seeking = false;
      }
    };

    seekRef.current = (progress) => {
      desiredProgressRef.current = clamp(progress);
      requestSeek();
    };

    const onLoadedMetadata = () => {
      metadataReady = true;
      requestSeek();
    };
    const onLoadedData = () => {
      metadataReady = true;
      requestSeek();
      if (!video.seeking) markPainted();
    };
    const onSeeked = () => {
      seeking = false;
      markPainted();
      const playableEnd = Math.max(0, video.duration - 0.04);
      const latest = desiredProgressRef.current * playableEnd;
      if (Math.abs(video.currentTime - latest) >= SEEK_EPSILON_SECONDS) {
        requestSeek();
      }
    };
    const onError = () => {
      seeking = false;
      metadataReady = false;
      frameReady = false;
      delete video.dataset.ready;
      delete track.dataset.processMediaReady;
      track.dataset.processMediaFailed = "true";
    };

    const loadSelectedSource = () => {
      if (!started || disposed) return;
      const selected = selectedMedia();
      if (sourceKey === selected.src) return;

      sourceKey = selected.src;
      metadataReady = false;
      frameReady = false;
      seeking = false;
      delete video.dataset.ready;
      delete track.dataset.processMediaReady;
      delete track.dataset.processMediaFailed;
      video.pause();
      video.src = selected.src;
      video.load();
    };

    const start = () => {
      if (started || disposed) return;
      started = true;
      loadSelectedSource();
    };

    const observer =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver(
            (entries) => {
              if (!entries.some((entry) => entry.isIntersecting)) return;
              start();
              observer?.disconnect();
            },
            { rootMargin: LOAD_MARGIN }
          )
        : null;

    const mediaQuery = window.matchMedia(MOBILE_QUERY);
    const onCutChange = () => loadSelectedSource();
    const onFirstGesture = () => {
      start();
      if (video.readyState < HTMLMediaElement.HAVE_METADATA) return;
      const attempt = video.play();
      if (attempt) {
        attempt.then(() => video.pause()).catch(() => undefined);
      } else {
        video.pause();
      }
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    mediaQuery.addEventListener("change", onCutChange);
    window.addEventListener("touchstart", onFirstGesture, {
      once: true,
      passive: true,
    });
    window.addEventListener("pointerdown", onFirstGesture, {
      once: true,
      passive: true,
    });

    if (observer) observer.observe(track);
    else start();

    return () => {
      disposed = true;
      observer?.disconnect();
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      mediaQuery.removeEventListener("change", onCutChange);
      window.removeEventListener("touchstart", onFirstGesture);
      window.removeEventListener("pointerdown", onFirstGesture);
      seekRef.current = () => undefined;
      video.pause();
      video.removeAttribute("src");
      video.load();
      delete video.dataset.ready;
      delete track.dataset.processMediaReady;
      delete track.dataset.processMediaFailed;
    };
  }, [enabled]);

  /**
   * Scroll lifecycle. Native scrolling writes one continuous progress value;
   * text transforms and a coalesced video seek catch up on the next animation
   * frame.
   *
   * Phones settle only AFTER native scrolling has finished. A touch that moves
   * a modest document distance asks for exactly one adjacent station in its
   * direction, so a slow thumb drag works just as reliably as a quick flick.
   * Tiny movements and non-touch scrolling settle to the nearest station.
   * `scrollend` is the precise path; a quiet scroll timer covers older Safari.
   * All touch/wheel listeners are passive lifecycle signals only: there is no
   * preventDefault, scroll lock, snap container or queued destination.
   */
  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    const copyRail = copyRailRef.current;
    if (!enabled || !track || !stage || !copyRail) return;

    /*
     * The sections beside the process must never be waiting on a reveal as the
     * opaque stage uncovers them. Release those one-time decorations for the
     * rest of the visit; their content is already server-rendered.
     */
    const processSection = track.closest("#process");
    const neighboringReveals = [
      processSection?.previousElementSibling,
      processSection?.nextElementSibling,
    ].flatMap((section) =>
      section
        ? [...section.querySelectorAll<HTMLElement>("[data-reveal]")]
        : []
    );
    neighboringReveals.forEach((reveal) =>
      reveal.setAttribute("data-reveal-off", "")
    );

    let disposed = false;
    let animationFrame = 0;
    let lastProgress = -1;
    let settleTimer = 0;
    let settlingTarget: number | null = null;
    let touchActive = false;
    let touchGesture: TouchGesture | null = null;
    const phoneQuery = window.matchMedia(MOBILE_QUERY);
    track.dataset.processController = "ready";

    const readGeometry = () => {
      const rect = track.getBoundingClientRect();
      const stageHeight = Math.max(
        1,
        stage.getBoundingClientRect().height
      );
      const travel = Math.max(1, rect.height - stageHeight);
      return {
        rawProgress: -rect.top / travel,
        trackTop: window.scrollY + rect.top,
        travel,
      };
    };

    const isWithinJourney = (
      geometry: ReturnType<typeof readGeometry>
    ) => {
      const progressTolerance =
        SETTLE_TOLERANCE_PX / geometry.travel;
      return (
        geometry.rawProgress >= -progressTolerance &&
        geometry.rawProgress <= 1 + progressTolerance
      );
    };

    const clearSettlingState = () => {
      settlingTarget = null;
      delete track.dataset.processSettling;
    };

    const scheduleSettling = () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(onScrollComplete, SETTLE_IDLE_MS);
    };

    const beginSettle = (
      station: number,
      geometry = readGeometry()
    ) => {
      const targetProgress = station / (STATIONS - 1);
      const targetY =
        geometry.trackTop + targetProgress * geometry.travel;

      if (Math.abs(window.scrollY - targetY) <= SETTLE_TOLERANCE_PX) {
        clearSettlingState();
        return;
      }

      settlingTarget = targetY;
      track.dataset.processSettling = String(station + 1);
      window.scrollTo({ top: targetY, behavior: "smooth" });
    };

    const settleAfterCompletedScroll = (
      gesture: TouchGesture | null
    ) => {
      if (
        disposed ||
        touchActive ||
        !phoneQuery.matches ||
        document.visibilityState !== "visible"
      ) {
        return;
      }

      const geometry = readGeometry();

      if (gesture) {
        const distance = window.scrollY - gesture.startScrollY;
        const intentThreshold = clamp(
          window.innerHeight * TOUCH_INTENT_VIEWPORT_RATIO,
          TOUCH_INTENT_MIN_PX,
          TOUCH_INTENT_MAX_PX
        );
        if (Math.abs(distance) >= intentThreshold) {
          const direction = distance > 0 ? 1 : -1;
          const leavingFromFirst =
            gesture.startStation === 0 && direction < 0;
          const leavingFromLast =
            gesture.startStation === STATIONS - 1 && direction > 0;
          const completedReverseExit =
            gesture.startStation === STATIONS - 1 &&
            direction < 0 &&
            geometry.rawProgress < 0 &&
            !isWithinJourney(geometry);

          /*
           * A gesture that STARTS at an endpoint and points out of the process
           * belongs entirely to the page. Every other deliberate phone gesture
           * advances one station at most, even if the browser gives a fast flick
           * enough momentum to travel farther.
           *
           * One completed-story exception is equally deliberate: if a reverse
           * gesture starts on step 4 and native momentum finishes above the
           * WHOLE journey, do not pull the visitor back down to step 3. A short
           * reverse gesture still finishes inside and therefore moves one step.
           */
          if (
            leavingFromFirst ||
            leavingFromLast ||
            completedReverseExit
          ) {
            clearSettlingState();
            return;
          }

          beginSettle(
            clamp(
              gesture.startStation + direction,
              0,
              STATIONS - 1
            ),
            geometry
          );
          return;
        }
      }

      /*
       * Outside the sticky journey, native page scroll is untouchable. The
       * endpoints themselves remain legal targets, so a partial release near
       * step 1 or 4 may finish that step; a fresh outward gesture still exits.
       */
      if (!isWithinJourney(geometry)) {
        clearSettlingState();
        return;
      }

      const progress = clamp(geometry.rawProgress);
      const nearestStation = Math.round(progress * (STATIONS - 1));
      beginSettle(nearestStation, geometry);
    };

    function onScrollComplete() {
      window.clearTimeout(settleTimer);
      if (disposed) return;
      if (touchActive) return;

      if (settlingTarget !== null) {
        const reached =
          Math.abs(window.scrollY - settlingTarget) <=
          SETTLE_TOLERANCE_PX;
        if (reached) {
          clearSettlingState();
          return;
        }

        /*
         * Some engines may deliver a completion queued by the native gesture
         * immediately after our smooth settle begins. That stale event must not
         * replace the directional destination with the nearest intermediate
         * station. A fresh touch/wheel explicitly clears the target, and the
         * settle's own final scrollend clears it once the pixel is reached.
         */
        const geometry = readGeometry();
        if (isWithinJourney(geometry)) {
          return;
        }
        clearSettlingState();
      }

      const completedGesture = touchGesture;
      touchGesture = null;
      settleAfterCompletedScroll(completedGesture);
    }

    const onScroll = () => scheduleSettling();
    const onTouchStart = () => {
      /*
       * A second or third finger is part of the same gesture. It must not reset
       * the origin and turn one multi-touch scroll into several destinations.
       */
      if (touchActive) return;
      touchActive = true;
      window.clearTimeout(settleTimer);
      /*
       * A new finger owns the page immediately. If our own short smooth settle
       * is still running, an instant scroll to the CURRENT pixel aborts that
       * programmatic animation without moving or cancelling the user's touch.
       * This is not a station correction and never runs during native momentum
       * unless this component itself started the settle.
       */
      if (settlingTarget !== null) {
        window.scrollTo({ top: window.scrollY, behavior: "instant" });
      }
      clearSettlingState();
      const geometry = readGeometry();
      touchGesture =
        phoneQuery.matches && isWithinJourney(geometry)
          ? {
              startScrollY: window.scrollY,
              startStation: Math.round(
                clamp(geometry.rawProgress) * (STATIONS - 1)
              ),
            }
          : null;
    };
    const onTouchEnd = (event: TouchEvent) => {
      if (event.touches?.length > 0) return;
      touchActive = false;
      scheduleSettling();
    };
    const onTouchCancel = () => {
      touchActive = false;
      touchGesture = null;
      scheduleSettling();
    };
    const onWheel = () => {
      window.clearTimeout(settleTimer);
      touchGesture = null;
      clearSettlingState();
    };

    const render = () => {
      if (disposed) return;

      const rect = track.getBoundingClientRect();
      const stageHeight = Math.max(
        1,
        stage.getBoundingClientRect().height
      );
      const travel = Math.max(1, rect.height - stageHeight);
      const progress = clamp(-rect.top / travel);
      const position = progress * (STATIONS - 1);
      desiredProgressRef.current = progress;

      if (Math.abs(progress - lastProgress) > 0.0001) {
        const active = Math.min(
          STATIONS - 1,
          Math.max(0, Math.round(position))
        );
        const copyPosition = copyPositionAt(position);
        copyRail.style.transform = `translate3d(${
          (-copyPosition * 100) / STATIONS
        }%,0,0)`;
        track.dataset.processActiveStep = String(active + 1);
        track.dataset.processProgress = progress.toFixed(4);
        track.dataset.processCopyPosition = copyPosition.toFixed(4);
        if (whereRef.current) {
          whereRef.current.textContent = stationLabels[active];
        }

        seekRef.current(progress);
        lastProgress = progress;
      }

      const pinned = rect.top <= 1 && rect.bottom >= stageHeight - 1;
      track.dataset.processPinned = String(pinned);
      /*
       * Phones use local stacking for the stage, so asynchronous iOS scrolling
       * never waits for a root-level style change at either boundary. Wide
       * screens retain the existing header/background state.
       */
      document.documentElement.toggleAttribute(
        "data-scrub-pinned",
        pinned && window.matchMedia("(min-width: 768px)").matches
      );

      animationFrame = window.requestAnimationFrame(render);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("scrollend", onScrollComplete, {
      passive: true,
    });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchCancel, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    animationFrame = window.requestAnimationFrame(render);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(settleTimer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("scrollend", onScrollComplete);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchCancel);
      window.removeEventListener("wheel", onWheel);
      document.documentElement.removeAttribute("data-scrub-pinned");
      copyRail.style.transform = "translate3d(0,0,0)";
      delete track.dataset.processActiveStep;
      delete track.dataset.processProgress;
      delete track.dataset.processCopyPosition;
      delete track.dataset.processPinned;
      delete track.dataset.processSettling;
      delete track.dataset.processController;
    };
  }, [enabled, stationLabels]);

  return (
    <div
      ref={trackRef}
      data-process-track=""
      data-process-active-step="1"
      data-process-progress="0"
      className="process-scrub relative"
    >
      <h2 className="sr-only">{t("title")}</h2>

      {/* The complete story remains in reading order, independent of media. */}
      <ol className="sr-only">
        {steps.map((step, index) => (
          <li key={step.title}>
            <h3>
              {t("stepLabel")} {index + 1}: {step.title}
            </h3>
            {step.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </li>
        ))}
      </ol>

      <div
        ref={stageRef}
        className="process-scrub__stage sticky top-0 grid place-items-center overflow-hidden"
      >
        <div
          aria-hidden
          className="process-scrub__poster absolute inset-0"
        />

        <video
          ref={videoRef}
          aria-hidden
          muted
          playsInline
          preload="none"
          disablePictureInPicture
          className="process-scrub__video absolute inset-0 h-full w-full object-cover"
        />

        <div
          aria-hidden="true"
          data-process-copy-panel=""
          dir="ltr"
          className="scrub-copy absolute inset-x-[5%] top-4 overflow-hidden rounded-2xl border sm:inset-x-auto sm:right-[5%] sm:top-1/2 sm:w-[min(560px,44vw)] sm:-translate-y-1/2"
        >
          <div
            ref={copyRailRef}
            className="scrub-copy__rail flex"
            dir="ltr"
          >
            {steps.map((step, index) => (
              <div
                key={step.title}
                data-process-copy-step={index + 1}
                className="scrub-copy__slide shrink-0 p-4 text-start sm:p-6"
                dir="rtl"
              >
                <span className="scrub-copy__step mb-1.5 block text-base font-bold">
                  {t("stepLabel")} <span dir="ltr">{index + 1}</span>
                </span>
                <span
                  data-process-copy-title=""
                  className="mb-2 block text-xl font-bold leading-snug sm:text-2xl"
                >
                  {index === 1 ? (
                    <>
                      <span className="max-sm:hidden">{step.title}</span>
                      <span className="hidden max-sm:inline">
                        {t("mobileStepTwoTitle")}
                      </span>
                    </>
                  ) : (
                    step.title
                  )}
                </span>

                {step.lines.map((line, lineIndex) => (
                  <p
                    key={line}
                    data-process-copy-line={lineIndex + 1}
                    className={
                      MOBILE_OMITTED_LINES.has(`${index}:${lineIndex}`)
                        ? "mb-1.5 text-sm leading-relaxed max-sm:hidden sm:text-base"
                        : "mb-1.5 text-sm leading-relaxed sm:text-base"
                    }
                  >
                    {line}
                  </p>
                ))}
                {index === STATIONS - 1 ? (
                  <p
                    data-process-copy-endpoint=""
                    className="mt-2 text-xs italic opacity-80 max-sm:hidden sm:text-sm"
                  >
                    {t("endpoint")}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="scrub-pill pointer-events-none absolute inset-x-0 bottom-[4.5%] grid place-items-center gap-0.5 text-white">
          <span
            ref={whereRef}
            className="rounded-full bg-brand-deep/95 px-4 py-1.5 text-sm font-semibold shadow-card"
          >
            {stationLabels[0]}
          </span>
          <span className="scrub-arrow text-lg" aria-hidden>
            ▼
          </span>
        </div>
      </div>
    </div>
  );
}
