import Script from "next/script";

import { publicEnv } from "@/lib/env";

/**
 * Loads the Umami tracker script when (and only when) both PUBLIC Umami env
 * vars are set. When EITHER is missing — dev, test, CI, preview — this renders
 * nothing, so the site behaves exactly as before and no Umami script ships.
 *
 * Umami auto-captures pageviews (including App Router client-side navigations —
 * the tracker patches `history.pushState`), so unique visitors and the
 * /thank-you pageview need no extra code. Custom funnel events are fired via
 * `trackEvent()` in @/lib/analytics.
 *
 * Rendered alongside <GoogleAnalytics /> by the composing <Analytics /> — the
 * two are independent and each no-ops when its own env is unset.
 */
export function Umami() {
  const scriptUrl = publicEnv.umamiScriptUrl;
  const websiteId = publicEnv.umamiWebsiteId;

  // Complete no-op unless fully configured.
  if (!scriptUrl || !websiteId) return null;

  return (
    <Script
      src={scriptUrl}
      data-website-id={websiteId}
      strategy="afterInteractive"
      defer
    />
  );
}
