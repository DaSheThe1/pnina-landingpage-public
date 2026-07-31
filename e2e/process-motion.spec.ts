import { expect, test, type Page } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const FRAME = readFileSync(
  resolve(process.cwd(), "public/images/poster-hero.jpg")
);

let server: Server;
let failIntermediateFrames = false;
let requestedFrames: string[] = [];

test.skip(
  process.env.PLAYWRIGHT_PROCESS_MOTION !== "1",
  "Run through pnpm test:motion so the isolated media origin is compiled in."
);

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
  deviceScaleFactor: 3,
});

test.beforeAll(async () => {
  server = createServer((request, response) => {
    const path = new URL(request.url ?? "/", "http://localhost:3199").pathname;
    if (!path.startsWith("/motion/pearl/")) {
      response.writeHead(404).end();
      return;
    }
    requestedFrames.push(path);

    const isProbe =
      path.endsWith("/f_001.webp") || path.endsWith("/f_180.webp");
    if (failIntermediateFrames && !isProbe) {
      response.writeHead(404).end();
      return;
    }

    response.writeHead(200, {
      "Content-Type": "image/jpeg",
      "Cache-Control": "no-store",
      "Content-Length": FRAME.byteLength,
    });
    response.end(FRAME);
  });

  await new Promise<void>((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(3199, "localhost", () => resolveListen());
  });
});

test.afterAll(async () => {
  await new Promise<void>((resolveClose, reject) => {
    server.close((error) => (error ? reject(error) : resolveClose()));
  });
});

async function stationOf(track: ReturnType<Page["locator"]>) {
  return track.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const end = Math.max(1, rect.height - window.innerHeight);
    const progress = Math.min(1, Math.max(0, -rect.top / end));
    return Math.round(progress * 3) + 1;
  });
}

async function openAtProcess(page: Page) {
  await page.goto("/");
  const track = page.locator("[data-process-track]");
  await expect(track).toHaveCount(1);

  const top = await track.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return window.scrollY + rect.top;
  });
  await page.evaluate((trackTop) => {
    window.scrollTo({ top: trackTop, behavior: "instant" });
  }, top);

  await expect(page.locator("html")).toHaveAttribute(
    "data-scrub-pinned",
    ""
  );
  await expect.poll(() => stationOf(track)).toBe(1);
  // Arrival spends the gesture that reached the section.
  await page.waitForTimeout(650);
  return track;
}

async function approachProcess(page: Page, distance = 240) {
  await page.goto("/");
  const track = page.locator("[data-process-track]");
  await expect(track).toHaveCount(1);

  const top = await track.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return window.scrollY + rect.top;
  });
  await page.evaluate(
    ({ trackTop, before }) => {
      window.scrollTo({
        top: Math.max(0, trackTop - before),
        behavior: "instant",
      });
    },
    { trackTop: top, before: distance }
  );
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-scrub-pinned",
    ""
  );
  return track;
}

async function trustedVerticalGesture(
  page: Page,
  direction: "down" | "up"
) {
  const session = await page.context().newCDPSession(page);
  const height = page.viewportSize()?.height ?? 844;
  const startY =
    direction === "down"
      ? Math.min(650, height - 70)
      : Math.max(90, height * 0.15);
  const endY =
    direction === "down"
      ? Math.max(70, startY - 560)
      : Math.min(height - 70, startY + 560);

  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 195, y: startY, id: 1, force: 1 }],
  });
  for (let index = 1; index <= 7; index++) {
    const progress = index / 7;
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: 195,
          y: startY + (endY - startY) * progress,
          id: 1,
          force: 1,
        },
      ],
    });
    await page.waitForTimeout(25);
  }
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await session.detach();
}

async function trustedMultiFingerGesture(page: Page, fingers: 2 | 3) {
  const session = await page.context().newCDPSession(page);
  const points = Array.from({ length: fingers }, (_, index) => ({
    x: 165 + index * 30,
    y: 650,
    id: index + 11,
    force: 1,
  }));

  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: points,
  });
  for (let step = 1; step <= 5; step++) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: points.map((point) => ({
        ...point,
        y: 650 - step * 100,
      })),
    });
    await page.waitForTimeout(25);
  }
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await session.detach();
}

