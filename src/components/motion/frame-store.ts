"use client";

import { frameUrl } from "./sequence-source";

/**
 * THE FRAME STORE — how a scroll-scrubbed sequence gets its images onto a canvas
 * without taking the page down with it.
 *
 * Split out of `process-scrub.tsx` on 2026-07-30. That component's job is the
 * scroll choreography; this one's job is bytes and decoded memory, and the two
 * were failing for completely different reasons.
 *
 * ── WHAT WAS THERE BEFORE, AND WHY IT HAD TO GO ──
 * The loader was one `for` loop: 90 `new Image()` on a phone, 180 on a desktop,
 * every `src` assigned in the same tick, every one of them also calling
 * `.decode()`. Daniel measured the consequences on an iPhone 13/14 and an S25
 * Ultra — flagship phones, so none of this is a hardware limit:
 *
 *   • PAGE LOAD ~15 SECONDS. The section starts fetching at `rootMargin: 150%`,
 *     which on a phone is while the hero is still on screen. 90 requests land in
 *     the browser's queue at default priority, ahead of nothing and alongside
 *     everything, and the fonts, the hero clip and the hydration bundle queue
 *     behind them. The frames are not the page; they must never outrank it.
 *   • "SUPER LAGGY BETWEEN IMAGES". 90 frames at 540×960 is ~187MB of decoded
 *     bitmap held live, and 180 at 1440×810 is ~840MB. (The desktop cut went up
 *     on 2026-07-30 — `motion/pearl/d/f_180.webp` answers 200 now — so that
 *     second figure is no longer theoretical.) Past a few hundred MB the browser
 *     starts DISCARDING the decoded copy behind an `HTMLImageElement` while
 *     keeping the element, and then every single `drawImage` re-decodes a WebP
 *     synchronously on the main thread. That is exactly what "laggy between
 *     images" looks like, and it gets worse the longer you scrub, which is the
 *     tell that it is memory and not network.
 *
 * ── THE THREE THINGS THIS FILE DOES ──
 *
 * 1. A CONCURRENCY QUEUE, not a burst. `MAX_IN_FLIGHT` requests at a time, each
 *    marked `fetchPriority = "low"` so the browser schedules them behind the
 *    document, the CSS, the fonts and the hero. The section can therefore still
 *    start early (the IntersectionObserver in the component is unchanged) —
 *    starting early is only harmful when it starves the page, and it no longer
 *    does.
 *
 * 2. WINDOWED DECODED MEMORY. Frames are decoded with `createImageBitmap`,
 *    which decodes off the main thread and — the part that matters — produces a
 *    bitmap the browser may NOT silently discard, so `drawImage` can never turn
 *    into a synchronous re-decode. The price of that guarantee is that we have
 *    to do the discarding ourselves, so only a window around the playhead keeps
 *    its bitmap; the rest are `close()`d. The budget is in BYTES, not in frames,
 *    because the two cuts are 2.25× apart in size per frame (see `PEAK_BYTES`).
 *    Re-entering an evicted region re-requests the file, which is a hit on the
 *    browser's HTTP cache (`cache-control: max-age=14400` from the bucket) and
 *    not a network round trip.
 *
 * 3. A SKELETON THAT IS ALWAYS THERE, so the sequence is usable long before it
 *    is complete and stays usable after eviction. Three sets of frames are
 *    PINNED — never released, fetched before anything else: the four station
 *    keyframes (the images a visitor actually rests on), the desktop stills, and
 *    a coarse anchor every `ANCHOR_STRIDE` stored frames. The anchors are what
 *    make a jump survivable: a deep link, a nav anchor or a fast fling lands
 *    somewhere the window has not reached, and `nearestIndex` then finds an
 *    anchor a few frames away instead of scanning to the far end of the
 *    sequence. Ten pinned frames on a phone is ~21MB, which buys a picture
 *    everywhere for a fifth of the memory the old loader spent on act one alone.
 *
 *    Everything else is fetched COARSE TO FINE (every 32nd stored frame, then
 *    every 16th, every 8th … each level ordered by distance from the nearest
 *    station) but ONLY once the retention window reaches it — there is no point
 *    downloading a frame the window would immediately throw away. That is also
 *    why the initial burst is now ~35 requests instead of 90: arrival needs the
 *    skeleton plus the first window, and not one frame more.
 *
 * ── WHY `<img>` AND NOT `fetch()` ──
 * It would be tidier to `fetch()` each frame once, keep the ~45KB compressed
 * blob for the whole session and re-`createImageBitmap(blob)` on demand — that
 * makes eviction completely free. It is not possible here: the bucket sends NO
 * `Access-Control-Allow-Origin` (checked against media.trickticmedia.com on
 * 2026-07-30), so a cross-origin `fetch` fails outright while `<img>` does not
 * need CORS at all. If CORS is ever enabled on that bucket, switching to the
 * blob path is the single best follow-up available here — until then, do not
 * "simplify" this to `fetch()`.
 *
 * The bitmaps are origin-unclean as a result, which taints the canvas they are
 * drawn to. Nothing here ever calls `getImageData`/`toDataURL`, so that costs
 * nothing; if that ever changes, this is the reason it will throw.
 */

