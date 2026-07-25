import type { Metadata, Viewport } from "next";
import { Heebo, Suez_One } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Analytics } from "@/components/analytics/analytics";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { BackToTop, ScrollProgress } from "@/components/layout/scroll-utils";
import { SiteBackground } from "@/components/layout/site-background";
import { FloatingWhatsApp } from "@/components/layout/floating-whatsapp";
import { PageTransition } from "@/components/layout/page-transition";
import { LeadDialogProvider } from "@/components/lead/lead-dialog";
import { siteConfig } from "@/config/site";
import { localeDirection, routing, type Locale } from "@/i18n/routing";

import "../globals.css";

// Body/UI face. Heebo is a Hebrew-native sans with a genuinely wide weight
// range and tabular-friendly Latin numerals, so Hebrew copy, English words and
// phone numbers all sit on one baseline. (The scaffold this replaced shipped
// Inter with the LATIN subset only, so every Hebrew glyph silently fell back to
// whatever the device had — on a Hebrew-only site, that is the entire page.)
const heebo = Heebo({
  variable: "--font-sans-hebrew",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

// Display face for headlines only (h1/h2 + `.font-display`). Suez One is a
// heavy Hebrew slab-serif: one weight, deliberately bold, and instantly
// recognisable as a designed choice rather than a default. It is the single
// biggest reason the page no longer reads as a template.
//
// One weight only (400) — see the h1/h2 note in globals.css before setting any
// font-weight on it.
const suezOne = Suez_One({
  variable: "--font-display",
  subsets: ["hebrew", "latin"],
  weight: ["400"],
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// This is an intentionally light-only ("plum · teal · gold") design. Declare the
// light scheme to the UA so form controls and scrollbars render light and no
// engine tries to re-dark the page.
//
// Note we do NOT set `darkreader-lock` here (the template did). Locking out a
// user's own reading-comfort extension is the wrong trade on this site — brand
// fidelity is worth less than someone being able to read the page the way they
// need to. See AGENTS.md.
export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#fdf5ea",
};

// Per-locale root metadata. Hebrew (default) lives under /he and English under
// /en — alternates expose both to crawlers via hreflang.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as "he", namespace: "pages.home" });
  const canonical = siteConfig.url;

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: t("metaTitle"),
      template: `%s | ${siteConfig.name}`,
    },
    description: t("metaDescription"),
    alternates: {
      canonical,
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: canonical,
      siteName: siteConfig.name,
      locale: "he_IL",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
    robots: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  // Enables static rendering for this locale.
  setRequestLocale(locale as Locale);

  const dir = localeDirection[locale as Locale];

  return (
    <html
      lang={locale}
      dir={dir}
      data-scroll-behavior="smooth"
      className={`${heebo.variable} ${suezOne.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <NextIntlClientProvider>
          <SiteBackground />
          <ScrollProgress />
          <LeadDialogProvider>
            <SiteHeader />
            <PageTransition>{children}</PageTransition>
            <SiteFooter />
            <BackToTop />
            <FloatingWhatsApp />
          </LeadDialogProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