async function trustedVerticalBurst(page: Page, count: number) {
  const session = await page.context().newCDPSession(page);
  for (let gesture = 0; gesture < count; gesture++) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: 195, y: 650, id: gesture + 30, force: 1 }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: 195, y: 90, id: gesture + 30, force: 1 }],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  }
  await session.detach();
}

async function syntheticGestureWithoutEnd(page: Page) {
  const stage = page.locator(".process-scrub__stage");
  await stage.evaluate((element) => {
    const touchAt = (identifier: number, clientY: number) =>
      new Touch({
        identifier,
        target: element,
        clientX: 195,
        clientY,
        pageX: 195,
        pageY: clientY + window.scrollY,
        screenX: 195,
        screenY: clientY,
      });
    const start = touchAt(91, 650);
    element.dispatchEvent(
      new TouchEvent("touchstart", {
        bubbles: true,
        cancelable: true,
        touches: [start],
        targetTouches: [start],
        changedTouches: [start],
      })
    );
    const moved = touchAt(91, 80);
    element.dispatchEvent(
      new TouchEvent("touchmove", {
        bubbles: true,
        cancelable: true,
        touches: [moved],
        targetTouches: [moved],
        changedTouches: [moved],
      })
    );
    // Deliberately no touchend or touchcancel.
  });
}

async function expectMobileIdle(
  track: ReturnType<Page["locator"]>,
  station: 1 | 2 | 3 | 4,
  timeout = 4_000
) {
  await expect.poll(() => stationOf(track), { timeout }).toBe(station);
  await expect(track).toHaveAttribute(
    "data-process-navigation-phase",
    "idle",
    { timeout }
  );
  await expect(track).toHaveAttribute(
    "data-process-playback-settled",
    "true",
    { timeout }
  );
}

async function moveOneStation(
  page: Page,
  track: ReturnType<Page["locator"]>,
  direction: "down" | "up",
  station: 1 | 2 | 3 | 4
) {
  await trustedVerticalGesture(page, direction);
  await expect.poll(() => stationOf(track)).toBe(station);
  await expectMobileIdle(track, station);
}

test.beforeEach(() => {
  failIntermediateFrames = false;
  requestedFrames = [];
});

test("sequence detail remains deferred until the process approaches", async ({
  page,
}) => {
  await page.goto("/");
  const track = page.locator("[data-process-track]");
  await expect(track).toHaveCount(1);
  await expect.poll(() => requestedFrames.length).toBeGreaterThanOrEqual(2);
  await page.waitForTimeout(300);

  const intermediateRequests = () =>
    requestedFrames.filter(
      (path) => !path.endsWith("/f_001.webp") && !path.endsWith("/f_180.webp")
    );
  expect(intermediateRequests()).toEqual([]);

  await track.evaluate((element) =>
    element.scrollIntoView({ block: "start", behavior: "instant" })
  );
  await expect.poll(() => intermediateRequests().length).toBeGreaterThan(0);
});

test("a hard entry gesture cannot cross the process before step one", async ({
  page,
}) => {
  const track = await approachProcess(page);
  const before = await page.evaluate(() => window.scrollY);

  // One trusted, high-travel wheel event models the iOS Simulator trackpad
  // gesture that used to begin in the founder section and finish below the
  // entire 300vh process track before its pinned-only controller ever ran.
  await page.mouse.move(195, 650);
  await page.mouse.wheel(0, 5_000);

  await expect(page.locator("html")).toHaveAttribute(
    "data-scrub-pinned",
    ""
  );
  await expect.poll(() => stationOf(track)).toBe(1);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeLessThan(before + 1_000);
});

test("a phone flick entering from above lands on step one", async ({ page }) => {
  const track = await approachProcess(page);

  await trustedVerticalGesture(page, "down");

  await expect(page.locator("html")).toHaveAttribute(
    "data-scrub-pinned",
    ""
  );
  await expectMobileIdle(track, 1);
});

