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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as "he" | "en", namespace: "pages.privacy" });
  return pageMetadata({
    locale,
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/privacy",
  });
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as "he" | "en");
  const t = await getTranslations({ locale: locale as "he" | "en", namespace: "pages.privacy" });
  const tNav = await getTranslations({ locale: locale as "he" | "en", namespace: "nav" });
  const sections = t.raw("sections") as LegalContentSection[];

  return (
    <PageShell>
      <JsonLd
        data={breadcrumbSchema(
          [{ name: t("heroTitle"), path: "/privacy" }],
          tNav("home")
        )}
      />
      <PageHero
        eyebrow={t("heroEyebrow")}
        title={t("heroTitle")}
        description={t("heroDescription")}
      />

      <LegalLayout lastUpdated={t("lastUpdated")}>
        <LegalSections sections={sections} />
      </LegalLayout>
    </PageShell>
  );
}
