import { expect, test, type Page } from "@playwright/test";

const CONSENT_COOKIE = "penina_cookie_consent";
const STUBBED_GOOGLE_COOKIES = ["_ga", "_gcl_au"];
const GOOGLE_COOKIE_NAMES = [
  "_ga",
  "_gid",
  "_gat",
  "_gac_test",
  "_gcl_au",
];
const googleTagPattern = "**://www.googletagmanager.com/gtag/js**";

async function stubGoogleTag(page: Page): Promise<string[]> {
  const requests: string[] = [];

  // vanilla-cookieconsent suppresses its UI when navigator.webdriver is true.
  // These tests exercise the same visible path a human visitor receives.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      configurable: true,
      get: () => false,
    });
  });

  await page.route(googleTagPattern, async (route) => {
    requests.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: `
        document.cookie = "_ga=GA1.1.playwright; Path=/; SameSite=Lax";
        document.cookie = "_gcl_au=playwright; Path=/; SameSite=Lax";
      `,
    });
  });

  return requests;
}

async function cookieNames(page: Page): Promise<string[]> {
  return (await page.context().cookies()).map((cookie) => cookie.name);
}

async function expectNoGoogleCookies(page: Page) {
  const names = await cookieNames(page);
  for (const name of GOOGLE_COOKIE_NAMES) {
    expect(names).not.toContain(name);
  }
}

