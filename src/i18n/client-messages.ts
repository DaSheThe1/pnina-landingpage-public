/**
 * Which slices of `messages/he.json` are allowed into the browser.
 *
 * WHY THIS FILE EXISTS
 * `NextIntlClientProvider` with no `messages` prop serialises the WHOLE
 * catalogue into every page — including the full terms of service, the privacy
 * policy and the accessibility statement, which together are ~45% of the file
 * and are read by nobody on the homepage. It shipped in the RSC payload of all
 * eight routes.
 *
 * next-intl cannot work this out on its own: it has no idea which namespaces a
 * client component will ask for at runtime. So the list is explicit and it is
 * maintained by hand.
 *
 * HOW TO MAINTAIN IT
 * A namespace belongs here if it is read by `useTranslations()` inside the
 * CLIENT module graph — that is, from a file carrying `"use client"` **or any
 * file such a file imports**. That second half is the trap: `marketing-sections`
 * has no `"use client"` of its own, but `faq.tsx`, `testimonials.tsx` and
 * `project-gallery.tsx` import from it, which pulls the whole module (and all
 * nine of its namespaces) across the boundary.
 *
 * Server components read their copy through the request store, not through this
 * provider, so nothing here is needed to render them. The legal pages
 * (`/terms`, `/privacy`, `/accessibility`) are entirely server-rendered — that
 * is exactly why their text can be left out.
 *
 * If a client component asks for a namespace that is missing, next-intl throws
 * `MISSING_MESSAGE` in the console and renders the key instead of the copy. The
 * fix is to add the namespace here, never to drop the filter.
 *
 * ADDING A SECTION? RE-AUDIT THIS LIST.
 * This is the one file in the repo that silently goes stale when work happens on
 * a parallel branch: it was written against the namespaces that existed at the
 * time, and merging the redesign phases together added four it had never heard
 * of (`audience`, `moments`, `motion.*`) while deleting one it still named
 * (`stats`). Nothing failed to compile — the sections just rendered their keys.
 * The check is mechanical: every `useTranslations("X")` reachable from a
 * `"use client"` file, transitively, must be covered by an entry below.
 */

/** A message tree: nested objects with strings (or arrays) at the leaves. */
type MessageNode = Record<string, unknown>;

/**
 * Namespaces the client bundle actually reads. Dots select a subtree, so
 * `pages.thankYou.video` ships ~120 bytes instead of the 10 KB `pages` tree.
 *
 * Deliberately ABSENT (server-only as of v0.11.0): `pages.*` except the
 * thank-you video labels, `legal`, `lectures`, `trustBand`, `og`.
 */
export const CLIENT_MESSAGE_NAMESPACES = [
  "accessibility", // skip-link, accessibility-launcher (+ its panel)
  "audience", // marketing-sections
  "common", // scroll-utils, project-gallery
  "contactForm", // contact-form (also covers .fields/.errors/.redirecting)
  "faq", // faq
  "finalCta", // marketing-sections
  "footer", // marketing-sections (site-footer itself is server-rendered)
  "founder", // marketing-sections
  "header", // site-header
  "hero", // marketing-sections
  "heroVideo", // hero-video
  "homeGallery", // project-gallery
  "leadDialog", // lead-dialog
  "moments", // marketing-sections
  "motion", // pearl-reveal-section (.pearl), stage-reveal-section (.stage)
  "nav", // site-header
  "offers", // marketing-sections
  "pages.thankYou.video", // thank-you-video
  "process", // marketing-sections
  "services", // marketing-sections
  "servicesTeaser", // marketing-sections
  "testimonials", // testimonials
  "whatsapp", // floating-whatsapp, whatsapp-link
  "why", // marketing-sections
] as const;

/**
 * Copy only the listed namespaces out of the full catalogue, preserving the
 * nesting so `useTranslations("pages.thankYou.video")` still resolves.
 *
 * A path that does not exist is skipped silently rather than throwing: a
 * mistyped entry here should degrade to next-intl's own MISSING_MESSAGE
 * warning, not break the build of a page that never used it.
 */
export function pickClientMessages<T extends MessageNode>(messages: T): T {
  const out: MessageNode = {};

  for (const path of CLIENT_MESSAGE_NAMESPACES) {
    const segments = path.split(".");

    let source: unknown = messages;
    for (const segment of segments) {
      if (typeof source !== "object" || source === null) {
        source = undefined;
        break;
      }
      source = (source as MessageNode)[segment];
    }
    if (source === undefined) continue;

    let target = out;
    for (const segment of segments.slice(0, -1)) {
      if (typeof target[segment] !== "object" || target[segment] === null) {
        target[segment] = {};
      }
      target = target[segment] as MessageNode;
    }
    target[segments[segments.length - 1]] = source;
  }

  return out as T;
}
