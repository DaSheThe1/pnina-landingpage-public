import { expect, test } from "@playwright/test";

/**
 * The lead form is the entire point of the site, so it is tested at the level
 * that matters: can a visitor with a real name and phone get through, and does
 * a mistake produce a message she can act on.
 *
 * The form intentionally collects name + phone ONLY. The assertion at the bottom
 * enforces that: if someone adds a "tell me what happened" field, this fails.
 * See src/lib/contact-schema.ts for why that boundary exists.
 */
async function openForm(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("banner").getByRole("button", { name: /לשיחה ראשונה/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  return dialog;
}

test("the dialog opens from the header CTA and closes again", async ({ page }) => {
  const dialog = await openForm(page);
  await dialog.getByRole("button", { name: "סגירה" }).first().click();
  await expect(dialog).toBeHidden();
});

test("Escape closes the dialog", async ({ page }) => {
  const dialog = await openForm(page);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("an empty submit shows field errors and sends nothing", async ({ page }) => {
  let posted = false;
  await page.route("**/api/contact", (route) => {
    posted = true;
    return route.fulfill({ status: 202, json: { ok: true } });
  });

  const dialog = await openForm(page);
  await dialog.getByRole("button", { name: /שלחי/ }).click();

  await expect(dialog.getByText("אנא הזיני שם")).toBeVisible();
  await expect(dialog.getByText(/אנא הזיני מספר טלפון/)).toBeVisible();
  expect(posted, "invalid form must not reach the API").toBe(false);
});

/**
 * The phone is checked against the Israeli numbering plan, not just for length.
 * `123456789` is the case that matters: it is nine digits of nothing, it used to
 * be accepted, and a lead that cannot be called back is worse than no lead
 * because nobody finds out until she dials it.
 */
for (const junk of ["תתקשרי אליי", "123456789", "0000000000", "05-12345"]) {
  test(`the phone "${junk}" is rejected client-side`, async ({ page }) => {
    const dialog = await openForm(page);
    await dialog.getByLabel("שם").fill("פנינה");
    await dialog.getByLabel("טלפון").fill(junk);
    await dialog.getByRole("button", { name: /שלחי/ }).click();
    await expect(dialog.getByText(/אנא הזיני מספר טלפון/)).toBeVisible();
  });
}

test("a valid lead posts name + phone and lands on the thank-you page", async ({
  page,
}) => {
  let body: Record<string, unknown> | null = null;
  await page.route("**/api/contact", async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({ status: 202, json: { ok: true } });
  });

  const dialog = await openForm(page);
  await dialog.getByLabel("שם").fill("פנינה");
  await dialog.getByLabel("טלפון").fill("050-1234567");
  await dialog.getByRole("button", { name: /שלחי/ }).click();

  await expect(page).toHaveURL(/\/thank-you$/);
  expect(body).toMatchObject({ name: "פנינה", phone: "050-1234567" });

  // The payload must carry nothing beyond these keys — no free-text field about
  // the visitor's situation, ever.
  expect(Object.keys(body ?? {}).sort()).toEqual(
    ["company", "language", "name", "phone", "source"].sort()
  );
});

test("the lectures CTA tags its leads as a lectures enquiry", async ({ page }) => {
  let body: Record<string, unknown> | null = null;
  await page.route("**/api/contact", async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({ status: 202, json: { ok: true } });
  });

  await page.goto("/lectures");
  await page.getByRole("main").getByRole("button", { name: /לתיאום הרצאה/ }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("שם").fill("רכזת הדרכה");
  await dialog.getByLabel("טלפון").fill("050-7654321");
  await dialog.getByRole("button", { name: /שלחי/ }).click();

  await expect(page).toHaveURL(/\/thank-you$/);
  // An organisation booking a talk and a woman seeking support need completely
  // different replies, so the source has to survive the round trip.
  expect(body).toMatchObject({ source: "lectures" });
});

test("a server failure keeps the visitor on the form with a way out", async ({
  page,
}) => {
  await page.route("**/api/contact", (route) =>
    route.fulfill({ status: 503, json: { ok: false, error: "הטופס אינו זמין כרגע." } })
  );

  const dialog = await openForm(page);
  await dialog.getByLabel("שם").fill("פנינה");
  await dialog.getByLabel("טלפון").fill("050-1234567");
  await dialog.getByRole("button", { name: /שלחי/ }).click();

  await expect(dialog.getByRole("alert")).toBeVisible();
  await expect(page).not.toHaveURL(/\/thank-you$/);
});
