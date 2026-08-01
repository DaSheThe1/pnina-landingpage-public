import { expect, test, type Page } from "@playwright/test";

const PROCESS_MEDIA_PATH = "/motion/pearl/";
const PROCESS_VIDEO_GLOB = "**/motion/pearl/process-*.mp4";

let failVideo = false;
let videoDelayMs = 0;
let requestedMedia: string[] = [];

test.skip(
  process.env.PLAYWRIGHT_PROCESS_MOTION !== "1",
  "Run through pnpm test:motion."
);

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
  deviceScaleFactor: 3,
});

test.beforeEach(async ({ page }) => {
  failVideo = false;
  videoDelayMs = 0;
  requestedMedia = [];

  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (path.startsWith(PROCESS_MEDIA_PATH)) requestedMedia.push(path);
  });

  await page.route(PROCESS_VIDEO_GLOB, async (route) => {
    if (videoDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, videoDelayMs));
    }
    if (failVideo) {
      await route.abort("failed");
      return;
    }
    await route.continue();
  });
});

async function trackTop(track: ReturnType<Page["locator"]>) {
  return track.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return window.scrollY + rect.top;
  });
}

async function goToProgress(
  page: Page,
  track: ReturnType<Page["locator"]>,
  progress: number,
  options: { holdTouch?: boolean } = {}
) {
  /*
   * Keep synthetic positioning deterministic by default. Tests that exercise
   * the real settle explicitly release this touch after choosing a midpoint.
   */
  if (options.holdTouch ?? true) {
    await page.evaluate(() =>
      window.dispatchEvent(new Event("touchstart"))
    );
  }
  const geometry = await track.evaluate((element) => {
    const stage = element.querySelector<HTMLElement>(
      ".process-scrub__stage"
    );
    const rect = element.getBoundingClientRect();
    return {
      top: window.scrollY + rect.top,
      travel: Math.max(1, rect.height - (stage?.getBoundingClientRect().height ?? window.innerHeight)),
    };
  });
  await page.evaluate(
    ({ top, travel, value }) => {
      window.scrollTo({
        top: top + travel * value,
        behavior: "instant",
      });
    },
    { ...geometry, value: progress }
  );
  await expect
    .poll(() =>
      track
        .getAttribute("data-process-progress")
        .then((value) => Number.parseFloat(value ?? "0"))
    )
    .toBeCloseTo(progress, 2);
}

async function releaseTouch(page: Page) {
  await page.evaluate(() => {
    const event = new Event("touchend");
    Object.defineProperty(event, "touches", { value: { length: 0 } });
    window.dispatchEvent(event);
  });
}

async function beginTouch(page: Page, touches = 1) {
  await page.evaluate((touchCount) => {
    const event = new Event("touchstart");
    Object.defineProperty(event, "touches", {
      value: { length: touchCount },
    });
    window.dispatchEvent(event);
  }, touches);
}

async function endTouch(page: Page, touches = 0) {
  await page.evaluate((touchCount) => {
    const event = new Event("touchend");
    Object.defineProperty(event, "touches", {
      value: { length: touchCount },
    });
    window.dispatchEvent(event);
  }, touches);
}

async function heldTouchScroll(page: Page, distance: number) {
  await beginTouch(page);
  // Holding before one continuous move exercises the slow-drag path without
  // manufacturing several programmatic scrollend events.
  await page.waitForTimeout(180);
  await page.evaluate(
    (amount) =>
      window.scrollBy({ top: amount, behavior: "instant" }),
    distance
  );
  await page.waitForTimeout(45);
  await endTouch(page);
}

async function expectProcessStep(
  track: ReturnType<Page["locator"]>,
  step: number
) {
  await expect(track).toHaveAttribute(
    "data-process-active-step",
    String(step)
  );
  await expect
    .poll(() =>
      track
        .getAttribute("data-process-progress")
        .then((value) => Number.parseFloat(value ?? "0"))
    )
    .toBeCloseTo((step - 1) / 3, 2);
  await expect(track).not.toHaveAttribute("data-process-settling");
}

