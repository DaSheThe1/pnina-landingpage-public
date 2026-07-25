import { siteConfig } from "@/config/site";

/**
 * Builds the wa.me link, with the opening message pre-filled.
 *
 * There is exactly one of these in the codebase on purpose. Four of the six
 * WhatsApp buttons on the site used to link at `siteConfig.whatsappUrl`
 * directly, which opens an empty chat — so whether a visitor arrived with
 * "היי, הגעתי דרך האתר..." already typed depended on which button she happened
 * to press. On this site that is not cosmetic: the message is what saves a woman
 * from having to compose an opening line about why she is writing.
 *
 * The text itself lives in `messages/he.json` under `whatsapp.message`, like all
 * other copy. Change it there and every button follows.
 */
export function whatsappHref(message?: string): string {
  const text = message?.trim();
  if (!text) return siteConfig.whatsappUrl;
  return `${siteConfig.whatsappUrl}?text=${encodeURIComponent(text)}`;
}
