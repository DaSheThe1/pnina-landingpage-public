"use client";

/**
 * The touch controller for the four-station pearl process.
 *
 * Mobile browsers scroll the root asynchronously. Trying to let native
 * momentum run and then repair it with scroll snap/rAF is not a reliable
 * one-gesture-one-step contract on iOS: WebKit may pass several snap points
 * before JavaScript observes a frame. This controller makes the step the state
 * and treats scroll position as its projection:
 *
 * - one primary vertical pointer gesture requests one adjacent station;
 * - a second pointer cancels the request (pinch zoom remains available);
 * - the first/last outward gesture exits programmatically;
 * - arriving momentum is clamped to the boundary station from which it came;
 * - media readiness and canvas playback are deliberately absent from this file.
 *
 * `touch-action: pan-x pinch-zoom` is applied by globals.css only while the
 * stage is pinned. It stops native vertical momentum for gestures that begin
 * inside the stage while retaining horizontal pans and pinch zoom. A gesture
 * that began outside can still coast into the section, which is why the
 * scroll reconciliation below keeps a small arrival backstop.
 */

const POINTER_THRESHOLD = 42;
const POINTER_DOMINANCE = 1.1;
const STEP_COOLDOWN_MS = 450;
const ARRIVAL_MOMENTUM_MS = 1400;
const WHEEL_GESTURE_QUIET_MS = 550;
const WHEEL_TRAIN_GAP_MS = 220;
const WHEEL_THRESHOLD = 40;
const EDGE_EPSILON = 1;
const EXIT_DISTANCE = 0.35;

type Side = -1 | 0 | 1;

type Geometry = {
  y: number;
  end: number;
  viewport: number;
};

export type MobileProcessControllerOptions = {
  track: HTMLElement;
  stage: HTMLElement;
  stationCount: number;
  getViewportHeight(): number;
  onStationChange(station: number): void;
  onPinnedChange(pinned: boolean): void;
  requestRender(): void;
};

export type MobileProcessController = {
  dispose(): void;
};

function clampStation(station: number, count: number) {
  return Math.min(count - 1, Math.max(0, station));
}

function wheelPixels(event: WheelEvent, viewport: number) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE)
    return event.deltaY * viewport;
  return event.deltaY;
}

