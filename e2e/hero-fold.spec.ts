import { expect, test } from "@playwright/test";

/**
 * THE HERO FITS ON A PHONE WITHOUT SCROLLING.
 *
 * This is not a nice-to-have and it is not a layout preference — it is the
 * client's own instruction, and the reason the hero was rebuilt in 0.17.0.
 * Pnina, via Daniel, 2026-08-02: the main header, the secondary header, the
 * video and the form must all be visible *"without even scrolling on the
 * phone"*.
 *
 * A requirement stated that plainly should be measured, not eyeballed, because
 * it is the kind that decays silently: every future line of copy, every extra
 * reassurance chip and every bump to the type scale spends the same budget, and
 * nothing else in the suite would notice until someone opened the site on a
 * phone. So this spec fails the build instead.
 *
 * ── ⚠️ THE HERO HAS NO FORM ANY MORE, SO THE CONTRACT CHANGED (2026-08-03) ──
 * This spec has been rewritten twice in two days and both times BY THE OWNER,
 * so the history matters more than usual:
 *
 *   0.17.0  everything up to and including the submit button above the fold
 *   0.20.0  Daniel relaxed it to the FIELDS, so the headline could grow:
 *           *"the bottom of the send button… you can make it a little bit
 *            downwards… the header itself needs to be bigger"*
 *   0.21.0  Pnina replaced the whole form with a single button:
 *           *"להחליף את השדות לכפתור"*
 *
 * There is no name field in the hero to measure any more. What replaces it is
 * the thing the fields were standing in for all along — a visible way to act —
 * so the spec now requires the HERO CTA above the fold, and that is a stricter
 * guarantee than 0.20.0's, not a looser one: the button is the whole ask, where
 * the fields were only the start of it.
 *
 * ⚠️ THIS IS NOT A LICENCE TO KEEP MOVING THE LINE. Both moves were made by the
 * people who set it, for stated reasons, and each recorded here. If this spec
 * fails, something in the hero has grown and the fix is to take it out — not to
 * demote another element from the list below.
 *
 * ── THE BUDGET ──
 * 390×844 is the iPhone 12/13/14/15 class and the modal phone for this
 * audience. Of that, 64px is the sticky header (`h-16`), leaving ~680px.
 *
 * ── WHAT IS DELIBERATELY *NOT* ASSERTED ──
 * Anything inside the lead dialog. It does not exist until the button is
 * pressed, and by then the fold is not what is on screen.
 *
 * ── AND WHAT DOES NOT FIT ──
 * A 375×667 iPhone SE. There the CTA lands just below the fold. That is a
 * knowingly accepted limit rather than an oversight, so the SE case is asserted
 * as a WEAKER guarantee below (headline + her sentence + the video) — if someone
 * later makes the SE fit completely, tighten it.
 */

/**
 * The things the client asked to be visible, in DOM order.
 *
 * The two copy blocks are addressed by `data-hero`, not by tag or class. They
 * have already changed shape once — the secondary header was a `<ul>` of three
 * "בלי…" lines and is now a `<p>` of Pnina's own sentence plus a quieter note —
 * and a spec that fails because copy was re-tagged is a spec people learn to
 * ignore. The attribute is the contract; the markup underneath is free.
 */
const HERO = {
  headline: "h1",
  /**
   * Her sentence is split across the video frame's edge as of 0.19.0, so it is
   * three hooks rather than two:
   *   secondary-lead  "אם את מרגישה…" — the feeling, in the copy column, OUTSIDE
   *                   the frame
   *   secondary       "צפי בסרטון עד הסוף👇🏻" — the instruction, INSIDE the frame
   *                   above the clip
   *   secondary-note  her parenthetical, inside the frame under it
   * All three are still required above the fold: the split moved them, it did
   * not make any of them optional.
   */
  secondaryLead: '[data-hero="secondary-lead"]',
  secondary: '[data-hero="secondary"]',
  secondaryNote: '[data-hero="secondary-note"]',
  video: "section:has(h1) video",
  /** The one thing to press. Addressed by `data-hero`, like the copy blocks,
   *  so the spec survives the button changing variant or label again. */
  cta: '[data-hero="cta"]',
} as const;