async function copyRailState(track: ReturnType<Page["locator"]>) {
  return track.evaluate((element) => {
    const panel = element.querySelector<HTMLElement>(".scrub-copy");
    const rail = element.querySelector<HTMLElement>(".scrub-copy__rail");
    const panelRect = panel?.getBoundingClientRect();
    const railRect = rail?.getBoundingClientRect();
    return {
      panel: panelRect
        ? {
            left: panelRect.left,
            right: panelRect.right,
            innerLeft: panelRect.left + panel!.clientLeft,
            top: panelRect.top,
            bottom: panelRect.bottom,
            background: getComputedStyle(panel!).backgroundColor,
            color: getComputedStyle(panel!).color,
            backdrop: getComputedStyle(panel!).backdropFilter,
            height: panelRect.height,
            opacity: Number.parseFloat(getComputedStyle(panel!).opacity),
          }
        : null,
      rail: railRect
        ? {
            left: railRect.left,
            width: railRect.width,
            transform: getComputedStyle(rail!).transform,
          }
        : null,
      slides: [
        ...element.querySelectorAll<HTMLElement>(".scrub-copy__slide"),
      ].map((slide) => {
        const rect = slide.getBoundingClientRect();
        const style = getComputedStyle(slide);
        return {
          left: rect.left,
          right: rect.right,
          background: style.backgroundColor,
          opacity: Number.parseFloat(style.opacity),
          intersectsPanel:
            !!panelRect &&
            rect.right > panelRect.left &&
            rect.left < panelRect.right &&
            rect.bottom > panelRect.top &&
            rect.top < panelRect.bottom,
        };
      }),
    };
  });
}

async function neighboringRevealOpacity(
  track: ReturnType<Page["locator"]>,
  side: "before" | "after"
) {
  return track.evaluate((element, neighboringSide) => {
    const process = element.closest("#process");
    const section =
      neighboringSide === "before"
        ? process?.previousElementSibling
        : process?.nextElementSibling;
    const reveal = section?.querySelector<HTMLElement>("[data-reveal]");
    return reveal ? Number.parseFloat(getComputedStyle(reveal).opacity) : -1;
  }, side);
}

test("final phone geometry, poster and step one exist before video succeeds", async ({
  page,
}) => {
  videoDelayMs = 2_000;
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const track = page.locator("[data-process-track]");
  await expect(track).toHaveCount(1);
  await expect(track).toHaveAttribute("data-process-active-step", "1");

  const firstHeight = await track.evaluate(
    (element) => (element as HTMLElement).offsetHeight
  );
  expect(firstHeight).toBeGreaterThanOrEqual(3_000);
  const firstAudienceTop = await page.locator("#audience").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return window.scrollY + rect.top;
  });

  const poster = track.locator(".process-scrub__poster");
  await expect
    .poll(() =>
      poster.evaluate((element) => getComputedStyle(element).backgroundImage)
    )
    .toContain("process-mobile-poster.webp");

  const copy = await copyRailState(track);
  expect(copy.panel?.opacity).toBe(1);
  expect(copy.panel?.background).toBe("rgba(28, 20, 17, 0.68)");
  expect(copy.panel?.color).toBe("rgb(255, 248, 245)");
  expect(copy.panel?.backdrop).toBe("none");
  expect(copy.slides[0].intersectsPanel).toBe(true);
  expect(copy.slides.every((slide) => slide.background === "rgba(0, 0, 0, 0)")).toBe(
    true
  );

  await page.waitForTimeout(700);
  expect(
    await track.evaluate((element) => (element as HTMLElement).offsetHeight)
  ).toBe(firstHeight);
  expect(
    await page.locator("#audience").evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return window.scrollY + rect.top;
    })
  ).toBeCloseTo(firstAudienceTop, 0);
});

