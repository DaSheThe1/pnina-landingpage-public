import { Umami } from "@/components/analytics/umami";

/**
 * Renders only the independently optional, cookieless Umami tracker.
 *
 * Google Analytics is deliberately absent here: its loader is owned by
 * MinimalCookieConsent so no second site-wide path can bypass consent.
 */
export function Analytics() {
  return <Umami />;
}
