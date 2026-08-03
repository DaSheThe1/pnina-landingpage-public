import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageShell } from "@/components/sections/marketing-sections";
import {
  LegalLayout,
  LegalSections,
  type LegalContentSection,
} from "@/components/sections/legal";
import { PageHero } from "@/components/sections/page-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";

/**
 * Accessibility statement (הצהרת נגישות).
 *
 * Not optional decoration: Israeli law (תקנות שוויון זכויות לאנשים עם מוגבלות
 * (התאמות נגישות לשירות), and the ת"י 5568 standard it points at) requires a
 * business website serving the Israeli public to publish one, name a contact
 * for accessibility issues, and state the site's actual conformance level.
 *
 * ⚠️ The copy in `pages.accessibility` in messages/he.json is a scaffold with
 * PLACEHOLDER fields. It must state what is ACTUALLY true of this site before
 * launch — the conformance level we really reached, the date it was last
 * reviewed, and a real contact route for someone who hits a barrier. An
 * accessibility statement that overstates conformance is worse than none:
 * it tells a disabled visitor the problem is theirs. See docs/09-accessibility.md.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as "he",
    namespace: "pages.accessibility",
  });
  return pageMetadata({
    locale,
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/accessibility",
  });
}

export default async function AccessibilityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as "he");
  const t = await getTranslations({
    locale: locale as "he",
    namespace: "pages.accessibility",
  });
  const tNav = await getTranslations({ locale: locale as "he", namespace: "nav" });
  const sections = t.raw("sections") as LegalContentSection[];

  return (
    <PageShell>
      <JsonLd
        data={breadcrumbSchema(
          [{ name: t("heroTitle"), path: "/accessibility" }],
          tNav("home")
        )}
      />
      <PageHero
        title={t("heroTitle")}
        description={t("heroDescription")}
      />

      <LegalLayout lastUpdated={t("lastUpdated")}>
        <LegalSections sections={sections} />
      </LegalLayout>
    </PageShell>
  );
}
