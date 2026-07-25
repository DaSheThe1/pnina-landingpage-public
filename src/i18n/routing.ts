import { defineRouting } from "next-intl/routing";

/**
 * Hebrew-only, served at the root (/, /about, /lectures …).
 *
 * `localePrefix: "as-needed"` means the default locale carries no URL prefix, so
 * every link and canonical URL is prefix-free. Do NOT "simplify" this to
 * `"never"` — with a single locale that setting makes next-intl's internal
 * rewrite surface as a 307 back to the same path, i.e. an infinite redirect loop
 * on every page, in dev as well as in a production server. It looks like the
 * tidier option and it is not.
 *
 * To add English later: append "en" to `locales`, add `messages/en.json`, give
 * `localeDirection` an `en: "ltr"` entry, and restore a language switcher in the
 * header. No routing change is needed — "as-needed" already does the right thing
 * for a second locale (English would live under /en).
 */
export const routing = defineRouting({
  locales: ["he"],
  defaultLocale: "he",
  localePrefix: "as-needed",
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

export const localeDirection: Record<Locale, "rtl" | "ltr"> = {
  he: "rtl",
};
