"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import { frameUrl, loadSequenceImage } from "@/components/motion/sequence-source";
import { prefersReducedMotion } from "@/lib/eval-flags";

/**
 * Scroll-scrubbed image sequence — a sticky canvas stage inside a tall track,
 * where scroll position maps to a frame of a pre-rendered animation.
 *
 * The runtime spec this implements is docs/13-motion-asset-briefs.md §7, and the
 * frame layout it consumes is §5: frames live at
 * `<baseUrl>/f_001.webp … f_NNN.webp`, the reduced-motion still at
 * `<baseUrl>/final.webp`. Nothing here knows which sequence it is showing.
 *
 * ── IT MUST BE HARMLESS WITHOUT ITS ASSETS ──
 * At the time of writing, the frames DO NOT EXIST: they are AI-generated and
 * Daniel has not produced them yet. So the component probes for `f_001.webp`
 * with exactly ONE request on mount and, if it is not there, falls back to the
 * final still, and if that is missing too renders NOTHING — no error, no empty
 * 300vh scroll track, and above all not 90 failing requests. Renders nothing
 * until the probe answers, so a missing sequence never occupies layout at all.
 *
 * ── REDUCED MOTION / SAVE-DATA ──
 * Bail out before a single frame byte: show `finalStillSrc` as a plain image
 * with the scroll track collapsed. The final frame of both sequences is
 * specified to stand alone as a finished image (docs/13 §3, K4), so this is a
 * complete design and not a stripped one.
 *
 * ── MEMORY ──
 * Frame dimensions are capped by the asset spec, not here: decoded frames cost
 * width × height × 4 bytes and iOS Safari silently fails `drawImage` past a few
 * hundred MB. Phones load every 2nd frame. Read the memory guardrail note in
 * docs/13 §5 before raising `frameCount` or the frame resolution.
 */

export type ScrollSequenceProps = {
  /** Folder holding the frames, without a trailing slash. */
  baseUrl: string;
  /** How many frames were exported (`f_001` … `f_<frameCount>`). */
  frameCount: number;
  /** Frame aspect — mobile masters are 9:16, desktop 16:9 (docs/13 §5). */
  aspect: "9/16" | "16/9";
  /** The reduced-motion / no-frames still. Usually `<baseUrl>/final.webp`. */
  finalStillSrc?: string;
  /** Hebrew description of what the sequence shows. Required: the canvas is an
   *  image as far as assistive tech is concerned. */
  ariaLabel: string;
  /** Caption beats rendered over the stage; they fade in on the same view
   *  timeline as the track (`.scroll-seq__beat` in globals.css). */
  children?: ReactNode;
};

type Mode = "probing" | "scrub" | "still" | "absent";

const MOBILE_QUERY = "(max-width: 640px)";
/** Parallel image loads. Four keeps the pipe busy without starving the rest of
 *  the page on a phone connection. */
const CONCURRENCY = 4;

/* `frameUrl` and `loadSequenceImage` used to be local copies here. They moved to
   sequence-source.ts when the process scrub became a second consumer of the same
   `motion/pearl/` frames: two components building the same URLs from two private
   helpers is exactly how a path convention drifts. */