/** Concurrent frame requests. Low enough that the page's own assets always win
 *  a slot on a phone, high enough to keep a 4G pipe busy. A slot is held until
 *  the frame is DECODED, not merely downloaded, so this caps decode work too. */
const MAX_IN_FLIGHT = 5;

/**
 * The ceiling on decoded bytes held at once, per cut.
 *
 * Expressed in bytes rather than in frames because a mobile frame is
 * 540×960×4 ≈ 2.07MB and a desktop one is 1440×810×4 ≈ 4.67MB, so any single
 * frame count is either wasteful on one cut or fatal on the other. These are the
 * numbers the old "hold everything" loader was implicitly at: 187MB mobile,
 * 840MB desktop.
 *
 * Mobile is the tighter of the two on purpose — it is the device the complaint
 * came from, and a phone browser under memory pressure evicts the whole TAB,
 * not just some bitmaps. 80MB is roughly 38 stored frames live, which at the
 * scrub's own rate (~25 frame-indices per second) is over a second of travel
 * either side of the playhead — comfortably more than the loader needs to refill
 * ahead of it, and less than half what the old "hold everything" cut spent.
 *
 * These are ceilings on what is HELD, not on what is downloaded. The bytes on
 * the wire are unchanged: ~4MB for the mobile cut, ~12MB for the desktop one.
 */
const PEAK_BYTES = { mobile: 80e6, desktop: 220e6 } as const;

/** The share of the budget the pinned skeleton may take. The rest is the moving
 *  window. Anchors are the expensive kind of useful — they are held for the
 *  whole session — so the count is derived from this rather than fixed, or the
 *  desktop cut's 4.67MB frames would spend a quarter of the budget on them. */
const ANCHOR_SHARE = 0.15;

/** How much further than the retention window a frame has to be before it is
 *  actually released. Pure hysteresis: without it a playhead sitting on the
 *  window edge evicts and re-requests the same frame every few pixels. */
const EVICT_SLACK = 1.35;

/** The retention window is pushed AHEAD of the playhead, because that is where
 *  it is going. Same bytes, roughly double the useful lookahead. Their SUM is
 *  what the byte budget is divided by, so changing either one keeps the peak
 *  where `PEAK_BYTES` says it is. */
const AHEAD = 1.5;
const BEHIND = 0.6;

/** The closest together coarse anchors are ever placed, in STORED frames. The
 *  budget above may space them further apart; it may not crowd them closer. */
const ANCHOR_STRIDE_MIN = 16;

type SlotState = "idle" | "loading" | "ready" | "failed";

type Slot = {
  state: SlotState;
  /** Live only while loading, or as the decoded surface when
   *  `createImageBitmap` is unavailable. */
  img?: HTMLImageElement;
  bitmap?: ImageBitmap;
  /** What `draw` hands to `drawImage`. Set iff `state === "ready"`. */
  src?: CanvasImageSource;
  /** Never evicted: frame 0 and the four station keyframes. */
  pinned?: boolean;
};

