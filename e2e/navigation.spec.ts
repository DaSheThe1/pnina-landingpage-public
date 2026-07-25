import { expect, test } from "@playwright/test";

/**
 * The header mixes in-page anchors (the funnel on `/`) with real routes. Both
 * kinds are covered here — an anchor that silently stops scrolling is invisible
 * in a build but obvious to a visitor.
 */
test("header anchors scroll into the funnel", async ({ page }) => {
  await page.goto("/");
  const header = page.getByRole("banner");

  for (const [label, id] of [
    ["הליווי", "approach"],
    ["איך זה עובד", "process"],
    // The reviews hold the header's fifth slot, not the FAQ — see
    // docs/02-site-structure.md for why. The FAQ keeps its #faq anchor and its
    // footer link, both covered below.
    ["מה כותבות לי", "testimonials"],
  ] as const) {
    await header.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }
});

test("header links reach the standalone pages", async ({ page }) => {
  await page.goto("/");
  const header = page.getByRole("banner");

  await header.getByRole("link", { name: "הרצאות", exact: true }).click();
  await expect(page).toHaveURL(/\/lectures$/);
  await expect(page.locator("h1")).toBeVisible();

  await page.goto("/");
  await header.getByRole("link", { name: "עליי", exact: true }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.locator("h1")).toBeVisible();
});

test("the logo returns home", async ({ page }) => {
  await page.goto("/about");
  await page.getByRole("banner").getByRole("link").first().click();
  // toHaveURL, not a bare read of page.url(): `click()` resolves as soon as the
  // event is dispatched, while this is a client-side navigation that lands a
  // tick later. Reading the URL immediately races it and sees /about.
  await expect(page).toHaveURL(/\/$/);
});

test("the footer links to all three legal pages", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  for (const [label, path] of [
    ["מדיניות פרטיות", "/privacy"],
    ["תנאי שימוש", "/terms"],
    // Required for an Israeli business site (תקנות שוויון זכויות; ת"י 5568).
    ["הצהרת נגישות", "/accessibility"],
  ] as const) {
    await footer.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await page.goto("/");
  }
});

test("the mobile menu opens and navigates", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByRole("button", { name: "פתיחת התפריט" }).click();
  const mobileNav = page.getByRole("navigation", { name: "ניווט בתפריט" });
  await expect(mobileNav).toBeVisible();

  await mobileNav.getByRole("link", { name: "הרצאות", exact: true }).click();
  await expect(page).toHaveURL(/\/lectures$/);
});