test("one translucent panel carries a real scroll-linked horizontal text rail", async ({
  page,
}) => {
  await page.goto("/");
  const track = page.locator("[data-process-track]");

  await goToProgress(page, track, 1 / 6, { holdTouch: true });
  const halfway = await copyRailState(track);
  expect(halfway.panel?.opacity).toBe(1);
  expect(halfway.rail?.transform).not.toBe("none");
  expect(halfway.slides[0].intersectsPanel).toBe(true);
  expect(halfway.slides[1].intersectsPanel).toBe(true);
  expect(halfway.slides.every((slide) => slide.opacity === 1)).toBe(true);

  await goToProgress(page, track, 1 / 3);
  await expect(track).toHaveAttribute("data-process-active-step", "2");
  const settled = await copyRailState(track);
  expect(settled.slides[1].intersectsPanel).toBe(true);
  expect(settled.slides[1].left).toBeCloseTo(
    settled.panel?.innerLeft ?? 0,
    0
  );
  expect(settled.slides[1].opacity).toBe(1);
  await releaseTouch(page);
});

test("phone visual copy is concise while the complete story remains available", async ({
  page,
}) => {
  await page.goto("/");
  const track = page.locator("[data-process-track]");
  const copy = await track.evaluate((element) => {
    const steps = [
      ...element.querySelectorAll<HTMLElement>("[data-process-copy-step]"),
    ];
    const display = (selector: string, step: number) =>
      getComputedStyle(
        steps[step - 1].querySelector<HTMLElement>(selector)!
      ).display;
    return {
      panelHeight: element
        .querySelector<HTMLElement>("[data-process-copy-panel]")!
        .getBoundingClientRect().height,
      stepTwoTitle:
        steps[1].querySelector<HTMLElement>(
          "[data-process-copy-title]"
        )!.innerText,
      stepTwoSecondLine: display(
        '[data-process-copy-line="2"]',
        2
      ),
      stepThreeFourthLine: display(
        '[data-process-copy-line="4"]',
        3
      ),
      stepFourSecondLine: display(
        '[data-process-copy-line="2"]',
        4
      ),
      endpoint: display("[data-process-copy-endpoint]", 4),
      semanticSteps:
        element.querySelectorAll(":scope > .sr-only li").length,
    };
  });

  expect(copy.panelHeight).toBeLessThan(300);
  expect(copy.stepTwoTitle).toBe("אנחנו מבינות יחד איפה את היום");
  expect(copy.stepTwoSecondLine).toBe("none");
  expect(copy.stepThreeFourthLine).toBe("none");
  expect(copy.stepFourSecondLine).toBe("none");
  expect(copy.endpoint).toBe("none");
  expect(copy.semanticSteps).toBe(4);
});

test("a released phone scroll settles to the closest step and replaces an interrupted target", async ({
  page,
}) => {
  await page.goto("/");
  const track = page.locator("[data-process-track]");

  // Position 1.38 is closer to step 2 than step 3.
  await goToProgress(page, track, 0.46, { holdTouch: true });
  await releaseTouch(page);
  await expect
    .poll(() =>
      track
        .getAttribute("data-process-progress")
        .then((value) => Number.parseFloat(value ?? "0"))
    )
    .toBeCloseTo(1 / 3, 2);
  await expect(track).toHaveAttribute("data-process-active-step", "2");
  await expect(track).not.toHaveAttribute("data-process-settling");

  // Position 1.62 is closer to step 3, so settling initially aims there.
  await goToProgress(page, track, 0.54, { holdTouch: true });
  await releaseTouch(page);
  await expect(track).toHaveAttribute("data-process-settling", "3");

  // A fresh touch replaces that target; no stale step-3 move may run later.
  await goToProgress(page, track, 0.46, { holdTouch: true });
  await releaseTouch(page);
  await expect
    .poll(() =>
      track
        .getAttribute("data-process-progress")
        .then((value) => Number.parseFloat(value ?? "0"))
    )
    .toBeCloseTo(1 / 3, 2);
  await page.waitForTimeout(500);
  await expect(track).toHaveAttribute("data-process-active-step", "2");
  await expect(track).not.toHaveAttribute("data-process-settling");
});

