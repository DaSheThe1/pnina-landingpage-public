import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { Umami } from "@/components/analytics/umami";

/**
 * Renders every analytics tracker the site supports. We run two in parallel —
 * GA4 (for the client's familiar dashboards) and Umami (cookieless, for our own
 * cross-check) — and each is INDEPENDENT: it loads only when its own PUBLIC env
 * vars are set and is otherwise a complete no-op. Custom funnel events fan out
 * to whichever trackers are loaded via `trackEvent()` in @/lib/analytics.
 */
export function Analytics() {
  return (
    <>
      <GoogleAnalytics />
      <Umami />
    </>
  );
}