test("iOS Simulator wheel input is discarded while an act is playing", async ({
  page,
}) => {
  const track = await openAtProcess(page);

  await page.mouse.move(195, 650);
  await page.mouse.wheel(0, 120);
  await expect.poll(() => stationOf(track)).toBe(2);
  await expect(track).toHaveAttribute("data-process-playback-settled", "false");

  // This arrives after the previous cooldown-based implementation would have
  // reopened, but before the visible 2.4-second act is finished.
  await page.waitForTimeout(700);
  await page.mouse.wheel(0, 120);
  expect(await stationOf(track)).toBe(2);

  await expectMobileIdle(track, 2);
  await page.waitForTimeout(250);
  expect(await stationOf(track)).toBe(2);

  // No input was queued. Only this fresh post-settlement gesture may advance.
  await page.mouse.wheel(0, 120);
  await expect.poll(() => stationOf(track)).toBe(3);
});

test("a missing touchend cannot poison the next native gesture", async ({
  page,
}) => {
  const track = await openAtProcess(page);

  await syntheticGestureWithoutEnd(page);
  await expectMobileIdle(track, 2);

  // WebKit occasionally loses the end of a lifecycle across interruption. A
  // new touchstart must reset that stale per-gesture state before navigating.
  await trustedVerticalGesture(page, "down");
  await expect.poll(() => stationOf(track)).toBe(3);
});

test("the restored sticky track stays attached to the native document", async ({
  page,
}) => {
  const track = await openAtProcess(page);
  const canvas = track.locator("canvas");

  expect(
    await canvas.evaluate(
      (element) => getComputedStyle(element.parentElement!).position
    )
  ).toBe("sticky");
  expect(
    await page.locator("body").evaluate((element) => {
      const style = getComputedStyle(element);
      return { position: style.position, overflow: style.overflow };
    })
  ).toEqual({ position: "static", overflow: "visible" });
  expect(
    await page.locator("html").evaluate((element) => element.hasAttribute(
      "data-process-scroll-locked"
    ))
  ).toBe(false);

  // Parallel two- and three-finger vertical drags are not pinch zoom and may
  // not buy a process station.
  await trustedMultiFingerGesture(page, 2);
  await trustedMultiFingerGesture(page, 3);
  expect(await stationOf(track)).toBe(1);

  await trustedVerticalGesture(page, "down");
  await page.waitForTimeout(100);
  expect(await stationOf(track)).toBe(2);
  await expect(track).toHaveAttribute("data-process-playback-settled", "false");

  // Three more complete flicks happen immediately, then another after the old
  // cooldown has elapsed but while the visible act is still playing. None may
  // carry the root scroller through a later process station.
  await trustedVerticalBurst(page, 3);
  await page.waitForTimeout(700);
  await trustedVerticalGesture(page, "down");
  expect(await stationOf(track)).toBe(2);

  await expectMobileIdle(track, 2);
  // Refused input is discarded, never queued to run when the act settles.
  await page.waitForTimeout(250);
  expect(await stationOf(track)).toBe(2);
  await expect(page.locator("html")).toHaveAttribute("data-scrub-pinned", "");
  await trustedVerticalGesture(page, "down");
  await expect.poll(() => stationOf(track)).toBe(3);
});

test("fresh gestures traverse every step, reverse one step, and exit only after step four", async ({
  page,
}) => {
  test.setTimeout(45_000);
  const track = await openAtProcess(page);

  await moveOneStation(page, track, "down", 2);
  await moveOneStation(page, track, "down", 3);
  await moveOneStation(page, track, "up", 2);
  await moveOneStation(page, track, "down", 3);

  await trustedVerticalGesture(page, "down");
  await expect.poll(() => stationOf(track)).toBe(4);
  await expect(track).toHaveAttribute("data-process-playback-settled", "false");

  // An outward flick during the last act is consumed. It must not be remembered
  // and replayed when the act reaches its endpoint.
  await trustedVerticalGesture(page, "down");
  await expectMobileIdle(track, 4);
  await page.waitForTimeout(250);
  expect(await stationOf(track)).toBe(4);
  await expect(page.locator("html")).toHaveAttribute("data-scrub-pinned", "");

  const beforeExit = await page.evaluate(() => window.scrollY);
  await trustedVerticalGesture(page, "down");
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(beforeExit + 100);
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-scrub-pinned",
    ""
  );
});

