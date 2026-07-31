import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Points the plugin at the i18n request config (src/i18n/request.ts is the
// default location it looks for, but we set it explicitly for clarity).
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Static export for GitHub Pages. Gated behind STATIC_EXPORT so it only kicks in
// for the Pages CI build — local dev, the Docker/standalone prod build, and the
// e2e harness (which uses `next start`, incompatible with export) are untouched.
// In this mode `/api/contact` is served by a Cloudflare Worker on the same domain,
// not by Next, so the API routes are dropped from the checkout before building.
const isExport = process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  // The shared Windows port proxy exposes this WSL dev server through these
  // host addresses. Without an explicit development-origin allowance, Next can
  // return the server-rendered page while refusing the client runtime, leaving
  // a phone or iOS Simulator on the static process cards. Production ignores
  // this development-only option.
  allowedDevOrigins: ["192.168.0.150", "100.87.244.34"],

  // Image handling, in every mode.
  //
  // The static export has no server, so Next's own optimizer never runs. The
  // scaffold's answer was `images: { unoptimized: true }`, which degrades every
  // `<Image>` to a bare `<img>` at full source resolution — on a Hebrew site
  // whose visitors are overwhelmingly on phones, that meant shipping an 854px
  // JPEG into a 300px frame.
  //
  // Instead: `scripts/optimize-images.mjs` pre-builds a WebP ladder at build
  // time and `src/lib/image-loader.ts` maps each requested width onto it, so
  // `srcSet` works exactly as it would with a server. Set globally (not only
  // under STATIC_EXPORT) so `next dev` and the e2e build render what production
  // renders. Anything absent from the manifest is served as authored.
  images: {
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    // Matched to the ladder in scripts/optimize-images.mjs. Leaving Next's
    // defaults would emit srcSet entries for 1920/2048/3840 that all resolve to
    // the same top-rung file — bytes of HTML on every page for no benefit.
    deviceSizes: [320, 480, 640, 828, 1080],
    // The floor is 128, not 64. Next resolves a FIXED-size `<Image>` to
    // `[width, width*2]`, so the 32px header logo would otherwise land on a
    // 64px file and go soft on a 3× phone screen — the most-seen element on
    // the site. 128px keeps it crisp and still costs ~3 KB instead of the
    // 24 KB JPEG it used to ship.
    imageSizes: [128, 256],
  },
  ...(isExport
    ? {
        output: "export",
        // Emit `out/<route>/index.html` so GitHub Pages serves /thank-you/ etc.
        // cleanly (the form redirects there after a successful submit).
        trailingSlash: true,
      }
    : // `next start` (used by the Playwright e2e harness) refuses to serve an
      // `output: "standalone"` build, so scope standalone to the real/prod build
      // (what the Docker image ships via `node server.js`). The e2e build sets
      // NEXT_DIST_DIR for an isolated build dir and runs as a normal build that
      // `next start` can serve, without clobbering the `.next` of a running `pnpm dev`.
      process.env.NEXT_DIST_DIR
      ? { distDir: process.env.NEXT_DIST_DIR }
      : { output: "standalone" }),
};

export default withNextIntl(nextConfig);