function srgbChannel(value: number): number {
  const channel = value / 255;
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(rgb: number[]): number {
  return (
    0.2126 * srgbChannel(rgb[0]) +
    0.7152 * srgbChannel(rgb[1]) +
    0.0722 * srgbChannel(rgb[2])
  );
}

function contrastRatio(foreground: number[], background: number[]): number {
  const brighter = Math.max(
    relativeLuminance(foreground),
    relativeLuminance(background)
  );
  const darker = Math.min(
    relativeLuminance(foreground),
    relativeLuminance(background)
  );
  return (brighter + 0.05) / (darker + 0.05);
}

function parseRgb(value: string): number[] {
  return [...value.matchAll(/\d+/g)].slice(0, 3).map(([part]) => Number(part));
}

test.describe("Google cookie consent", () => {
  test("is a compact Hebrew RTL choice and sends nothing before a decision", async ({
    page,
  }) => {
    const googleRequests = await stubGoogleTag(page);

    await page.goto("/");

    const notice = page.getByRole("dialog", { name: "הודעת עוגיות" });
    await expect(notice).toBeVisible();
    await expect(notice.locator(".cm__title")).toHaveCount(0);
    await expect(notice.locator(".cm__desc")).toContainText(
      "מי לא אוהבת עוגיות? רוצה אחת?"
    );
    // vanilla-cookieconsent inherits direction from the Hebrew document rather
    // than duplicating a dir attribute on the generated dialog.
    await expect(notice).toHaveCSS("direction", "rtl");

    const accept = notice.getByRole("button", { name: "כן, תודה" });
    const reject = notice.getByRole("button", { name: "לא תודה" });
    await expect(accept).toBeVisible();
    await expect(reject).toBeVisible();
    await expect(
      notice.getByRole("link", { name: "מידע נוסף" })
    ).toHaveAttribute("href", "/privacy");

    const box = await notice.boundingBox();
    const viewport = page.viewportSize();
    expect(box?.height).toBeLessThan(110);
    expect(box?.y ?? 0).toBeGreaterThan((viewport?.height ?? 0) / 2);

    const palette = await notice.evaluate((dialog) => {
      const acceptButton = dialog.querySelector<HTMLButtonElement>(
        ".cm__btn:not(.cm__btn--secondary)"
      );
      const rejectButton =
        dialog.querySelector<HTMLButtonElement>(".cm__btn--secondary");
      if (!acceptButton || !rejectButton) {
        throw new Error("Expected primary and secondary consent buttons");
      }

      const acceptStyle = getComputedStyle(acceptButton);
      const rejectStyle = getComputedStyle(rejectButton);
      const dialogStyle = getComputedStyle(dialog);
      const descriptionStyle = getComputedStyle(
        dialog.querySelector(".cm__desc") as HTMLElement
      );
      const privacyStyle = getComputedStyle(
        dialog.querySelector(".cm__desc a") as HTMLAnchorElement
      );

      return {
        acceptText: acceptStyle.color,
        acceptBackground: acceptStyle.backgroundColor,
        rejectText: rejectStyle.color,
        rejectBackground: rejectStyle.backgroundColor,
        rejectBorder: rejectStyle.borderColor,
        dialogBackground: dialogStyle.backgroundColor,
        descriptionText: descriptionStyle.color,
        privacyText: privacyStyle.color,
        cookieMark: getComputedStyle(dialog, "::before").backgroundImage,
      };
    });

    expect(
      contrastRatio(
        parseRgb(palette.acceptText),
        parseRgb(palette.acceptBackground)
      )
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(
        parseRgb(palette.acceptBackground),
        parseRgb(palette.dialogBackground)
      )
    ).toBeGreaterThanOrEqual(3);
    expect(
      contrastRatio(
        parseRgb(palette.rejectText),
        parseRgb(palette.rejectBackground)
      )
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(
        parseRgb(palette.rejectBorder),
        parseRgb(palette.dialogBackground)
      )
    ).toBeGreaterThanOrEqual(3);
    expect(
      contrastRatio(
        parseRgb(palette.descriptionText),
        parseRgb(palette.dialogBackground)
      )
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrastRatio(
        parseRgb(palette.privacyText),
        parseRgb(palette.dialogBackground)
      )
    ).toBeGreaterThanOrEqual(4.5);
    expect(palette.cookieMark).toContain("cookie-consent-cookie.png");

    expect(googleRequests).toEqual([]);
    await expect(
      page.locator('script[src*="googletagmanager.com"]')
    ).toHaveCount(0);
    expect(
      await page.evaluate(() => ({
        dataLayer: typeof window.dataLayer,
        gtag: typeof window.gtag,
      }))
    ).toEqual({ dataLayer: "undefined", gtag: "undefined" });
    expect(await cookieNames(page)).not.toContain(CONSENT_COOKIE);
    await expectNoGoogleCookies(page);
  });

  test("keeps both choices on one compact row on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await stubGoogleTag(page);
    await page.goto("/");

    const notice = page.getByRole("dialog", { name: "הודעת עוגיות" });
    const accept = notice.getByRole("button", { name: "כן, תודה" });
    const reject = notice.getByRole("button", { name: "לא תודה" });
    await expect(notice).toBeVisible();

    const [noticeBox, acceptBox, rejectBox] = await Promise.all([
      notice.boundingBox(),
      accept.boundingBox(),
      reject.boundingBox(),
    ]);

    expect(noticeBox?.height).toBeLessThan(110);
    expect(noticeBox?.x ?? -1).toBeGreaterThanOrEqual(8);
    expect(Math.abs((acceptBox?.y ?? 0) - (rejectBox?.y ?? 0))).toBeLessThan(2);
    await expect(notice.locator(".cm__body")).toHaveCSS(
      "flex-direction",
      "row"
    );
  });

  test("remembers No thanks without loading Google", async ({ page }) => {
    const googleRequests = await stubGoogleTag(page);

    await page.goto("/");
    await page.getByRole("button", { name: "לא תודה" }).click();
    await expect(
      page.getByRole("dialog", { name: "הודעת עוגיות" })
    ).toBeHidden();

    expect(await cookieNames(page)).toContain(CONSENT_COOKIE);
    await expectNoGoogleCookies(page);
    expect(googleRequests).toEqual([]);

    await page.reload();
    await expect(
      page.getByRole("dialog", { name: "הודעת עוגיות" })
    ).toBeHidden();
    expect(googleRequests).toEqual([]);
    expect(await page.evaluate(() => typeof window.gtag)).toBe("undefined");
  });

  test("acceptance loads GA once, grants Consent Mode v2, and tracks navigation", async ({
    page,
  }) => {
    const googleRequests = await stubGoogleTag(page);

    await page.goto("/");
    await page.getByRole("button", { name: "כן, תודה" }).click();

    await expect.poll(() => googleRequests.length).toBe(1);
    await expect.poll(() => cookieNames(page)).toEqual(
      expect.arrayContaining([CONSENT_COOKIE, ...STUBBED_GOOGLE_COOKIES])
    );

    const consentCommands = await page.evaluate(() =>
      (window.dataLayer ?? [])
        .map((entry) => Array.from(entry as ArrayLike<unknown>))
        .filter((entry) => entry[0] === "consent")
    );
    expect(consentCommands).toEqual(
      expect.arrayContaining([
        [
          "consent",
          "default",
          expect.objectContaining({
            analytics_storage: "denied",
            ad_storage: "denied",
            ad_user_data: "denied",
            ad_personalization: "denied",
          }),
        ],
        [
          "consent",
          "update",
          expect.objectContaining({
            analytics_storage: "granted",
            ad_storage: "granted",
            ad_user_data: "granted",
            ad_personalization: "granted",
          }),
        ],
      ])
    );

    await page
      .getByRole("banner")
      .getByRole("link", { name: "עליי", exact: true })
      .click();
    await expect(page).toHaveURL(/\/about$/);
    await expect
      .poll(() =>
        page.evaluate(() =>
          (window.dataLayer ?? []).some((entry) => {
            const values = Array.from(entry as ArrayLike<unknown>);
            return values[0] === "event" && values[1] === "page_view";
          })
        )
      )
      .toBe(true);
    expect(googleRequests).toHaveLength(1);
  });

  test("the footer reopens the choice and withdrawal clears Google cookies", async ({
    page,
  }) => {
    const googleRequests = await stubGoogleTag(page);

    await page.goto("/");
    await page.getByRole("button", { name: "כן, תודה" }).click();
    await expect.poll(() => googleRequests.length).toBe(1);

    await page.evaluate(() => {
      document.cookie = "_gid=playwright; Path=/; SameSite=Lax";
      document.cookie = "_gat=playwright; Path=/; SameSite=Lax";
      document.cookie = "_gac_test=playwright; Path=/; SameSite=Lax";
    });
    await expect.poll(() => cookieNames(page)).toEqual(
      expect.arrayContaining(GOOGLE_COOKIE_NAMES)
    );

    await page.getByRole("button", { name: "עוגיות" }).click();
    const notice = page.getByRole("dialog", { name: "הודעת עוגיות" });
    await expect(notice).toBeVisible();

    await notice.getByRole("button", { name: "לא תודה" }).click();
    await page.waitForLoadState("domcontentloaded");
    await expect(notice).toBeHidden();

    await expectNoGoogleCookies(page);
    expect(googleRequests).toHaveLength(1);
    expect(await page.evaluate(() => typeof window.gtag)).toBe("undefined");
  });
});