test("slow short phone drags advance one step forward and backward", async ({
  page,
}) => {
  await page.goto("/");
  const track = page.locator("[data-process-track]");
  await expect(track).toHaveAttribute("data-process-controller", "ready");

  await goToProgress(page, track, 0, { holdTouch: true });
  await releaseTouch(page);
  await expectProcessStep(track, 1);

  // 72px is well below half of the ~585px station distance on this phone.
  await heldTouchScroll(page, 72);
  await expectProcessStep(track, 2);
  await heldTouchScroll(page, 72);
  await expectProcessStep(track, 3);
  await heldTouchScroll(page, 72);
  await expectProcessStep(track, 4);

  await heldTouchScroll(page, -72);
  await expectProcessStep(track, 3);

  // A tiny accidental movement still returns to the current station.
  await heldTouchScroll(page, 20);
  await expectProcessStep(track, 3);
});

test("one touch gesture cannot skip stations and endpoint gestures still exit", async ({
  page,
}) => {
  await page.goto("/");
  const track = page.locator("[data-process-track]");
  await expect(track).toHaveAttribute("data-process-controller", "ready");

  await goToProgress(page, track, 0, { holdTouch: true });
  await releaseTouch(page);
  await expectProcessStep(track, 1);

  // Simulate a large momentum result plus a second finger: it is still one
  // gesture, so it may request only the adjacent station.
  await beginTouch(page);
  await beginTouch(page, 2);
  await page.evaluate(() =>
    window.scrollBy({ top: 1_400, behavior: "instant" })
  );
  await endTouch(page, 1);
  await page.waitForTimeout(60);
  await endTouch(page);
  await expectProcessStep(track, 2);

  await goToProgress(page, track, 1, { holdTouch: true });
  await releaseTouch(page);
  await expectProcessStep(track, 4);
  const finalStationY = await page.evaluate(() => window.scrollY);

  // Only a gesture that starts on the final station may leave downward.
  await heldTouchScroll(page, 120);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(finalStationY + 80);
  await expect(track).not.toHaveAttribute("data-process-settling");
  await expect(page.locator("#audience")).toBeInViewport();
});

test("a reverse fling after step four may leave above without being pulled back", async ({
  page,
}) => {
  await page.goto("/");
  const track = page.locator("[data-process-track]");
  await expect(track).toHaveAttribute("data-process-controller", "ready");

  await goToProgress(page, track, 1, { holdTouch: true });
  await releaseTouch(page);
  await expectProcessStep(track, 4);

  const top = await trackTop(track);
  const reverseDestination = top - 900;
  await beginTouch(page);
  await page.evaluate(
    (target) =>
      window.scrollTo({ top: target, behavior: "instant" }),
    reverseDestination
  );
  await endTouch(page);

  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeLessThan(top - 800);
  await page.waitForTimeout(700);
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeCloseTo(reverseDestination, 0);
  await expect(track).not.toHaveAttribute("data-process-settling");
});

test("desktop keeps full copy on the physical right and does not auto-settle", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const track = page.locator("[data-process-track]");
  await goToProgress(page, track, 0.46, { holdTouch: false });
  await page.waitForTimeout(500);

  const state = await track.evaluate((element) => {
    const panel = element.querySelector<HTMLElement>(
      "[data-process-copy-panel]"
    )!;
    const stepTwo = element.querySelector<HTMLElement>(
      '[data-process-copy-step="2"]'
    )!;
    return {
      panel: panel.getBoundingClientRect().toJSON(),
      viewportWidth: window.innerWidth,
      progress: Number.parseFloat(
        element.getAttribute("data-process-progress") ?? "0"
      ),
      settling: element.hasAttribute("data-process-settling"),
      title: stepTwo.querySelector<HTMLElement>(
        "[data-process-copy-title]"
      )!.innerText,
      secondLine: getComputedStyle(
        stepTwo.querySelector<HTMLElement>(
          '[data-process-copy-line="2"]'
        )!
      ).display,
      endpoint: getComputedStyle(
        element.querySelector<HTMLElement>(
          "[data-process-copy-endpoint]"
        )!
      ).display,
    };
  });

  expect(state.panel.left).toBeGreaterThan(state.viewportWidth / 2);
  expect(state.panel.right).toBeLessThanOrEqual(state.viewportWidth);
  expect(state.progress).toBeCloseTo(0.46, 2);
  expect(state.settling).toBe(false);
  expect(state.title).toBe(
    "אנחנו מבינות יחד איפה את נמצאת היום"
  );
  expect(state.secondLine).toBe("block");
  expect(state.endpoint).toBe("block");
});

