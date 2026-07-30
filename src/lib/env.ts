import { siteConfig } from "@/config/site";

/**
 * Parses an optional absolute http(s) URL from the environment.
 *
 * Returns `undefined` for unset/blank/malformed values rather than throwing:
 * every var handled here is optional by design, and a typo in a media URL
 * should degrade to the bundled fallback, not fail the build.
 */
function parseOptionalHttpUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const value = raw.trim();
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

/**
 * Accept only the canonical GA4 web-stream id shape. Invalid values degrade to
 * `undefined`, which keeps both the consent UI and Google code as no-ops.
 */
export function parseGa4MeasurementId(
  raw: string | undefined
): string | undefined {
  const value = raw?.trim().toUpperCase();
  if (!value) return undefined;

  return /^G-[A-Z0-9]{10}$/.test(value) ? value : undefined;
}

export const publicEnv = {
  siteUrl: siteConfig.url,

  // ── Media (Cloudflare R2 CDN) ──────────────────────────────────────────
  // All inlined at BUILD time (NEXT_PUBLIC_*). Production points these at the R2
  // media bucket so the large MP4s stream from a real media origin with range
  // requests and edge caching; served from the site origin they stall
  // mid-playback on a cold cache. See docs/06-media-and-cdn.md.
  //
  // Normal setup is ONE var: the public base URL of the bucket. Each video's
  // filename lives in `videos[key].remote` in src/content/media.ts, so swapping
  // a clip is a filename change in code rather than an env change in three
  // places. The per-video URLs below still win when set, for the case where a
  // single clip has to come from somewhere else.
  mediaBaseUrl: parseOptionalHttpUrl(process.env.NEXT_PUBLIC_MEDIA_BASE_URL),
  heroVideoUrl: parseOptionalHttpUrl(process.env.NEXT_PUBLIC_HERO_VIDEO_URL),
  thankYouVideoUrl: parseOptionalHttpUrl(
    process.env.NEXT_PUBLIC_THANK_YOU_VIDEO_URL
  ),
  aboutVideoUrl: parseOptionalHttpUrl(process.env.NEXT_PUBLIC_ABOUT_VIDEO_URL),

  // ── Analytics ──────────────────────────────────────────────────────────
  // Note for this site specifically: analytics here observes people looking for
  // help after a sexual assault. Never add a tracker that records session
  // replays, form-field contents, keystrokes, or anything that could identify a
  // visitor. See docs/08-security-and-privacy.md.
  //
  // We run two trackers in parallel and each is INDEPENDENT: GA4 for the client
  // (familiar dashboards) and Umami for cookieless cross-checks. Every var below
  // is PUBLIC by design (it ships to the browser) and OPTIONAL — when a tracker's
  // var(s) are unset it is a complete no-op (no script rendered, trackEvent skips
  // it), so dev/test/CI/preview builds keep working unchanged.

  // Google Analytics 4 measurement id (e.g. "G-XXXXXXXXXX"). A valid id still
  // loads only after opt-in consent; see the consent component.
  ga4MeasurementId: parseGa4MeasurementId(process.env.NEXT_PUBLIC_GA_ID),
  // Umami: tracker script URL + the website UUID from its dashboard. Both are
  // required for Umami to load; either missing makes Umami a no-op.
  umamiScriptUrl: process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL,
  umamiWebsiteId: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
};

export function getServerEnv() {
  return {
    // Falls back to the placeholder in site.ts so a missing var shows up as an
    // obvious placeholder rather than silently mailing leads into a void.
    contactToEmail: process.env.CONTACT_TO_EMAIL ?? siteConfig.email,
    n8nWebhookUrl: process.env.N8N_WEBHOOK_URL,
    // Shared secret sent as a header on every webhook call so a leaked webhook
    // URL alone can't be spammed — n8n rejects calls without the matching value.
    n8nWebhookSecret: process.env.N8N_WEBHOOK_SECRET,
  };
}