export type FrameStoreOptions = {
  baseUrl: string;
  /** Total frames in the export (the last index is `frameCount - 1`). */
  frameCount: number;
  /** 1 = every frame, 2 = every 2nd. Only multiples of this are ever fetched. */
  step: number;
  /** Frame indices the four snap stations rest on, already snapped to the grid. */
  stationIndices: readonly number[];
  /** Desktop only: which stations dissolve into an approved clean still. */
  stillStations: readonly number[];
  /** Decoded size of one frame, for the byte budget. */
  frameBytes: number;
  /** Which budget applies. */
  cut: keyof typeof PEAK_BYTES;
  /** Frame 1, already downloaded and decoded by the probe. Never evicted. */
  firstFrame: HTMLImageElement;
};

export type FrameStore = {
  /** Begin fetching. Idempotent — the IntersectionObserver may fire twice. */
  start(): void;
  /**
   * Tell the store where the playhead is, in frame indices. Drives BOTH which
   * frames keep a decoded bitmap and which the queue reaches for next, so the
   * store follows a visitor who jumps rather than plodding through its list.
   */
  focus(index: number): void;
  /** The nearest LOADED frame index to `index`, or -1 if nothing is loaded. */
  nearestIndex(index: number): number;
  /** The drawable at an exact index, or null. */
  at(index: number): CanvasImageSource | null;
  /** The clean still for a station, or null. */
  still(station: number): CanvasImageSource | null;
  dispose(): void;
};

const supportsBitmap =
  typeof globalThis !== "undefined" &&
  typeof globalThis.createImageBitmap === "function";