test("one hard phone-sized native gesture cannot cross the whole process", async ({
  page,
}) => {
  await page.goto("/");
  const track = page.locator("[data-process-track]");
  const top = await trackTop(track);
  const height = await track.evaluate(
    (element) => (element as HTMLElement).offsetHeight
  );

  await page.evaluate(
    (value) => window.scrollTo({ top: value, behavior: "instant" }),
    top
  );
  await page.evaluate(() =>
    window.scrollBy({ top: 2_200, behavior: "instant" })
  );

  const scrollY = await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(top + 1_000)
    .then(() => page.evaluate(() => window.scrollY));
  expect(scrollY).toBeLessThanOrEqual(top + height - 844 + 1);
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-process-scroll-locked",
    ""
  );
  expect(
    await page.locator("body").evaluate((element) => {
      const style = getComputedStyle(element);
      return { overflow: style.overflow, position: style.position };
    })
  ).toEqual({ overflow: "visible", position: "static" });
  expect(
    (await copyRailState(track)).slides.some(
      (slide) => slide.intersectsPanel && slide.opacity === 1
    )
  ).toBe(true);
});

test("failed video leaves poster, step four and following navigation usable", async ({
  page,
}) => {
  failVideo = true;
  await page.goto("/");
  const track = page.locator("[data-process-track]");
  await goToProgress(page, track, 1);

  await expect(track).toHaveAttribute("data-process-active-step", "4");
  await expect(track).toHaveAttribute("data-process-media-failed", "true");
  const finalCopy = await copyRailState(track);
  expect(finalCopy.slides[3].intersectsPanel).toBe(true);
  expect(finalCopy.slides[3].opacity).toBe(1);
  expect(
    await track
      .locator(".process-scrub__poster")
      .evaluate((element) => getComputedStyle(element).backgroundImage)
  ).toContain("process-mobile-poster.webp");

  const audienceTop = await page.locator("#audience").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return window.scrollY + rect.top;
  });
  await page.evaluate(
    (top) => window.scrollTo({ top: top + 100, behavior: "instant" }),
    audienceTop
  );
  await expect(page.locator("#audience")).toBeInViewport();
});

test("the phone process uses one video asset instead of a WebP frame burst", async ({
  page,
}) => {
  await page.goto("/");
  const track = page.locator("[data-process-track]");
  await goToProgress(page, track, 0.05);

  await expect
    .poll(
      () =>
        new Set(
          requestedMedia.filter((path) =>
            path.endsWith("process-mobile.mp4")
          )
        ).size
    )
    .toBe(1);
  expect(requestedMedia.some((path) => /\/f_\d+\.webp$/.test(path))).toBe(
    false
  );
  // A video element may issue a few byte-range requests while seeking; they
  // all target the same asset and are not a frame-file burst.
  expect(
    requestedMedia.filter((path) => path.endsWith(".mp4")).length
  ).toBeLessThanOrEqual(6);
});

test("the in-site reduced-motion choice shows all cards and requests no process media", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "penina-accessibility",
      JSON.stringify({
        version: 1,
        preferences: {
          textScale: 100,
          enhancedContrast: false,
          comfortableSpacing: false,
          reduceMotion: true,
          emphasizeLinks: false,
        },
      })
    );
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  const experience = page.locator(".process-experience");
  await expect(page.locator("html")).toHaveAttribute(
    "data-a11y-reduce-motion",
    "true"
  );
  expect(
    await experience
      .locator(".process-experience__motion")
      .evaluate((element) => getComputedStyle(element).display)
  ).toBe("none");
  expect(
    await experience
      .locator(".process-experience__static")
      .evaluate((element) => getComputedStyle(element).display)
  ).toBe("block");
  await expect(
    experience.locator(".process-experience__static article")
  ).toHaveCount(4);
  await page.waitForTimeout(300);
  expect(requestedMedia).toEqual([]);
});