export function ScrollSequence({
  baseUrl,
  frameCount,
  aspect,
  finalStillSrc,
  ariaLabel,
  children,
}: ScrollSequenceProps) {
  const [mode, setMode] = useState<Mode>("probing");
  const trackRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The probe's image is the first frame, so the scrubber starts with something
  // to paint instead of waiting on a second request for the same file.
  const firstFrameRef = useRef<HTMLImageElement | null>(null);

  // ── Probe: does this sequence exist at all, and may we animate it? ──
  useEffect(() => {
    let cancelled = false;
    // Honours `?motion=force` — see src/lib/eval-flags.ts.
    const reduced = prefersReducedMotion();
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    const stillOnly = reduced || connection?.saveData === true;

    const settleWithStill = async () => {
      if (!finalStillSrc) return "absent" as const;
      const still = await loadSequenceImage(finalStillSrc);
      return still ? ("still" as const) : ("absent" as const);
    };

    void (async () => {
      if (stillOnly) {
        const next = await settleWithStill();
        if (!cancelled) setMode(next);
        return;
      }
      const first = await loadSequenceImage(frameUrl(baseUrl, 1));
      if (cancelled) return;
      if (first) {
        firstFrameRef.current = first;
        setMode("scrub");
        return;
      }
      const next = await settleWithStill();
      if (!cancelled) setMode(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [baseUrl, finalStillSrc]);

  // ── The scrubber itself ──
  useEffect(() => {
    if (mode !== "scrub") return;
    const track = trackRef.current;
    const canvas = canvasRef.current;
    if (!track || !canvas) return;
    // alpha:false is the cheap win here — no per-pixel compositing against the
    // page. The cost is that an unpainted canvas is BLACK, which is why it is
    // held at opacity 0 until the first frame lands (globals.css §5).
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const step = window.matchMedia(MOBILE_QUERY).matches ? 2 : 1;
    const frames = new Map<number, HTMLImageElement>();
    if (firstFrameRef.current) frames.set(1, firstFrameRef.current);

    let raf = 0;
    let disposed = false;
    let drawn = -1;

    const sizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      // DPR capped at 2: beyond that the buffer grows quadratically for a
      // difference nobody can see on a photographic frame.
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        drawn = -1; // the buffer was cleared; whatever was there is gone
      }
    };

    /** The loaded frame closest to `target` — phones only hold every 2nd. */
    const nearestLoaded = (target: number) => {
      for (let d = 0; d < frameCount; d += 1) {
        if (target - d >= 1 && frames.has(target - d)) return target - d;
        if (target + d <= frameCount && frames.has(target + d)) return target + d;
      }
      return 0;
    };

    const draw = () => {
      sizeCanvas();
      const rect = track.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      const progress =
        travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0;
      const index = nearestLoaded(
        Math.round(progress * (frameCount - 1)) + 1
      );
      if (!index || index === drawn) return;
      const img = frames.get(index);
      if (!img) return;

      // Cover-fit: the canvas is full-bleed and the frame's aspect may not match
      // the viewport's, and with alpha:false any uncovered pixel would be black.
      const cw = canvas.width;
      const ch = canvas.height;
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      drawn = index;
      canvas.setAttribute("data-drawn", "");
    };

    const schedule = () => {
      if (raf || disposed) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        draw();
      });
    };

    // ── Loading. Ascending order, so the frames the visitor reaches first are
    // the ones that arrive first, and frame 1 is on screen immediately. ──
    const queue: number[] = [];
    for (let n = 1; n <= frameCount; n += step) {
      if (!frames.has(n)) queue.push(n);
    }
    let loading = false;
    const pump = async () => {
      while (queue.length && !disposed) {
        const n = queue.shift();
        if (n === undefined) return;
        const img = await loadSequenceImage(frameUrl(baseUrl, n));
        if (disposed) return;
        if (img) {
          frames.set(n, img);
          schedule();
        }
      }
    };
    const startLoading = () => {
      if (loading) return;
      loading = true;
      for (let i = 0; i < CONCURRENCY; i += 1) void pump();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          startLoading();
          observer.disconnect();
        }
      },
      // Start fetching a viewport and a half early, so the stage is warm by the
      // time it is sticky.
      { rootMargin: "150%" }
    );
    observer.observe(track);

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      frames.forEach((img) => {
        img.onload = null;
        img.onerror = null;
        img.src = "";
      });
      frames.clear();
      firstFrameRef.current = null;
      // Zeroing the canvas releases its backing store immediately — iOS is slow
      // to collect a detached one and this is the biggest allocation on the page.
      canvas.width = 0;
      canvas.height = 0;
    };
  }, [mode, baseUrl, frameCount]);

  if (mode === "absent" || mode === "probing") return null;

  if (mode === "still") {
    return (
      <section className="bg-background px-6 py-14 sm:py-20">
        <div className="mx-auto max-w-4xl">
          {/* Plain <img>, not next/image: the file lives on the R2 media CDN,
              the production build is a static export (no optimizer), and it
              needs an onError so a still that disappears removes the section
              rather than leaving a broken frame. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={finalStillSrc}
            alt={ariaLabel}
            decoding="async"
            loading="lazy"
            onError={() => setMode("absent")}
            style={{ aspectRatio: aspect } as CSSProperties}
            className="w-full rounded-3xl object-cover shadow-card"
          />
          {children ? (
            <div className="mt-6 text-center">{children}</div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={trackRef as React.RefObject<HTMLElement>}
      className="scroll-seq__track relative h-[300svh] motion-reduce:h-auto"
    >
      <div className="sticky top-0 flex h-svh items-center justify-center overflow-hidden motion-reduce:static motion-reduce:h-auto">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={ariaLabel}
          className="scroll-seq__canvas h-full w-full"
        />
        {children ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-8 sm:p-14">
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}