test("four-frame-per-second playback still finishes in wall-clock time", async ({
  page,
}) => {
  await page.addInitScript(() => {
    let nextId = 1;
    const timers = new Map<number, number>();
    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      const id = nextId++;
      const timer = window.setTimeout(() => {
        timers.delete(id);
        callback(performance.now());
      }, 250);
      timers.set(id, timer);
      return id;
    };
    window.cancelAnimationFrame = (id: number) => {
      const timer = timers.get(id);
      if (timer !== undefined) window.clearTimeout(timer);
      timers.delete(id);
    };
  });

  const track = await openAtProcess(page);
  await trustedVerticalGesture(page, "down");
  await expect.poll(() => stationOf(track)).toBe(2);
  await page.waitForTimeout(300);
  await expect(track).toHaveAttribute("data-process-playback-settled", "false");
  await trustedVerticalGesture(page, "down");
  expect(await stationOf(track)).toBe(2);

  // One act is 1/3 progress at 0.14 progress/second, or about 2.4 seconds.
  // The former 100ms cap only reached ~0.18 after 3.4 seconds at this frame
  // rate; the wall-clock implementation reaches the station.
  await expect
    .poll(
      () =>
        track.evaluate((element) =>
          Number.parseFloat(element.dataset.processPlayhead ?? "0")
        ),
      { timeout: 3_400 }
    )
    .toBeGreaterThan(0.32);
});

test("failed intermediate pictures cannot freeze page navigation", async ({
  page,
}) => {
  test.setTimeout(45_000);
  failIntermediateFrames = true;
  const track = await openAtProcess(page);
  await moveOneStation(page, track, "down", 2);
  await moveOneStation(page, track, "down", 3);
  await trustedVerticalGesture(page, "down");
  await expect.poll(() => stationOf(track)).toBe(4);

  // The final outward gesture is also absorbed until step 4 has actually
  // played. Failed image detail must neither release it early nor hold it after
  // the wall-clock playhead reaches the prepared endpoint.
  await page.waitForTimeout(100);
  const beforeExit = await page.evaluate(() => window.scrollY);
  await trustedVerticalGesture(page, "down");
  await expect.poll(() => stationOf(track)).toBe(4);
  await expect(page.locator("html")).toHaveAttribute("data-scrub-pinned", "");

  await expect
    .poll(
      () =>
        track.evaluate((element) =>
          Number.parseFloat(element.dataset.processPlayhead ?? "0")
        ),
      { timeout: 9_000 }
    )
    .toBeGreaterThan(0.999);
  await expect(track).toHaveAttribute("data-process-playback-settled", "true");

  await trustedVerticalGesture(page, "down");
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(beforeExit + 100);
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-scrub-pinned",
    ""
  );
});

test("a fresh upward gesture exits from step one", async ({ page }) => {
  const track = await openAtProcess(page);
  const beforeExit = await page.evaluate(() => window.scrollY);

  await trustedVerticalGesture(page, "up");

  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeLessThan(beforeExit - 100);
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-scrub-pinned",
    ""
  );
  await expect(track).toHaveAttribute(
    "data-process-navigation-phase",
    "outside"
  );
});

test("back to top remains an immediate native escape", async ({ page }) => {
  const track = await openAtProcess(page);
  await trustedVerticalGesture(page, "down");
  await expect.poll(() => stationOf(track)).toBe(2);

  await page.locator(".back-to-top-control").evaluate((button) => {
    (button as HTMLButtonElement).click();
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(10);
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-scrub-pinned",
    ""
  );
});
