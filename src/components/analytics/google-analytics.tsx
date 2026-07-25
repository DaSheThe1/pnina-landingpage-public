import Script from "next/script";

import { publicEnv } from "@/lib/env";

/**
 * Loads the Google Analytics 4 (gtag.js) tracker when — and only when — the
 * PUBLIC `NEXT_PUBLIC_GA_ID` env var is set. When it is missing — dev, test,
 * CI, preview — this renders nothing, so the site behaves exactly as before and
 * no analytics ships.
 *
 * GA4 auto-captures pageviews, including App Router client-side navigations:
 * "Enhanced measurement → Page changes based on browser history events" (on by
 * default) fires on the History API `pushState` calls Next's router uses, so
 * the /thank-you pageview and unique visitors need no extra code. Custom funnel
 * events are fired via `trackEvent()` in @/lib/analytics.
 *
 * Rendered alongside <Umami /> by the composing <Analytics /> — the two are
 * independent and each no-ops when its own env is unset.
 */
export function GoogleAnalytics() {
  const gaId = publicEnv.gaId;

  // Complete no-op unless configured.
  if (!gaId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`}
      </Script>
    </>
  );
}
