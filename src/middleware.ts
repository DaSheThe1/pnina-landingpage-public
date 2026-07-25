import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

/**
 * next-intl locale routing.
 *
 * ⚠️ Next 16 prints a deprecation warning telling you to rename this file to
 * `proxy.ts`. DO NOT — it is not a drop-in rename here. Under the `proxy`
 * convention, next-intl's internal rewrite of `/x` to `/he/x` comes back to the
 * client as a 307 to the ORIGINAL path, so every page becomes an infinite
 * redirect loop (verified on Next 16.2.7 + next-intl 4.13). The old convention
 * resolves the rewrite internally and works correctly.
 *
 * Revisit when next-intl ships proxy support; until then the warning is noise.
 *
 * None of this runs in production anyway: the live site is a static export with
 * no server, and `scripts/flatten-locale-export.mjs` does the equivalent at
 * build time by hoisting `out/he/*` to the export root.
 */
export default createMiddleware(routing);

export const config = {
  // Run on every path except API routes, Next internals, and files with an
  // extension (static assets).
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
