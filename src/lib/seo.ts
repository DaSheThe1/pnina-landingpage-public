import type { Metadata } from "next";

import { hasMedia, media } from "@/content/media";
import { siteConfig } from "@/config/site";
import type { Faq } from "@/content/faq";

type PageSeo = {
  /** Active locale; decides canonical and og:locale. */
  locale: string;
  title: string;
  description: string;
  /** Route path starting with "/", e.g. "/services". */
  path: string;
};

function localizedUrl(_locale: string, path: string) {
  // Hebrew-only and served at the root (no locale prefix), so the canonical
  // URL is simply the site URL + path.
  return `${siteConfig.url}${path}`;
}

// Per-page metadata with canonical, Open Graph, and Twitter card. The site is
// Hebrew-only for now, so there are no hreflang alternates yet — add a
// `languages` map here when a second locale ships.
export function pageMetadata({
  locale,
  title,
  description,
  path,
}: PageSeo): Metadata {
  const canonical = localizedUrl(locale, path);
  const fullTitle = `${title} | ${siteConfig.name}`;
  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      siteName: siteConfig.name,
      locale: "he_IL",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}

/* ──────────────────  JSON-LD schema builders (schema.org)  ────────────────── */

const organizationId = `${siteConfig.url}/#organization`;
const founderId = `${siteConfig.url}/#founder`;

// Public profile URLs (Instagram, etc.) as a flat list, empties dropped. Used
// as schema.org `sameAs` so search/AI engines can disambiguate the entity.
const sameAs = Object.values(siteConfig.profiles).filter(Boolean);

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": organizationId,
    name: siteConfig.legalName,
    alternateName: siteConfig.name,
    url: siteConfig.url,
    image: `${siteConfig.url}/images/render-modern-pool-villas.webp`,
    email: siteConfig.email,
    telephone: siteConfig.phoneE164,
    description: siteConfig.description,
    ...(sameAs.length ? { sameAs } : {}),
    areaServed: ["מרכז", "צפון", "ישראל"],
    address: {
      "@type": "PostalAddress",
      addressCountry: "IL",
    },
    founder: { "@id": founderId },
    knowsAbout: [
      "תכנון אדריכלי",
      "עיצוב פנים",
      "וילות ובתי יוקרה",
      "תכנון בנייה חדשה",
      "ליווי שיפוצים",
      "היתרי בנייה",
      "תוכניות חשמל ואינסטלציה",
      "תכנון ממ\"ד",
      "Interior design",
      "Architecture",
    ],
  };
}

export function webSiteSchema(locale: string = "he") {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    name: siteConfig.name,
    url: siteConfig.url,
    publisher: { "@id": organizationId },
    inLanguage: locale,
  };
}

export function personSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": founderId,
    name: siteConfig.founder.name,
    jobTitle: siteConfig.founder.roleEn,
    worksFor: { "@id": organizationId },
    nationality: siteConfig.founder.location,
    url: `${siteConfig.url}/about`,
    // Only advertise a portrait to search engines once a real one exists —
    // a 404 image in schema.org markup is worse than omitting the field.
    ...(hasMedia(media.aboutPortrait)
      ? { image: `${siteConfig.url}${media.aboutPortrait.src}` }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function faqPageSchema(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function breadcrumbSchema(
  items: { name: string; path: string }[],
  homeName = "בית"
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: homeName, path: "" }, ...items].map(
      (item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: `${siteConfig.url}${item.path}`,
      })
    ),
  };
}
