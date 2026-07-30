/**
 * Single source of truth for the site's identity.
 *
 * Everything here is confirmed client data supplied by Pnina, including the
 * domain — see `docs/07-deployment-target.md`.
 */

/**
 * THE domain. One string, and everything else follows it: `siteConfig.url`,
 * every canonical tag, og:url, the sitemap, robots.txt, the JSON-LD ids, and
 * `public/CNAME` (regenerated from this value by `scripts/generate-cname.mjs`
 * on every build — see the `prebuild` script in package.json).
 *
 * It used to be duplicated in four places and they drifted: the site shipped
 * for weeks with every canonical URL pointing at a host that returned 404.
 * Change it HERE and nowhere else.
 */
const DOMAIN = "peninaphaff.com";

/**
 * The site's origin: the env override if there is a real one, otherwise the
 * domain above.
 *
 * `??` alone is not enough. `.env` files and CI `env:` blocks both express
 * "unset" as an EMPTY STRING (`NEXT_PUBLIC_SITE_URL=`), which `??` happily
 * passes through — every canonical, og:url and sitemap entry would then be
 * built from `""`. Blank, whitespace and a trailing slash all mean "use the
 * domain", so the wrong value cannot be produced by accident.
 */
function resolveSiteUrl(): string {
  const override = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  return override || `https://${DOMAIN}`;
}

export const siteConfig = {
  // Hebrew display brand used across the UI (header, footer, meta titles).
  name: "פנינה פאף",
  // Latin/canonical name for schema.org and SEO (kept stable across locales).
  legalName: "Penina Phaff",
  // Monogram shown in the header/footer logo badge.
  monogram: "פ",

  // Her own domain. Derived from DOMAIN above — never write a host here.
  domain: DOMAIN,
  // NEXT_PUBLIC_SITE_URL still overrides per-environment (local dev, e2e,
  // preview builds). Unset OR BLANK — the normal case, including production —
  // falls back to the domain above, so a deploy cannot ship a canonical URL
  // that disagrees with public/CNAME.
  url: resolveSiteUrl(),

  email: "peninapearl23@gmail.com",
  // Display phone (Hebrew/local format) + E.164 for tel: links.
  phone: "054-754-7452",
  phoneE164: "+972547547452",
  // wa.me wants the number in international form without "+" or separators.
  whatsappUrl: "https://wa.me/972547547452",

  // Public profiles, surfaced as schema.org `sameAs` for entity disambiguation.
  // Empty strings are filtered out before use, so unknown ones can stay blank.
  profiles: {
    instagram: "https://www.instagram.com/penina.phaff/",
    facebook: "",
    linkedin: "",
    youtube: "",
  },
  /** Handle shown next to the Instagram link, without the leading @. */
  instagramHandle: "penina.phaff",

  defaultTitle: "פנינה פאף | ליווי אישי לנשים שחוו פגיעה מינית",
  description:
    "ליווי אישי, דיסקרטי ובקצב שלך לנשים שחוו פגיעה מינית. שיחת היכרות של 40-60 דקות, בטלפון או בזום, ללא עלות וללא התחייבות.",

  founder: {
    // Latin name stays canonical for SEO / schema.org.
    name: "Penina Phaff",
    // Hebrew display name for user-facing copy.
    nameHe: "פנינה פאף",
    // Her own framing, from her Instagram bio: she accompanies women, she is
    // not a licensed clinician. Titles like "פסיכולוגית" / "פסיכותרפיסטית" are
    // protected in Israel — do not upgrade this into a clinical-sounding one.
    role: "מלווה אישית לנשים שחוו פגיעה מינית",
    roleEn: "Personal mentor for women recovering from sexual assault",
    location: "Israel",
    // `experienceYears: 0` used to live here to feed the stats strip. Both are
    // gone (v0.9.0): the strip was deleted rather than kept empty, and a config
    // field holding a placeholder zero is an invitation to fill it in with a
    // plausible guess. If she gives a real figure it comes back with a place to
    // be shown — see AGENTS.md rule 3.
  },
};

/** Founder display name for UI copy. Hebrew-only site, so always the Hebrew. */
export function founderDisplayName() {
  return siteConfig.founder.nameHe;
}

/** Social profile URLs that are actually set — used for schema.org `sameAs`. */
export function activeProfiles(): string[] {
  return Object.values(siteConfig.profiles).filter(Boolean);
}
