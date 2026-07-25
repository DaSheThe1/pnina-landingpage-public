import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Check } from "lucide-react";

import {
  Eyebrow,
  PageShell,
  SectionHeading,
} from "@/components/sections/marketing-sections";
import { PageHero } from "@/components/sections/page-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { LeadButton } from "@/components/lead/lead-button";
import { PortraitFrame } from "@/components/ui/portrait-frame";
import { Reveal } from "@/components/ui/reveal";
import { media } from "@/content/media";
import { siteConfig } from "@/config/site";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";

/**
 * Lectures & workshops (הרצאות וסדנאות).
 *
 * This page exists because it serves a DIFFERENT AUDIENCE from the rest of the
 * site: an HR lead, a school counsellor or a community centre booking a speaker,
 * not a woman looking for personal support. Mixing the two on one page weakens
 * both — the personal page has to feel safe and unhurried, this one has to
 * answer "what will you deliver, to whom, for how long".
 *
 * Keep the tone here professional rather than intimate, and keep the CTA
 * separate: an organisation books a call, it does not "leave details for a free
 * first session".
 *
 * TODO(client): the whole page is placeholder copy until she confirms she gives
 * talks at all, and what they cover — question 5 of the intake
 * (docs/01-client-intake.md). If she does not, delete this route, its nav entry
 * in src/config/navigation.ts, and its sitemap entry.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as "he",
    namespace: "pages.lectures",
  });
  return pageMetadata({
    locale,
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: "/lectures",
  });
}

type Topic = { title: string; text: string };

export default async function LecturesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as "he");
  const t = await getTranslations({
    locale: locale as "he",
    namespace: "lectures",
  });
  const tPage = await getTranslations({
    locale: locale as "he",
    namespace: "pages.lectures",
  });
  const tNav = await getTranslations({ locale: locale as "he", namespace: "nav" });

  const topics = t.raw("topics.items") as Topic[];
  const audiences = t.raw("audiences.items") as string[];
  const formatItems = t.raw("format.items") as Topic[];

  return (
    <PageShell>
      <JsonLd
        data={breadcrumbSchema(
          [{ name: tPage("heroTitle"), path: "/lectures" }],
          tNav("home")
        )}
      />

      <PageHero
        eyebrow={tPage("heroEyebrow")}
        title={tPage("heroTitle")}
        description={tPage("heroDescription")}
      >
        <Reveal delay={240} className="mt-8 flex flex-wrap gap-3">
          <LeadButton variant="brand" size="lg" source="lectures">
            {t("cta.primary")}
          </LeadButton>
          <a
            href={`mailto:${siteConfig.email}`}
            className="inline-flex h-11 items-center rounded-lg border border-foreground/12 bg-foreground/[0.03] px-5 text-sm font-medium text-foreground-soft transition-colors hover:border-brand/40 hover:text-brand-accent"
          >
            {t("cta.secondary")}
          </a>
        </Reveal>
      </PageHero>

      {/* Intro + a photo of her actually speaking — for this audience that
          single image does more selling than any paragraph. */}
      <section className="bg-background px-6 py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1fr]">
          <Reveal>
            <PortraitFrame
              slot={media.lecturesPortrait}
              className="aspect-[4/3]"
              sizes="(min-width: 1024px) 45vw, 90vw"
            />
          </Reveal>
          <Reveal delay={80}>
            <SectionHeading
              eyebrow={t("intro.eyebrow")}
              title={t("intro.title")}
              description={t("intro.description")}
            />
          </Reveal>
        </div>
      </section>

      {/* What the talks cover. */}
      <section className="border-y border-foreground/[0.06] bg-background px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionHeading
              align="center"
              eyebrow={t("topics.eyebrow")}
              title={t("topics.title")}
              description={t("topics.description")}
            />
          </Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic, index) => (
              <Reveal key={index} delay={(index % 3) * 80}>
                <div className="h-full rounded-2xl border border-foreground/[0.08] bg-surface-1 p-6 shadow-card">
                  <h3 className="text-lg font-medium tracking-tight text-foreground">
                    {topic.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                    {topic.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Who it is for + practical format, side by side: the two questions a
          booker actually needs answered before they email. */}
      <section className="bg-background px-6 py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
          <Reveal>
            <div>
              <Eyebrow>{t("audiences.eyebrow")}</Eyebrow>
              <h2 className="mt-5 text-3xl tracking-tight text-balance">
                {t("audiences.title")}
              </h2>
              <ul className="mt-6 space-y-3">
                {audiences.map((audience, i) => (
                  <li key={i} className="flex gap-3 text-foreground-soft">
                    <Check
                      aria-hidden
                      className="mt-1 h-4 w-4 shrink-0 text-teal-deep"
                    />
                    <span className="leading-7">{audience}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="rounded-2xl border border-foreground/[0.08] bg-surface-1 p-7 shadow-card">
              <Eyebrow>{t("format.eyebrow")}</Eyebrow>
              <h2 className="mt-5 text-2xl tracking-tight">
                {t("format.title")}
              </h2>
              <dl className="mt-6 space-y-5">
                {formatItems.map((item, i) => (
                  <div key={i}>
                    <dt className="text-sm font-medium text-foreground">
                      {item.title}
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-muted-foreground">
                      {item.text}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Closing CTA — booking language, not "leave your details". */}
      <section className="bg-background px-6 pb-24">
        <Reveal>
          <div className="mx-auto max-w-4xl rounded-2xl border border-brand/20 bg-brand-wash px-8 py-12 text-center shadow-card">
            <h2 className="text-3xl tracking-tight text-balance">
              {t("closing.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-7 text-muted-foreground">
              {t("closing.description")}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <LeadButton variant="brand" size="lg" source="lectures">
                {t("cta.primary")}
              </LeadButton>
            </div>
          </div>
        </Reveal>
      </section>
    </PageShell>
  );
}