test("Save-Data exposes static cards before paint and requests no process media", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "connection", {
      configurable: true,
      value: {
        saveData: true,
        addEventListener() {},
        removeEventListener() {},
      },
    });
  });

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-save-data", "true");
  expect(
    await page
      .locator(".process-experience__motion")
      .evaluate((element) => getComputedStyle(element).display)
  ).toBe("none");
  expect(
    await page
      .locator(".process-experience__static")
      .evaluate((element) => getComputedStyle(element).display)
  ).toBe("block");
  await page.waitForTimeout(300);
  expect(requestedMedia).toEqual([]);
});

test("neighboring sections remain painted at both process boundaries", async ({
  page,
}) => {
  await page.goto("/");
  const track = page.locator("[data-process-track]");

  await goToProgress(page, track, 0.02);
  await expect
    .poll(() => neighboringRevealOpacity(track, "before"))
    .toBe(1);

  await goToProgress(page, track, 0.98);
  await expect
    .poll(() => neighboringRevealOpacity(track, "after"))
    .toBe(1);

  expect(
    await page
      .locator("[data-reveal]")
      .evaluateAll((elements) =>
        elements.every(
          (element) => Number.parseFloat(getComputedStyle(element).opacity) === 1
        )
      )
  ).toBe(true);

  const boundaryPaint = await track.evaluate((element) => {
    const process = element.closest("#process");
    const before = process?.previousElementSibling;
    const after = process?.nextElementSibling;
    const beforeSurface =
      before?.matches(".process-boundary-surface")
        ? before
        : before?.querySelector(".process-boundary-surface");
    const afterSurface =
      after?.matches(".process-boundary-surface")
        ? after
        : after?.querySelector(".process-boundary-surface");
    const state = (surface: Element | null | undefined) => {
      if (!surface) return null;
      const style = getComputedStyle(surface);
      return {
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        backgroundAttachment: style.backgroundAttachment,
      };
    };
    const audienceCard = after?.querySelector<HTMLElement>(
      ".process-boundary-card"
    );
    const founderGlow = before?.querySelector<HTMLElement>(
      ".process-founder-glow"
    );
    return {
      before: state(beforeSurface),
      after: state(afterSurface),
      audienceBackdrop: audienceCard
        ? getComputedStyle(audienceCard).backdropFilter
        : null,
      founderFilter: founderGlow
        ? getComputedStyle(founderGlow).filter
        : null,
      mobileBlobs: [
        ...document.querySelectorAll<HTMLElement>(".site-bg__blob"),
      ].map((blob) => getComputedStyle(blob).display),
      ambientAnimation: getComputedStyle(
        document.querySelector<HTMLElement>(".site-bg__inner")!
      ).animationName,
    };
  });
  expect(boundaryPaint.before?.backgroundColor).toBe(
    "rgb(251, 247, 241)"
  );
  expect(boundaryPaint.before?.backgroundImage).toContain(
    "sand-light-portrait.webp"
  );
  expect(boundaryPaint.before?.backgroundAttachment).toBe("scroll");
  expect(boundaryPaint.after?.backgroundColor).toBe(
    "rgb(251, 247, 241)"
  );
  expect(boundaryPaint.after?.backgroundImage).toContain(
    "sand-light-portrait.webp"
  );
  expect(boundaryPaint.after?.backgroundAttachment).toBe("scroll");
  expect(boundaryPaint.audienceBackdrop).toBe("none");
  expect(boundaryPaint.founderFilter).toBe("none");
  expect(boundaryPaint.mobileBlobs.every((display) => display === "none")).toBe(
    true
  );
  expect(boundaryPaint.ambientAnimation).toContain("bg-drift-mobile");
});

test("a real reload starts at the top rather than restoring the process position", async ({
  page,
}) => {
  await page.goto("/");
  const track = page.locator("[data-process-track]");
  await goToProgress(page, track, 0.7);
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(1_000);

  await page.reload();
  await expect
    .poll(() => page.evaluate(() => window.scrollY), { timeout: 5_000 })
    .toBeLessThan(5);
});

test("back to top remains an immediate native escape", async ({ page }) => {
  await page.goto("/");
  const track = page.locator("[data-process-track]");
  await goToProgress(page, track, 0.6);

  await page.locator(".back-to-top-control").evaluate((button) => {
    (button as HTMLButtonElement).click();
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(10);
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-scrub-pinned",
    ""
  );
});
