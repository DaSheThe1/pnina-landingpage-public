import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

function formatViolations(
  violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]
) {
  return violations
    .map(
      (violation) =>
        `${violation.id} (${violation.impact ?? "unknown"}): ${
          violation.help
        }\n${violation.nodes
          .map((node) => `  ${node.target.join(" ")}: ${node.failureSummary}`)
          .join("\n")}`
    )
    .join("\n\n");
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  expect(results.violations, formatViolations(results.violations)).toEqual([]);
}

const auditRoutes = ["/", "/contact", "/accessibility"] as const;

async function openAccessibilityPanel(page: Page) {
  const launcher = page.getByRole("button", { name: "אפשרויות נגישות" });
  await launcher.focus();
  await launcher.press("Enter");
}

test.describe("automated WCAG checks", () => {
  for (const path of auditRoutes) {
    test(`has no axe violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expectNoAxeViolations(page);
    });
  }
});

test("saved preferences are applied before React hydration", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "penina-accessibility",
      JSON.stringify({
        version: 1,
        preferences: {
          textScale: 130,
          enhancedContrast: true,
          comfortableSpacing: true,
          reduceMotion: true,
          emphasizeLinks: true,
        },
      })
    );
  });
  // The inline boot script must be sufficient on its own. Blocking the external
  // Next.js bundles keeps the React provider from hydrating during this check.
  await page.route(/\/_next\/static\/.*\.js(?:\?.*)?$/, (route) =>
    route.abort()
  );

  await page.goto("/", { waitUntil: "domcontentloaded" });
  const root = page.locator("html");
  await expect(root).toHaveAttribute("data-a11y-text-scale", "130");
  await expect(root).toHaveAttribute("data-a11y-enhanced-contrast", "true");
  await expect(root).toHaveAttribute("data-a11y-comfortable-spacing", "true");
  await expect(root).toHaveAttribute("data-a11y-reduce-motion", "true");
  await expect(root).toHaveAttribute("data-a11y-emphasize-links", "true");
});

// Daniel's 2026-07-30 contract (CLAUDE.md rule 5): the site moves for everyone
// by default and the device's own reduced-motion setting drives nothing. This
// test used to assert the opposite — that the OS preference seeded the switch on
// pre-paint — and it is inverted on purpose, not relaxed.
test("the device motion preference does not switch the site's own control on", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route(/\/_next\/static\/.*\.js(?:\?.*)?$/, (route) =>
    route.abort()
  );

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute(
    "data-a11y-reduce-motion",
    "false"
  );
  expect(
    await page.evaluate(() =>
      window.localStorage.getItem("penina-accessibility")
    )
  ).toBeNull();
});

test("with the OS asking for reduced motion, the switch stays off after hydration", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute(
    "data-a11y-reduce-motion",
    "false"
  );

  // And the panel agrees: the control a visitor sees is off, not pre-pressed.
  await openAccessibilityPanel(page);
  await expect(
    page.getByRole("button", { name: /הפחתת תנועה/ })
  ).toHaveAttribute("aria-pressed", "false");
});

test("skip link moves keyboard focus to the main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");

  const skipLink = page.getByRole("link", { name: "דילוג לתוכן הראשי" });
  await expect(skipLink).toBeFocused();
  await skipLink.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("closed mobile menu is inert and Escape restores its opener", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const menu = page.locator("#mobile-navigation");
  const opener = page.getByRole("button", { name: "פתיחת התפריט" });
  await expect(menu).toHaveAttribute("aria-hidden", "true");
  await expect(menu).toHaveAttribute("inert", "");
  await expect(
    page.getByRole("navigation", { name: "ניווט בתפריט" })
  ).toHaveCount(0);

  await opener.click();
  await expect(menu).toHaveAttribute("aria-hidden", "false");
  await expect(menu).not.toHaveAttribute("inert", "");
  await expect(
    page.getByRole("navigation", { name: "ניווט בתפריט" })
  ).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-hidden", "true");
  await expect(opener).toBeFocused();
});

test("lead dialog contains focus and restores it on close", async ({ page }) => {
  await page.goto("/");
  const opener = page
    .getByRole("banner")
    .getByRole("button", { name: /לשיחה ראשונה/ });
  await opener.click();

  const dialog = page.getByRole("dialog", { name: "השארת פרטים" });
  await expect(dialog).toBeVisible();
  await expect
    .poll(() =>
      dialog.evaluate((element) => element.contains(document.activeElement))
    )
    .toBe(true);

  for (let index = 0; index < 7; index += 1) {
    await page.keyboard.press("Tab");
    await expect
      .poll(() =>
        dialog.evaluate((element) => element.contains(document.activeElement))
      )
      .toBe(true);
  }

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("image viewer contains focus and restores its opener", async ({ page }) => {
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
  await page.goto("/");

  const opener = page.locator("[data-carousel]").first().getByRole("button").first();
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect
    .poll(() =>
      dialog.evaluate((element) => element.contains(document.activeElement))
    )
    .toBe(true);

  for (let index = 0; index < 6; index += 1) {
    await page.keyboard.press("Tab");
    await expect
      .poll(() =>
        dialog.evaluate((element) => element.contains(document.activeElement))
      )
      .toBe(true);
  }

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("contact errors describe invalid fields and focus the first one", async ({
  page,
}) => {
  await page.goto("/contact");

  const name = page.getByRole("textbox", { name: "שם", exact: true });
  const phone = page.getByRole("textbox", { name: "טלפון", exact: true });
  await page.getByRole("button", { name: "שלחי ואחזור אלייך" }).click();

  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute("required", "");
  await expect(phone).toHaveAttribute("required", "");
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(phone).toHaveAttribute("aria-invalid", "true");
  await expect(name).toHaveAccessibleDescription("אנא הזיני שם");
  await expect(phone).toHaveAccessibleDescription(
    "אנא הזיני מספר טלפון ישראלי תקין, למשל 050-0000000"
  );
});

test("all accessibility preferences persist and reset", async ({ page }) => {
  await page.goto("/");
  await openAccessibilityPanel(page);

  const increaseText = page.getByRole("button", {
    name: "הגדלת גודל הטקסט",
  });
  await increaseText.click();
  await increaseText.click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-a11y-text-scale",
    "130"
  );
  await expect(increaseText).toBeDisabled();

  const enhancedContrast = page.getByRole("button", {
    name: /ניגודיות מוגברת/,
  });
  const comfortableSpacing = page.getByRole("button", {
    name: /ריווח נוח לקריאה/,
  });
  const emphasizeLinks = page.getByRole("button", {
    name: /הדגשת קישורים/,
  });
  const reduceMotion = page.getByRole("button", {
    name: /הפחתת תנועה/,
  });

  await enhancedContrast.click();
  await comfortableSpacing.click();
  await emphasizeLinks.click();
  await reduceMotion.click();

  for (const control of [
    enhancedContrast,
    comfortableSpacing,
    emphasizeLinks,
    reduceMotion,
  ]) {
    await expect(control).toHaveAttribute("aria-pressed", "true");
  }

  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = window.localStorage.getItem("penina-accessibility");
        return raw ? JSON.parse(raw) : null;
      })
    )
    .toEqual({
      version: 1,
      preferences: {
        textScale: 130,
        enhancedContrast: true,
        comfortableSpacing: true,
        reduceMotion: true,
        emphasizeLinks: true,
      },
    });

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute(
    "data-a11y-text-scale",
    "130"
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-a11y-enhanced-contrast",
    "true"
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-a11y-comfortable-spacing",
    "true"
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-a11y-emphasize-links",
    "true"
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-a11y-reduce-motion",
    "true"
  );

  await openAccessibilityPanel(page);
  await page
    .getByRole("button", { name: "איפוס אפשרויות הנגישות" })
    .click();
  await expect(page.locator("html")).toHaveAttribute(
    "data-a11y-text-scale",
    "100"
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-a11y-enhanced-contrast",
    "false"
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-a11y-comfortable-spacing",
    "false"
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-a11y-emphasize-links",
    "false"
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-a11y-reduce-motion",
    "false"
  );
});

test("legacy preferences migrate without losing choices", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "penina-accessibility",
      JSON.stringify({
        reduceMotion: true,
        emphasizeLinks: true,
      })
    );
  });

  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute(
    "data-a11y-text-scale",
    "100"
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-a11y-emphasize-links",
    "true"
  );
  await expect(page.locator("html")).toHaveAttribute(
    "data-a11y-reduce-motion",
    "true"
  );
  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = window.localStorage.getItem("penina-accessibility");
        return raw ? JSON.parse(raw).version : null;
      })
    )
    .toBe(1);
});

test("malformed or blocked preference storage does not break the page", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("penina-accessibility", "{not-json");
  });
  await page.goto("/");
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute(
    "data-a11y-text-scale",
    "100"
  );
});

test("combined preferences and open panel pass WCAG checks", async ({ page }) => {
  await page.goto("/");
  await openAccessibilityPanel(page);
  const increaseText = page.getByRole("button", {
    name: "הגדלת גודל הטקסט",
  });
  await increaseText.click();
  await increaseText.click();
  await page.getByRole("button", { name: /ניגודיות מוגברת/ }).click();
  await page.getByRole("button", { name: /ריווח נוח לקריאה/ }).click();
  await page.getByRole("button", { name: /הדגשת קישורים/ }).click();
  await page.getByRole("button", { name: /הפחתת תנועה/ }).click();

  await expect(page.locator("html")).toHaveAttribute(
    "data-a11y-enhanced-contrast",
    "true"
  );
  await expectNoAxeViolations(page);
});

test("reduced motion stops automatic carousel progression", async ({ page }) => {
  await page.goto("/");
  const carousel = page.locator("[data-carousel]").first();
  await expect(carousel).toBeVisible();

  await openAccessibilityPanel(page);
  await page.getByRole("button", { name: /הפחתת תנועה/ }).click();
  await page
    .getByRole("button", { name: "סגירת אפשרויות הנגישות" })
    .click();

  const initialIndex = await carousel.getAttribute("data-carousel-index");
  await page.waitForTimeout(4_600);
  await expect(carousel).toHaveAttribute(
    "data-carousel-index",
    initialIndex ?? "0"
  );
  const videoPaused = await page
    .locator("video")
    .first()
    .evaluate((video) => (video as HTMLVideoElement).paused);
  expect(videoPaused).toBe(true);
});

test("the enlarged panel remains usable at 320px without page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await openAccessibilityPanel(page);

  const dialog = page.getByRole("dialog", { name: "אפשרויות נגישות" });
  await expect(dialog).toBeVisible();
  const displaySection = dialog
    .getByRole("heading", { name: "תצוגה", exact: true })
    .locator("..");
  const displayCards = displaySection.locator(":scope > div > *");
  await expect(displayCards).toHaveCount(2);
  const [pairedTextCardBox, pairedContrastCardBox] = await Promise.all([
    displayCards.nth(0).boundingBox(),
    displayCards.nth(1).boundingBox(),
  ]);
  expect(pairedTextCardBox).not.toBeNull();
  expect(pairedContrastCardBox).not.toBeNull();
  expect(pairedTextCardBox!.y).toBeCloseTo(pairedContrastCardBox!.y, 1);

  const textSizeLabel = dialog.locator("#accessibility-text-size-label");
  const contrastLabel = dialog
    .getByRole("button", { name: /ניגודיות מוגברת/ })
    .getByText("ניגודיות מוגברת", { exact: true });
  const [textLabelBox, contrastLabelBox] = await Promise.all([
    textSizeLabel.boundingBox(),
    contrastLabel.boundingBox(),
  ]);
  expect(textLabelBox).not.toBeNull();
  expect(contrastLabelBox).not.toBeNull();
  expect(textLabelBox!.y).toBeCloseTo(contrastLabelBox!.y, 1);

  await page.setViewportSize({ width: 320, height: 568 });
  const increaseText = page.getByRole("button", {
    name: "הגדלת גודל הטקסט",
  });
  await increaseText.click();
  await increaseText.click();

  const dialogBox = await dialog.boundingBox();
  expect(dialogBox).not.toBeNull();
  expect(dialogBox!.height).toBeLessThanOrEqual(568 * 0.62 + 2);
  const [stackedTextCardBox, stackedContrastCardBox] = await Promise.all([
    displayCards.nth(0).boundingBox(),
    displayCards.nth(1).boundingBox(),
  ]);
  expect(stackedTextCardBox).not.toBeNull();
  expect(stackedContrastCardBox).not.toBeNull();
  expect(stackedContrastCardBox!.y).toBeGreaterThanOrEqual(
    stackedTextCardBox!.y + stackedTextCardBox!.height
  );

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth
      )
    )
    .toBe(true);

  const reset = page.getByRole("button", {
    name: "איפוס אפשרויות הנגישות",
  });
  await reset.scrollIntoViewIfNeeded();
  await expect(reset).toBeVisible();
});

test("the primary floating actions are mirrored on one baseline", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const accessibility = page.getByRole("button", {
    name: "אפשרויות נגישות",
  });
  const whatsapp = page.locator(".floating-whatsapp-control");
  const [accessibilityBox, whatsappBox] = await Promise.all([
    accessibility.boundingBox(),
    whatsapp.boundingBox(),
  ]);

  expect(accessibilityBox).not.toBeNull();
  expect(whatsappBox).not.toBeNull();
  expect(accessibilityBox!.width).toBeCloseTo(56, 1);
  expect(accessibilityBox!.height).toBeCloseTo(56, 1);
  expect(whatsappBox!.width).toBeCloseTo(56, 1);
  expect(whatsappBox!.height).toBeCloseTo(56, 1);
  expect(accessibilityBox!.y).toBeCloseTo(whatsappBox!.y, 1);
  expect(accessibilityBox!.x).toBeCloseTo(20, 1);
  expect(390 - (whatsappBox!.x + whatsappBox!.width)).toBeCloseTo(20, 1);
});

test("fixed actions do not overlap the visible cookie choice", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      configurable: true,
      get: () => false,
    });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const notice = page.getByRole("dialog", { name: "הודעת עוגיות" });
  const accessibility = page.getByRole("button", {
    name: "אפשרויות נגישות",
  });
  const whatsapp = page.locator(".floating-whatsapp-control");
  await expect(notice).toBeVisible();

  const [noticeBox, accessibilityBox, whatsappBox] = await Promise.all([
    notice.boundingBox(),
    accessibility.boundingBox(),
    whatsapp.boundingBox(),
  ]);

  function overlaps(
    first: NonNullable<typeof noticeBox>,
    second: NonNullable<typeof noticeBox>
  ) {
    return !(
      first.x + first.width <= second.x ||
      second.x + second.width <= first.x ||
      first.y + first.height <= second.y ||
      second.y + second.height <= first.y
    );
  }

  expect(noticeBox).not.toBeNull();
  expect(accessibilityBox).not.toBeNull();
  expect(whatsappBox).not.toBeNull();
  expect(
    overlaps(noticeBox!, accessibilityBox!),
    "cookie choice overlaps the accessibility launcher"
  ).toBe(false);
  expect(
    overlaps(noticeBox!, whatsappBox!),
    "cookie choice overlaps the WhatsApp launcher"
  ).toBe(false);
  expect(accessibilityBox!.width).toBeCloseTo(whatsappBox!.width, 1);
  expect(accessibilityBox!.height).toBeCloseTo(whatsappBox!.height, 1);
  expect(accessibilityBox!.y).toBeCloseTo(whatsappBox!.y, 1);
});

test("statement links resolve from the panel and footer", async ({ page }) => {
  await page.goto("/");
  await openAccessibilityPanel(page);
  await page.getByRole("link", { name: "הצהרת נגישות" }).click();
  await expect(page).toHaveURL(/\/accessibility$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "הצהרת נגישות"
  );

  await page.goto("/");
  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: "הצהרת נגישות" })
    .click();
  await expect(page).toHaveURL(/\/accessibility$/);
});