export function createMobileProcessController({
  track,
  stage,
  stationCount,
  getViewportHeight,
  onStationChange,
  onPinnedChange,
  requestRender,
}: MobileProcessControllerOptions): MobileProcessController {
  let station = 0;
  let pinned = false;
  let bypass = false;
  let lastSide: Side = 0;
  let lastY = 0;
  let lastStepAt = -Infinity;

  let observedPointerId: number | null = null;
  let observedStartX = 0;
  let observedStartY = 0;
  let observedMoved = false;
  let arrivalMomentumUntil = 0;

  const activePointers = new Set<number>();
  let stagePointerId: number | null = null;
  let stageStartX = 0;
  let stageStartY = 0;
  let stageGestureSpent = false;
  let stageGestureCancelled = false;

  let lastWheelAt = -Infinity;
  let wheelDelta = 0;
  let wheelSpent = false;

  const geometry = (): Geometry => {
    const rect = track.getBoundingClientRect();
    const viewport = Math.max(1, getViewportHeight());
    return {
      y: -rect.top,
      end: Math.max(1, rect.height - viewport),
      viewport,
    };
  };

  const setPinned = (next: boolean) => {
    if (next === pinned) return;
    pinned = next;
    track.toggleAttribute("data-process-pinned", next);
    onPinnedChange(next);
  };

  const publishStation = (next: number) => {
    station = clampStation(next, stationCount);
    track.dataset.processStation = String(station + 1);
    onStationChange(station);
    requestRender();
  };

  const scrollToStation = (next: number, g = geometry()) => {
    const targetY = (g.end * next) / (stationCount - 1);
    if (Math.abs(g.y - targetY) <= EDGE_EPSILON) return;
    window.scrollTo({
      top: window.scrollY + (targetY - g.y),
      behavior: "instant",
    });
  };

  const exit = (direction: number, g: Geometry) => {
    bypass = true;
    setPinned(false);
    const targetY =
      direction < 0
        ? -g.viewport * EXIT_DISTANCE
        : g.end + g.viewport * EXIT_DISTANCE;
    window.scrollTo({
      top: window.scrollY + (targetY - g.y),
      behavior: "smooth",
    });
    requestRender();
  };

  const move = (direction: number, now: number) => {
    if (!pinned || !direction || now - lastStepAt < STEP_COOLDOWN_MS) return;
    lastStepAt = now;
    const next = station + Math.sign(direction);
    const g = geometry();
    if (next < 0 || next >= stationCount) {
      exit(direction, g);
      return;
    }
    publishStation(next);
    scrollToStation(next, g);
  };

  /**
   * Native scrolling is used only to reach or leave the track. Once the sticky
   * stage fills the frozen viewport, its position is reconciled to one discrete
   * station. This runs from `scroll`, not from the canvas rAF, so slow WebP
   * decoding cannot delay it.
   */
  const reconcile = () => {
    const now = performance.now();
    const g = geometry();
    const above = g.y < -EDGE_EPSILON;
    const below = g.y > g.end + EDGE_EPSILON;
    const inside = !above && !below;
    const crossedFromAbove = lastY < -EDGE_EPSILON && below;
    const crossedFromBelow = lastY > g.end + EDGE_EPSILON && above;

    if (bypass) {
      if (!inside) {
        bypass = false;
        lastSide = above ? -1 : 1;
      }
      setPinned(false);
      lastY = g.y;
      requestRender();
      return;
    }

    // A very fast compositor scroll can cross the complete pinned range between
    // two main-thread observations. Only a real vertically-moved pointer earns
    // this catch; anchor navigation and the back-to-top bypass are left alone.
    if (
      now < arrivalMomentumUntil &&
      (crossedFromAbove || crossedFromBelow)
    ) {
      const boundary = crossedFromAbove ? 0 : stationCount - 1;
      publishStation(boundary);
      setPinned(true);
      lastStepAt = now;
      scrollToStation(boundary, g);
      lastY = (g.end * boundary) / (stationCount - 1);
      return;
    }

    if (!inside) {
      lastSide = above ? -1 : 1;
      setPinned(false);
      lastY = g.y;
      requestRender();
      return;
    }

    if (!pinned) {
      const boundary =
        lastSide < 0
          ? 0
          : lastSide > 0
            ? stationCount - 1
            : Math.round((g.y / g.end) * (stationCount - 1));
      publishStation(boundary);
      setPinned(true);
      lastStepAt = now;
      if (now - lastWheelAt < WHEEL_GESTURE_QUIET_MS) wheelSpent = true;
      scrollToStation(boundary, g);
      lastY = (g.end * boundary) / (stationCount - 1);
      return;
    }

    // Any residual native momentum is held on the state it entered with. Stage
    // gestures never come through here as native vertical movement because of
    // touch-action, but an arrival gesture started outside that CSS boundary.
    scrollToStation(station, g);
    lastY = (g.end * station) / (stationCount - 1);
    requestRender();
  };

  const onScroll = () => reconcile();

  const onBypass = () => {
    bypass = true;
    setPinned(false);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
    activePointers.add(event.pointerId);

    observedPointerId = event.pointerId;
    observedStartX = event.clientX;
    observedStartY = event.clientY;
    observedMoved = false;

    const target = event.target;
    if (!pinned || !(target instanceof Node) || !stage.contains(target)) return;

    if (activePointers.size > 1) {
      stageGestureCancelled = true;
      return;
    }

    stagePointerId = event.pointerId;
    stageStartX = event.clientX;
    stageStartY = event.clientY;
    stageGestureSpent = false;
    stageGestureCancelled = false;
    try {
      stage.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is an optimisation. The window listener still receives
      // the event in browsers that decline capture for a synthetic/late pointer.
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== "touch" && event.pointerType !== "pen") return;

    if (event.pointerId === observedPointerId) {
      const observedDy = event.clientY - observedStartY;
      const observedDx = event.clientX - observedStartX;
      if (
        Math.abs(observedDy) > 8 &&
        Math.abs(observedDy) > Math.abs(observedDx)
      ) {
        observedMoved = true;
        arrivalMomentumUntil = performance.now() + ARRIVAL_MOMENTUM_MS;
      }
    }

    if (
      event.pointerId !== stagePointerId ||
      stageGestureSpent ||
      stageGestureCancelled ||
      activePointers.size !== 1
    ) {
      return;
    }

    const dy = stageStartY - event.clientY;
    const dx = stageStartX - event.clientX;
    if (
      Math.abs(dy) < POINTER_THRESHOLD ||
      Math.abs(dy) < Math.abs(dx) * POINTER_DOMINANCE
    ) {
      return;
    }

    event.preventDefault();
    stageGestureSpent = true;
    move(Math.sign(dy), performance.now());
  };

  const finishPointer = (event: PointerEvent) => {
    if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
    activePointers.delete(event.pointerId);
    if (event.pointerId === observedPointerId) {
      if (observedMoved)
        arrivalMomentumUntil = performance.now() + ARRIVAL_MOMENTUM_MS;
      observedPointerId = null;
    }
    if (event.pointerId === stagePointerId) stagePointerId = null;
    if (activePointers.size === 0) stageGestureCancelled = false;
  };

  const onWheel = (event: WheelEvent) => {
    if (event.ctrlKey || !pinned) return;
    const now = performance.now();
    const quietFor = now - lastWheelAt;
    lastWheelAt = now;
    if (quietFor > WHEEL_TRAIN_GAP_MS) wheelDelta = 0;
    if (quietFor > WHEEL_GESTURE_QUIET_MS) wheelSpent = false;

    event.preventDefault();
    if (wheelSpent) return;

    wheelDelta += wheelPixels(event, getViewportHeight());
    if (Math.abs(wheelDelta) < WHEEL_THRESHOLD) return;
    wheelSpent = true;
    move(Math.sign(wheelDelta), now);
    wheelDelta = 0;
  };

  track.dataset.processController = "mobile";
  track.dataset.processStation = "1";
  const initial = geometry();
  lastY = initial.y;
  lastSide = initial.y < 0 ? -1 : initial.y > initial.end ? 1 : 0;

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", finishPointer, { passive: true });
  window.addEventListener("pointercancel", finishPointer, { passive: true });
  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("pnina:scroll-bypass", onBypass);
  reconcile();

  return {
    dispose() {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", finishPointer);
      window.removeEventListener("pointercancel", finishPointer);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("pnina:scroll-bypass", onBypass);
      setPinned(false);
      delete track.dataset.processController;
      delete track.dataset.processPinned;
      delete track.dataset.processStation;
    },
  };
}
