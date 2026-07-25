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
  ...(isExport
    ? {
        output: "export",
        // The default next/image loader needs a server; static files can't be
        // optimized at request time.
        images: { unoptimized: true },
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
