import { expect, test, type Page } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const FRAME = readFileSync(
  resolve(process.cwd(), "public/images/poster-hero.jpg")
);
let server: Server;
let intermediateMode: "ok" | "fail" = "ok";
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
    if (intermediateMode === "fail" && !isProbe) {
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

function serveSequence(intermediates: "ok" | "fail") {
  intermediateMode = intermediates;
  requestedFrames = [];
}

async function openAtProcess(page: Page) {
  await page.goto("/");
  const track = page.locator('[data-process-controller="mobile"]');
  await expect(track).toHaveCount(1);
  await track.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    window.scrollTo({
      top: window.scrollY + rect.top,
      behavior: "instant",
    });
  });
  await expect(track).toHaveAttribute("data-process-pinned", "");
  await expect(track).toHaveAttribute("data-process-station", "1");
  // Arrival deliberately spends the gesture/cooldown that reached the stage.
  await page.waitForTimeout(500);
  return track;
}

async function verticalGesture(
  page: Page,
  direction: "down" | "up",
  pointerId = 1
) {
  const stage = page.locator(".process-scrub__stage");
  const startY = direction === "down" ? 700 : 140;
  const endY = direction === "down" ? 80 : 760;
  await stage.dispatchEvent("pointerdown", {
    pointerId,
    pointerType: "touch",
    isPrimary: true,
    buttons: 1,
    clientX: 195,
    clientY: startY,
  });
  // Several extreme moves are still one gesture and therefore one station.
  await stage.dispatchEvent("pointermove", {
    pointerId,
    pointerType: "touch",
    isPrimary: true,
    buttons: 1,
    clientX: 195,
    clientY: endY,
  });
  await stage.dispatchEvent("pointermove", {
    pointerId,
    pointerType: "touch",
    isPrimary: true,
    buttons: 1,
    clientX: 195,
    clientY: direction === "down" ? 20 : 820,
  });
  await stage.dispatchEvent("pointerup", {
    pointerId,
    pointerType: "touch",
    isPrimary: true,
    buttons: 0,
    clientX: 195,
    clientY: endY,
  });
}

test("mobile gestures move exactly one station and keep viewport geometry frozen", async ({
  page,
}) => {
  serveSequence("ok");
  await page.setViewportSize({ width: 390, height: 664 });
  const track = await openAtProcess(page);

  const frozenViewport = await track.evaluate((element) =>
    Number.parseFloat(
      getComputedStyle(element).getPropertyValue("--process-viewport")
    )
  );
  expect(frozenViewport).toBeGreaterThan(600);
  await expect
    .poll(() => requestedFrames.length)
    .toBeGreaterThanOrEqual(5);
  expect(requestedFrames.slice(2, 5)).toEqual([
    "/motion/pearl/m/f_061.webp",
    "/motion/pearl/m/f_121.webp",
    "/motion/pearl/m/f_179.webp",
  ]);

  // Models Safari's toolbar changing the visible viewport while the stage is
  // active. The station coordinate system must not move underneath a gesture.
  await page.setViewportSize({ width: 390, height: 740 });
  await expect
    .poll(() =>
      track.evaluate((element) =>
        Number.parseFloat(
          getComputedStyle(element).getPropertyValue("--process-viewport")
        )
      )
    )
    .toBe(frozenViewport);

  await verticalGesture(page, "down");
  await expect(track).toHaveAttribute("data-process-station", "2");
  await page.waitForTimeout(500);

  // Two fingers cancel rather than buying two steps.
  const stage = page.locator(".process-scrub__stage");
  await stage.dispatchEvent("pointerdown", {
    pointerId: 11,
    pointerType: "touch",
    isPrimary: true,
    buttons: 1,
    clientX: 180,
    clientY: 700,
  });
  await stage.dispatchEvent("pointerdown", {
    pointerId: 12,
    pointerType: "touch",
    isPrimary: false,
    buttons: 1,
    clientX: 220,
    clientY: 700,
  });
  await stage.dispatchEvent("pointermove", {
    pointerId: 11,
    pointerType: "touch",
    isPrimary: true,
    buttons: 1,
    clientX: 180,
    clientY: 40,
  });
  await stage.dispatchEvent("pointerup", {
    pointerId: 11,
    pointerType: "touch",
    isPrimary: true,
    buttons: 0,
    clientX: 180,
    clientY: 40,
  });
  await stage.dispatchEvent("pointerup", {
    pointerId: 12,
    pointerType: "touch",
    isPrimary: false,
    buttons: 0,
    clientX: 220,
    clientY: 700,
  });
  await expect(track).toHaveAttribute("data-process-station", "2");

  await verticalGesture(page, "down", 21);
  await expect(track).toHaveAttribute("data-process-station", "3");
  await page.waitForTimeout(500);
  await verticalGesture(page, "down", 22);
  await expect(track).toHaveAttribute("data-process-station", "4");
  await page.waitForTimeout(500);

  // A hard reverse gesture returns by one station, never through the sequence.
  await verticalGesture(page, "up", 23);
  await expect(track).toHaveAttribute("data-process-station", "3");
});

test("slow animation frames and failed media can never lock station navigation", async ({
  page,
}) => {
  // Four rAF callbacks per second reproduces the rate already observed while
  // iPhone Safari decodes the sequence. The old 100ms delta cap took ~6 seconds
  // per act at this rate.
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
  serveSequence("fail");
  const track = await openAtProcess(page);

  await verticalGesture(page, "down");
  await expect(track).toHaveAttribute("data-process-station", "2");
  await expect
    .poll(
      () =>
        track.evaluate((element) =>
          Number.parseFloat(element.dataset.processPlayhead ?? "0")
        ),
      { timeout: 3_400 }
    )
    .toBeGreaterThan(0.32);

  await verticalGesture(page, "down", 31);
  await expect(track).toHaveAttribute("data-process-station", "3");
  await page.waitForTimeout(500);
  await verticalGesture(page, "down", 32);
  await expect(track).toHaveAttribute("data-process-station", "4");
  await page.waitForTimeout(500);
  await verticalGesture(page, "down", 33);
  await expect(track).not.toHaveAttribute("data-process-pinned", "");
});

test("back to top remains an immediate process bypass", async ({ page }) => {
  serveSequence("ok");
  const track = await openAtProcess(page);
  await verticalGesture(page, "down");
  await expect(track).toHaveAttribute("data-process-station", "2");

  await page.locator(".back-to-top-control").evaluate((button) => {
    (button as HTMLButtonElement).click();
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(10);
  await expect(track).not.toHaveAttribute("data-process-pinned", "");
});