/**
 * The lead dialog, and everything inside it.
 *
 * ⚠️ ALL THREE MUST BE SCOPED TO THE DIALOG. The page ALSO renders the final
 * CTA's inline form, so a bare `input[autocomplete="name"]` matches two
 * elements and Playwright's strict mode fails the test rather than picking one.
 * That is the right behaviour and the reason these are written this way — a
 * test that silently filled the wrong form would still pass and would be
 * testing nothing.
 */
const DIALOG = '[role="dialog"]';
const DIALOG_NAME = `${DIALOG} input[autocomplete="name"]`;
const DIALOG_TEL = `${DIALOG} input[autocomplete="tel"]`;
const DIALOG_SUBMIT = `${DIALOG} button[type="submit"]`;

/**
 * Is the element wholly inside the first viewport? Measured against the
 * DOCUMENT, not the viewport, so a page that has been scrolled cannot pass by
 * accident — `y + height` is the distance from the top of the page.
 */
async function bottomEdge(page: import("@playwright/test").Page, selector: string) {
  const box = await page.locator(selector).first().boundingBox();
  expect(box, `${selector} should be laid out`).not.toBeNull();
  const scrollY = await page.evaluate(() => window.scrollY);
  return Math.round(box!.y + box!.height + scrollY);
}

test.describe("the hero fits above the fold", () => {
  test("390×844 — everything the client asked for, no scrolling", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    // The reveals animate on scroll-timeline; give layout a settled frame
    // rather than racing the first paint.
    await page.locator(HERO.cta).waitFor({ state: "visible" });
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    );

    const fold = 844;
    const measured: Record<string, number> = {};
    for (const [name, selector] of Object.entries(HERO)) {
      measured[name] = await bottomEdge(page, selector);
    }

    // Reported together so a failure says WHICH block overflowed and by how
    // much, instead of just naming the first one that happened to be checked.
    expect(
      measured,
      `hero blocks must end above ${fold}px — measured ${JSON.stringify(measured)}`
    ).toEqual(
      expect.objectContaining(
        Object.fromEntries(
          Object.keys(HERO).map((k) => [k, expect.any(Number)])
        )
      )
    );
    for (const [name, bottom] of Object.entries(measured)) {
      expect(bottom, `${name} bottom edge (fold is ${fold}px)`).toBeLessThanOrEqual(fold);
    }

    // And the page really is at the top — nothing above was skipped by a scroll.
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("393×852 — the same, one size up", async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/");
    await page.locator(HERO.cta).waitFor({ state: "visible" });
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    );
    for (const [name, selector] of Object.entries(HERO)) {
      expect(await bottomEdge(page, selector), `${name} bottom edge`).toBeLessThanOrEqual(852);
    }
  });

  test("375×667 — the accepted limit: headline, video and the first field", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.locator(HERO.cta).waitFor({ state: "visible" });
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    );
    for (const name of ["headline", "secondaryLead", "video"] as const) {
      expect(await bottomEdge(page, HERO[name]), `${name} bottom edge`).toBeLessThanOrEqual(667);
    }
  });

  test("the hero form posts as its own lead source", async ({ page }) => {
    // `source: "hero"` is the only new thing this rebuild sends to n8n, and it
    // is invisible in the UI — so nothing else would catch it being dropped.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    let posted: Record<string, unknown> | null = null;
    await page.route("**/api/contact", async (route) => {
      posted = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    // The hero is a button now, so the form is one press away. `source: "hero"`
    // has to survive that indirection — the button passes it to the shared
    // dialog — which is exactly what this test is for.
    await page.locator(HERO.cta).click();
    await page.locator(DIALOG_NAME).waitFor({ state: "visible" });
    await page.locator(DIALOG_NAME).fill("בדיקה");
    await page.locator(DIALOG_TEL).fill("0501234567");
    await page.locator(DIALOG_SUBMIT).click();

    await expect.poll(() => posted).not.toBeNull();
    expect(posted!.source).toBe("hero");
    // AGENTS.md rule 1: her question is optional and must never be required.
    // An empty one must not block a submit, and must not invent a value.
    expect(posted!.question ?? "").toBe("");
  });

  test("no horizontal scroll on a phone", async ({ page }) => {
    // The hero's decoration bleeds well past its own box (the aurora is 60rem
    // wide) and the compact form puts two inputs on one row, so this is the
    // section most able to push a 390px phone sideways.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow, "document should not scroll horizontally").toBeLessThanOrEqual(0);
  });
});
