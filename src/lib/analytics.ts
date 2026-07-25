// Typed wrapper around the client-side trackers. We run two in parallel — GA4
// (gtag.js) and Umami — and this helper fans each custom event out to BOTH;
// whichever isn't loaded is skipped via optional chaining.
//
// Both trackers auto-capture pageviews (including Next App Router client-side
// route changes — GA4 Enhanced measurement and Umami both listen for History
// API events, which Next's router uses), so unique visitors and the /thank-you
// pageview come for free. This helper is only for the small set of CUSTOM
// events we hand-fire on intentful user interactions.
//
// PRIVACY: never pass PII (no name / email / phone) in event data — only
// non-identifying categorical fields.

// Allowed custom event names. Keep these snake_case, stable, and documented
// (see docs/16-analytics.md → Event map). Changing a name breaks historical
// continuity in BOTH dashboards, so treat them as a contract.
/**
 * Every event this site is allowed to send.
 *
 * Deliberately a closed union and deliberately tiny. Visitors here are looking
 * for help after a sexual assault; the only thing we measure is whether the
 * funnel works. Never add an event carrying free text, form-field contents,
 * a page a visitor read, or anything that could narrow down who someone is.
 * See docs/08-security-and-privacy.md.
 */
export type AnalyticsEvent =
  | "about_video_watch" // visitor played her long message on /about
  | "hero_video_watch" // visitor expanded the hero video
  | "lead_dialog_opened" // visitor opened the lead-capture dialog (intent)
  | "lead_submitted" // form submitted successfully
  | "thankyou_video_watch"; // visitor played the thank-you message

declare global {
  interface Window {
    // Present only after gtag.js has loaded. Optional so every access is
    // null-safe — when GA is unconfigured it never exists.
    gtag?: (
      command: "event",
      name: string,
      params?: Record<string, unknown>
    ) => void;
    // Present only after Umami's tracker has loaded. Same null-safety.
    umami?: {
      track: (name: string, data?: Record<string, unknown>) => void;
    };
  }
}

/**
 * Fire a custom event to every loaded tracker (GA4 + Umami). Safe to call
 * anywhere:
 * - on the server (typeof window === "undefined") it returns immediately;
 * - when a tracker isn't configured / loaded, its global is undefined and the
 *   optional chaining makes that branch a no-op. Never throws.
 */
export function trackEvent(
  name: AnalyticsEvent,
  data?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  window.gtag?.("event", name, data);
  window.umami?.track(name, data);
}
