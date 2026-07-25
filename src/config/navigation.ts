/**
 * Site navigation.
 *
 * This is a single-page funnel with a small number of real sub-pages, so the
 * header mixes in-page anchors (the funnel) with routes (the pages that stand
 * on their own). `key` maps to the `nav.*` message keys; labels are translated
 * at render time.
 */
export const mainNavigation = [
  // The funnel lives on `/` — these jump into it rather than navigating away.
  { key: "approach", href: "/#approach" },
  { key: "process", href: "/#process" },
  { key: "about", href: "/about" },
  // Different audience entirely (organisations booking a talk), so it gets a
  // page and its own CTA rather than a section — see docs/02-site-structure.md.
  { key: "lectures", href: "/lectures" },
  // Reviews, not the FAQ. The FAQ section is still on the page (and still
  // linked from `#faq` anchors); what a header slot is worth is the section a
  // hesitating visitor most needs to see, and that is other women's words.
  { key: "testimonials", href: "/#testimonials" },
] as const;

/**
 * The footer list. Same links as the header plus the FAQ, which lost its header
 * slot to the reviews but is still a page section people go looking for.
 */
export const footerNavigation = [
  ...mainNavigation,
  { key: "faq", href: "/#faq" },
] as const;

export const legalNavigation = [
  { key: "privacy", href: "/privacy" },
  { key: "terms", href: "/terms" },
  // Required for an Israeli business site (תקנות שוויון זכויות לאנשים עם
  // מוגבלות; ת"י 5568). Keep it linked from the footer on every page.
  { key: "accessibility", href: "/accessibility" },
] as const;

/** Anchor ids the header links into. Kept here so a rename breaks in one place. */
export const sectionIds = {
  approach: "approach",
  process: "process",
  testimonials: "testimonials",
  faq: "faq",
  contact: "contact",
} as const;
