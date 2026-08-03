import { expect, test } from "@playwright/test";

/**
 * Every route renders, has exactly one <h1>, and logs no console errors.
 *
 * The single-h1 check is not pedantry: this site ships an accessibility
 * statement, and heading structure is the main thing a screen-reader user
 * navigates by.
 */
const routes = [
  { path: "/", name: "home" },
  { path: "/about", name: "about" },
  { path: "/lectures", name: "lectures" },
  { path: "/contact", name: "contact" },
  { path: "/thank-you", name: "thank-you" },
  { path: "/privacy", name: "privacy" },
  { path: "/terms", name: "terms" },
  { path: "/accessibility", name: "accessibility" },
] as const;

for (const route of routes) {
  test(`${route.name} renders cleanly`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("pageerror", (e) => errors.push(String(e)));

    const response = await page.goto(route.path);
    expect(response?.status(), `${route.path} status`).toBeLessThan(400);

    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toBeVisible();
    expect(errors, `console errors on ${route.path}`).toEqual([]);
  });
}

test("the document is Hebrew and right-to-left", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "he");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
});

test("Hebrew is served at the root, with no locale prefix", async ({ page }) => {
  await page.goto("/");
  // The site is Hebrew-only; a /he/ prefix leaking into URLs would split SEO
  // across two addresses for the same content.
  expect(new URL(page.url()).pathname).toBe("/");
});

test("every image carries alt text", async ({ page }) => {
  for (const route of routes) {
    await page.goto(route.path);
    const missing = await page
      .locator("img:not([alt])")
      .evaluateAll((nodes) => nodes.map((n) => (n as HTMLImageElement).src));
    expect(missing, `images without alt on ${route.path}`).toEqual([]);
  }
});

// The footer used to carry a crisis-line banner pointing at 1202. Daniel asked
// for it removed — it was never part of the brief — so the test that guarded it
// is gone with it rather than left failing. The "not an emergency service" line
// still stands in the terms page, which is where it belongs.

test("the real contact details are published in the footer", async ({
  page,
}) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  // Guards against a regression to the scaffold's placeholder number/address,
  // which would send every enquiry to a stranger.
  await expect(
    footer.getByRole("link", { name: /054-754-7452/ })
  ).toBeVisible();
  await expect(
    footer.getByRole("link", { name: /peninapearl23@gmail\.com/ })
  ).toBeVisible();
});

/**
 * Every WhatsApp button must open a chat with the opening line already typed.
 *
 * Four of the six used to link at `siteConfig.whatsappUrl` directly, so whether
 * a visitor landed in WhatsApp with a message ready depended on which button she
 * pressed. That matters more here than on a normal site: the pre-filled line is
 * what saves a woman from having to compose an opening sentence about why she is
 * writing. They all go through `WhatsAppLink` now, and this keeps it that way.
 */
test("every WhatsApp link carries the pre-filled message", async ({ page }) => {
  for (const path of ["/", "/about", "/lectures", "/contact", "/thank-you"]) {
    await page.goto(path);
    const hrefs = await page
      .locator('a[href*="wa.me"]')
      .evaluateAll((nodes) =>
        nodes.map((n) => (n as HTMLAnchorElement).href)
      );
    expect(hrefs.length, `no WhatsApp link found on ${path}`).toBeGreaterThan(0);
    expect(
      hrefs.filter((h) => !h.includes("?text=")),
      `WhatsApp links opening an empty chat on ${path}`
    ).toEqual([]);
  }
});

test("the header's WhatsApp link carries it on a phone", async ({ page }) => {
  // ⚠️ REWRITTEN 2026-08-04. This used to open the mobile MENU and look for a
  // row labelled "וואטסאפ" inside it. That row no longer exists: Pnina asked
  // for the header's CTA to be replaced by her Instagram and WhatsApp icons and
  // for the CTA to move into the menu, so the menu's social row went and the
  // WhatsApp link is now an icon on the bar itself at every width.
  //
  // The guarantee is unchanged and is the thing worth keeping — a WhatsApp link
  // that opens an EMPTY chat asks a woman in distress to compose the first
  // message herself. It is only measured somewhere else now.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const link = page.locator("header").locator('a[href*="wa.me"]').first();
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", /\?text=/);
});
