/**
 * Single source of truth for the site's identity.
 *
 * Everything here except `domain`/`url` is confirmed client data supplied by
 * Pnina. The domain is the one remaining unknown — see the note on it below and
 * `docs/07-deployment-target.md`.
 */
export const siteConfig = {
  // Hebrew display brand used across the UI (header, footer, meta titles).
  name: "פנינה פאף",
  // Latin/canonical name for schema.org and SEO (kept stable across locales).
  legalName: "Penina Phaff",
  // Monogram shown in the header/footer logo badge.
  monogram: "פ",

  // A subdomain of Daniel's own zone, not a dedicated domain — chosen so the
  // site can go live without waiting on a .co.il purchase. If she later buys her
  // own, every place that has to change is listed in docs/07-deployment-target.md.
  // NEXT_PUBLIC_SITE_URL still overrides this per-environment (local dev, e2e).
  domain: "pnina.trickticmedia.com",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://pnina.trickticmedia.com",

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
    "ליווי אישי, דיסקרטי ובקצב שלך לנשים שחוו פגיעה מינית. פגישת היכרות ראשונה ללא עלות וללא התחייבות.",

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
    // TODO(client): years of experience. Shown in the stats strip, which hides
    // itself entirely while every number is still 0.
    experienceYears: 0,
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