export function createFrameStore(options: FrameStoreOptions): FrameStore {
  const {
    baseUrl,
    frameCount,
    step,
    stationIndices,
    stillStations,
    frameBytes,
    cut,
    firstFrame,
  } = options;

  const bytes = Math.max(1, frameBytes);
  const budget = PEAK_BYTES[cut];

  /** The last index on the fetch grid, and how many frames sit on it. */
  const lastIndex = Math.floor((frameCount - 1) / step) * step;
  const storedCount = Math.floor(lastIndex / step) + 1;

  /** The unit of the retention window, in STORED frames (so `× step` in
   *  indices): the window reaches `AHEAD ×` this forward and `BEHIND ×` this
   *  back, which is why the budget is divided by their sum. */
  const evictHalf = Math.max(
    8,
    Math.floor(((1 - ANCHOR_SHARE) * budget) / bytes / (AHEAD + BEHIND))
  );
  const keepHalf = Math.max(6, Math.round(evictHalf / EVICT_SLACK));

  const slots: Slot[] = new Array(frameCount);
  for (let i = 0; i <= lastIndex; i += step) slots[i] = { state: "idle" };

  const stations = stationIndices.map((i) =>
    Math.min(lastIndex, Math.max(0, Math.round(i / step) * step))
  );
  for (const s of stations) {
    if (slots[s]) slots[s].pinned = true;
  }

  // Coarse anchors, spaced so the whole set fits `ANCHOR_SHARE` of the budget.
  const anchorStride = Math.max(
    ANCHOR_STRIDE_MIN,
    Math.ceil(storedCount / Math.max(4, Math.floor((ANCHOR_SHARE * budget) / bytes)))
  );
  const anchors: number[] = [];
  for (let i = 0; i <= lastIndex; i += anchorStride * step) {
    if (!slots[i]) continue;
    slots[i].pinned = true;
    anchors.push(i);
  }

  // Frame 1 arrives already decoded, from the probe that decided this section
  // may run at all. It is the one frame that is guaranteed drawable from the
  // first paint, so it is pinned and never touched by eviction.
  slots[0] = { state: "ready", src: firstFrame, img: firstFrame, pinned: true };

  const stills: Record<number, CanvasImageSource> = {};

  // ── The job list: stations, then the stills, then coarse to fine ──
  type Job = { kind: "frame"; index: number } | { kind: "still"; station: number };
  const jobs: Job[] = [];
  const queued = new Set<number>();
  const pushFrame = (i: number) => {
    if (i <= 0 || i > lastIndex || queued.has(i) || !slots[i]) return;
    queued.add(i);
    jobs.push({ kind: "frame", index: i });
  };
  const distToStation = (i: number) =>
    stations.reduce((best, s) => Math.min(best, Math.abs(i - s)), Infinity);

  for (const s of stations) pushFrame(s);
  for (const s of stillStations) jobs.push({ kind: "still", station: s });
  for (const i of anchors) pushFrame(i);
  for (let stride = 32; stride >= 1; stride = Math.floor(stride / 2)) {
    const gap = stride * step;
    const level: number[] = [];
    for (let i = 0; i <= lastIndex; i += gap) {
      if (i > 0 && !queued.has(i) && slots[i]) level.push(i);
    }
    level.sort((a, b) => distToStation(a) - distToStation(b));
    for (const i of level) pushFrame(i);
  }
  // Backstop: anything the strides missed (they only land on multiples of a
  // power of two, and `lastIndex` need not be one).
  for (let i = step; i <= lastIndex; i += step) pushFrame(i);

  let cursor = 0;
  let inFlight = 0;
  let started = false;
  let disposed = false;
  let focused = 0;
  let heading = 1;

  const release = (slot: Slot) => {
    if (slot.pinned) return;
    slot.bitmap?.close();
    slot.bitmap = undefined;
    if (slot.img) {
      // Dropping the src is what actually lets the decoded copy go; keeping the
      // element alive with a live `src` is the whole bug this file exists for.
      slot.img.src = "";
      slot.img = undefined;
    }
    slot.src = undefined;
    slot.state = "idle";
  };

  const settle = (slot: Slot, state: SlotState) => {
    slot.state = state;
    inFlight--;
    pump();
  };

  const beginFrame = (index: number) => {
    const slot = slots[index];
    if (!slot || slot.state !== "idle") return false;
    slot.state = "loading";
    inFlight++;
    const img = new Image();
    slot.img = img;
    img.decoding = "async";
    // Priority Hints. Chromium honours it and drops these below the document,
    // the CSS, the fonts and the hero video; Safari ignores it, which is why the
    // concurrency cap above — not this line — is the load fix that works on the
    // iPhone. Both are needed.
    img.fetchPriority = "low";
    img.onload = () => {
      if (disposed) {
        img.src = "";
        return;
      }
      // The window may have moved off this frame while it was in flight. Judged
      // by the LOOSER of the two windows: the bytes are already here, so the
      // only question left is whether the eviction pass would keep them.
      if (!worthKeeping(index)) {
        img.src = "";
        slot.img = undefined;
        settle(slot, "idle");
        return;
      }
      if (!supportsBitmap) {
        slot.src = img;
        settle(slot, "ready");
        return;
      }
      createImageBitmap(img)
        .then((bitmap) => {
          if (disposed) {
            bitmap.close();
            return;
          }
          slot.bitmap = bitmap;
          slot.src = bitmap;
          // The element has done its job; the bitmap is the only copy now.
          slot.img = undefined;
          img.src = "";
          settle(slot, "ready");
        })
        .catch(() => {
          if (disposed) return;
          slot.src = img;
          settle(slot, "ready");
        });
    };
    img.onerror = () => {
      slot.img = undefined;
      if (!disposed) settle(slot, "failed");
    };
    img.src = frameUrl(baseUrl, index + 1);
    return true;
  };

  const beginStill = (station: number) => {
    inFlight++;
    const img = new Image();
    img.decoding = "async";
    img.fetchPriority = "low";
    img.onload = () => {
      if (disposed) return;
      if (!supportsBitmap) {
        stills[station] = img;
        inFlight--;
        pump();
        return;
      }
      createImageBitmap(img)
        .then((bitmap) => {
          if (disposed) {
            bitmap.close();
            return;
          }
          stills[station] = bitmap;
        })
        .catch(() => {
          if (!disposed) stills[station] = img;
        })
        .finally(() => {
          if (disposed) return;
          inFlight--;
          pump();
        });
    };
    img.onerror = () => {
      if (disposed) return;
      inFlight--;
      pump();
    };
    img.src = `${baseUrl}/still-${station + 1}.webp`;
    return true;
  };

  /** Is `index` inside the window worth FETCHING for? Direction-biased, because
   *  the playhead is going somewhere. */
  const inWindow = (index: number, half: number) => {
    const d = index - focused;
    const ahead = (heading >= 0 ? half * AHEAD : half * BEHIND) * step;
    const behind = (heading >= 0 ? half * BEHIND : half * AHEAD) * step;
    return d >= -behind && d <= ahead;
  };
  /** …and the looser one that decides whether a frame already in hand is worth
   *  KEEPING. Anything between the two is the hysteresis band. */
  const worthKeeping = (index: number) =>
    slots[index]?.pinned === true || inWindow(index, evictHalf);

  /**
   * The next thing worth requesting.
   *
   * The window comes FIRST and the static list second: a visitor who lands on
   * station 3 from a deep link must not wait for the queue to grind through the
   * whole of act one. Searching outward from the playhead is bounded by the
   * window, so this stays cheap even at 180 frames.
   *
   * The static list is then filtered by the SAME window, so the coarse-to-fine
   * order only ever supplies frames the retention pass would keep. Without that
   * the two halves of this file fight: the queue downloads act three while the
   * playhead is in act one, and the eviction sweep throws it away unread.
   * Pinned frames — stations, stills, anchors — are exempt, which is exactly
   * what makes them the skeleton.
   */
  const nextJob = (): Job | null => {
    const reach = Math.round(keepHalf * AHEAD) * step;
    for (let d = 0; d <= reach; d += step) {
      const forward = focused + (heading >= 0 ? d : -d);
      if (slots[forward]?.state === "idle") return { kind: "frame", index: forward };
      const back = focused - (heading >= 0 ? d : -d);
      if (d > 0 && slots[back]?.state === "idle" && inWindow(back, keepHalf))
        return { kind: "frame", index: back };
    }
    while (cursor < jobs.length) {
      const job = jobs[cursor++];
      if (job.kind === "still") return job;
      const slot = slots[job.index];
      if (!slot || slot.state !== "idle") continue;
      if (slot.pinned || inWindow(job.index, keepHalf)) return job;
      // Out of window: skipped, and left `idle`. The cursor does not come back
      // to it, but the window scan above will, the moment the playhead is near
      // enough for the frame to be worth having.
    }
    return null;
  };

  function pump() {
    if (!started || disposed) return;
    while (inFlight < MAX_IN_FLIGHT) {
      const job = nextJob();
      if (!job) return;
      const ok =
        job.kind === "still" ? beginStill(job.station) : beginFrame(job.index);
      if (!ok) return;
    }
  }

  return {
    start() {
      if (started || disposed) return;
      started = true;
      pump();
    },

    focus(index: number) {
      const snapped = Math.min(
        lastIndex,
        Math.max(0, Math.round(index / step) * step)
      );
      if (snapped === focused) return;
      heading = snapped > focused ? 1 : -1;
      focused = snapped;

      // Eviction sweep. ~90 slots on a phone and the playhead only crosses a
      // stored frame a dozen times a second, so this is a few hundred cheap
      // iterations per second and never touches the GPU.
      for (let i = 0; i <= lastIndex; i += step) {
        const slot = slots[i];
        if (!slot || slot.state !== "ready" || worthKeeping(i)) continue;
        release(slot);
      }
      pump();
    },

    nearestIndex(index: number) {
      const g = Math.min(lastIndex, Math.max(0, Math.round(index / step) * step));
      for (let d = 0; d <= frameCount; d += step) {
        if (slots[g - d]?.src) return g - d;
        if (slots[g + d]?.src) return g + d;
      }
      return -1;
    },

    at(index: number) {
      return slots[index]?.src ?? null;
    },

    still(station: number) {
      return stills[station] ?? null;
    },

    dispose() {
      disposed = true;
      for (let i = 0; i <= lastIndex; i += step) {
        const slot = slots[i];
        if (!slot) continue;
        // Frame 0's element belongs to the caller (it is the probe's image), so
        // only the bitmap side of a pinned slot is ours to free.
        slot.bitmap?.close();
        slot.bitmap = undefined;
        if (slot.img && slot.img !== firstFrame) slot.img.src = "";
        slot.img = undefined;
        slot.src = undefined;
        slot.state = "idle";
      }
      for (const key of Object.keys(stills)) {
        const value = stills[Number(key)];
        if (typeof ImageBitmap !== "undefined" && value instanceof ImageBitmap) {
          value.close();
        }
        delete stills[Number(key)];
      }
    },
  };
}
