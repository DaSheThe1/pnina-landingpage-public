import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for pnina-website.
 *
 * By default Playwright boots its OWN Next dev server on PLAYWRIGHT_PORT using an
 * isolated build dir (.next-e2e), so it never clashes with a `pnpm dev` you may
 * already have running. To instead test an already-running server, set
 * PLAYWRIGHT_BASE_URL and PLAYWRIGHT_SKIP_WEBSERVER=1.
 */
const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
// MUST be "localhost", not "127.0.0.1". next-intl's proxy rewrites `/` to `/he`
// and Next resolves that rewrite against `localhost`; when the server is bound
// to a literal IP the rewrite target's host no longer matches the request's, so
// Next stops treating it as an internal rewrite and returns it to the browser as
// a 307 back to `/`. Every URL then becomes ERR_TOO_MANY_REDIRECTS and the whole
// suite fails on `page.goto` before a single assertion runs.
const host = process.env.PLAYWRIGHT_HOST ?? "localhost";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://${host}:${port}`;
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === "1";
const artifactDir =
  process.env.PLAYWRIGHT_ARTIFACT_DIR ?? "/tmp/pnina-website-playwright";

export default defineConfig({
  testDir: "./e2e",
  // Serial against a single dev server avoids route-compile contention and
  // pre-hydration interaction flakes; one local retry absorbs rare timing.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  outputDir: `${artifactDir}/test-results`,
  reporter: [
    ["list"],
    [
      "html",
      {
        open: "never",
        outputFolder: process.env.CI
          ? "./playwright-report"
          : `${artifactDir}/playwright-report`,
      },
    ],
  ],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // Required on WSL / many CI images.
    launchOptions: {
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: skipWebServer
    ? undefined
    : {
        // NOTE: this runs `next dev`, not `next build && next start`.
        //
        // `next start` cannot serve this app. next-intl's proxy rewrites `/x` to
        // `/he/x` internally, and on Next 16 a production server returns that
        // rewrite to the client as a 307 back to the ORIGINAL path — every URL
        // becomes an infinite redirect loop. The dev server resolves the rewrite
        // internally and is unaffected, and so is production, which is a static
        // export with no server at all (scripts/flatten-locale-export.mjs hoists
        // out/he/* to the root at build time). So `next start` is the only broken
        // environment, and nothing ships from it.
        //
        // Trade-off accepted: Turbopack compiles routes on demand, so the first
        // hit on a route is slow — hence the generous timeout and the single
        // retry configured above. If this ever gets flaky enough to matter, the
        // real fix is to drop the [locale] segment (see docs/02-site-structure.md),
        // not to switch back to `next start`.
        command: `pnpm exec next dev -H ${host} -p ${port}`,
        url: baseURL,
        timeout: 240_000,
        reuseExistingServer: !process.env.CI,
        stdout: "ignore",
        stderr: "pipe",
        env: {
          ...process.env,
          // Isolated build dir so the harness never clobbers the .next of a
          // `pnpm dev` you already have running on port 3006.
          NEXT_DIST_DIR: process.env.NEXT_DIST_DIR ?? ".next-e2e",

          // Blank the lead webhook for the whole suite. Two reasons, both
          // load-bearing: `.env.local` now points at the REAL n8n dev workflow,
          // so without this every run posts a dozen fake leads into it; and
          // contact-api.spec asserts the honest 503-with-a-fallback-address
          // behaviour that only happens when n8n is unconfigured.
          N8N_WEBHOOK_URL: "",
          N8N_WEBHOOK_SECRET: "",

          // The suite posts far more leads from one address than a human ever
          // would. Without this every test after the fifth fails on a 429 that
          // has nothing to do with what it is asserting.
          CONTACT_RATE_LIMIT_MAX: "1000",
        },
      },
});
