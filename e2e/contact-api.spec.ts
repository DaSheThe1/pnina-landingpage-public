import { expect, test } from "@playwright/test";

/**
 * The /api/contact contract.
 *
 * Note this route only exists in dev and in the e2e build. Production is a
 * static export and the same contract is served by the Cloudflare Worker in
 * `worker/src/contact.js` — that file is a hand-kept copy of this validation, so
 * a change here needs the same change there. See docs/07-deployment-target.md.
 */
test("rejects a request with no body", async ({ request }) => {
  const response = await request.post("/api/contact", {
    headers: { "content-type": "application/json" },
    data: "",
  });
  expect(response.status()).toBe(400);
});

test("rejects a missing phone", async ({ request }) => {
  const response = await request.post("/api/contact", {
    data: { name: "פנינה" },
  });
  expect(response.status()).toBe(400);
});

test("rejects a phone that is not phone-shaped", async ({ request }) => {
  const response = await request.post("/api/contact", {
    data: { name: "פנינה", phone: "call me" },
  });
  expect(response.status()).toBe(400);
});

test("rejects unknown fields rather than forwarding them", async ({ request }) => {
  // The schema is `.strict()` on purpose: a stray field is either a bug or an
  // attempt to smuggle extra data about a visitor into the n8n log.
  const response = await request.post("/api/contact", {
    data: { name: "פנינה", phone: "050-1234567", story: "..." },
  });
  expect(response.status()).toBe(400);
});

test("accepts the honeypot silently", async ({ request }) => {
  const response = await request.post("/api/contact", {
    data: { name: "bot", phone: "050-1234567", company: "spam co" },
  });
  // A bot must see success, so it does not retry with a different shape.
  expect(response.status()).toBe(202);
  expect((await response.json()).ok).toBe(true);
});

test("reports unavailable, with a fallback address, when n8n is unconfigured", async ({
  request,
}) => {
  const response = await request.post("/api/contact", {
    data: { name: "פנינה", phone: "050-1234567" },
  });
  // The e2e build has no N8N_WEBHOOK_URL. A valid lead must then get an honest
  // 503 and an email address — never a silent success that drops the lead.
  expect(response.status()).toBe(503);
  const body = await response.json();
  expect(body.ok).toBe(false);
  expect(body.error).toMatch(/@/);
});

test("health reports ok and the app version", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBe(true);
  const body = await response.json();
  expect(body.ok).toBe(true);
  expect(body.version).toMatch(/^\d+\.\d+\.\d+$/);
});
