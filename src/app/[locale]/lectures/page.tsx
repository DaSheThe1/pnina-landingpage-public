import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Check } from "lucide-react";

import {
  Eyebrow,
  PageShell,
  SectionHeading,
} from "@/components/sections/marketing-sections";
import { PageHero } from "@/components/sections/page-hero";
import { StageRevealSection } from "@/components/motion/stage-reveal-section";
import { JsonLd } from "@/components/seo/json-ld";
import { LeadButton } from "@/components/lead/lead-button";
import { PortraitFrame } from "@/components/ui/portrait-frame";
import { Reveal } from "@/components/ui/reveal";
import { media } from "@/content/media";
import { siteConfig } from "@/config/site";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

/**
 * Lectures (הרצאות). Not workshops — she does not run them.
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
 * As of Phase 1 the copy is hers: one talk ("שכבות של פנינה"), the seven kinds
 * of audience she named, frontal or Zoom, 15-150 participants. There is
 * deliberately NO price row — a booker who wants a number gets it in the
 * conversation (docs/12-redesign-plan.md, D5). The talk's length is still open
 * with her, which is why the "אורך" row honestly says it is agreed together.
 *
 * TODO(client): she should read and refine `lectures.intro.description` — it
 * was written FOR her from her own answers rather than BY her. See
 * docs/01-client-intake.md.
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
  // Indexed again as of Phase 1. This page carried `robots: noindex` while
  // every word on it was placeholder copy written before Pnina confirmed she
  // gives talks — an indexed version would have put invented claims about her
  // work in front of an HR lead searching for a speaker. The content is now
  // hers, so the block is gone, the nav entry is back and so is the sitemap
  // line (docs/12, D5).
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
  const facts = t.raw("facts.items") as string[];

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
        {/* h-11, not `size="lg"`. The `lg` size variant in button.tsx is h-9 —
            SMALLER than the h-11 every CTA on the home page uses — so the one
            action on this page rendered as the least important-looking button
            on the site, next to a mail link that was already h-11. */}
        <Reveal delay={240} className="mt-8 flex flex-wrap gap-3">
          <LeadButton
            variant="brand"
            source="lectures"
            className="h-11 rounded-lg px-5"
          >
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

      {/* "האור עולה" — the stage sequence, directly under the hero rather than
          above it: the page still has to open with its own H1 and CTA, not with
          three screens of scrub track. RENDERS NOTHING until the frames exist
          in the media bucket (docs/13 §4-5). */}
      <StageRevealSection />

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
            <div>
              <SectionHeading
                eyebrow={t("intro.eyebrow")}
                title={t("intro.title")}
                description={t("intro.description")}
              />

              {/* ── HER THREE FACTS, IN HER OWN WORDS ──
                  The only numbers anywhere on this site are hers, and these are
                  quoted from her intake answers VERBATIM — including the two
                  "כ-" hedges, which are the difference between a fact and a
                  claim (rule 3 in CLAUDE.md). Do not round "כ-5" up to "5",
                  do not turn "כ-10 שנות מסע אישי" into "10 שנות ניסיון", and do
                  not add a fourth.

                  Deliberately NOT a counter strip: no big numerals pulled out of
                  the sentences, no animation counting up, no icons. "5" set in
                  48px is a brag; her sentence set at reading size next to a gold
                  dot is a fact a booker can weigh. This is also why the strip is
                  three plain lines rather than three cards — she has given five
                  talks, and a big number would be selling the small one. */}
              <ul className="mt-8 space-y-3 border-t border-gold-line/30 pt-6">
                {facts.map((fact) => (
                  <li
                    key={fact}
                    className="flex gap-3 text-base leading-relaxed text-foreground-soft"
                  >
                    <span
                      aria-hidden
                      className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold"
                    />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Who it is for + practical format, side by side: the two questions a
          booker actually needs answered before they email.

          ── SECTION ORDER (Daniel, 2026-07-29) ──
          This block sits ABOVE "על מה אני מדברת", not below it. A booker's first
          two questions are "is this for my people?" and "how long, how many, on
          Zoom or in the room?" — qualify first, then read what the talk actually
          says. The band border lives here, on the middle section, so the page
          still reads plain / band / plain / CTA from top to bottom. If topics
          ever moves back up, move the `border-y` with it. */}
      <section className="border-y border-foreground/[0.06] bg-background px-6 py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
          <Reveal>
            <div>
              <Eyebrow>{t("audiences.eyebrow")}</Eyebrow>
              <h2 className="mt-5 text-[2.4rem] text-balance">
                {t("audiences.title")}
              </h2>
              <ul className="mt-6 space-y-3">
                {audiences.map((audience, i) => (
                  <li key={i} className="flex gap-3 text-foreground-soft">
                    <Check
                      aria-hidden
                      className="mt-1 h-4 w-4 shrink-0 text-teal-deep"
                    />
                    <span className="text-base leading-relaxed">{audience}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="rounded-2xl border border-foreground/[0.08] bg-surface-1 p-7 shadow-card">
              <Eyebrow>{t("format.eyebrow")}</Eyebrow>
              <h2 className="mt-5 text-[2rem]">
                {t("format.title")}
              </h2>
              <dl className="mt-6 space-y-5">
                {formatItems.map((item, i) => (
                  <div key={i}>
                    <dt className="text-sm font-medium text-foreground">
                      {item.title}
                    </dt>
                    <dd className="mt-1 text-sm leading-normal text-muted-foreground">
                      {item.text}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>
      </section>

      {/* What the talk covers — the last thing before the CTA, so the page ends
          on her content rather than on logistics. */}
      <section className="bg-background px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <SectionHeading
              align="center"
              eyebrow={t("topics.eyebrow")}
              title={t("topics.title")}
              description={t("topics.description")}
            />
          </Reveal>
          {/* The grid maps the array, and right now the array has ONE entry:
              she gives one talk. A single card stranded in a three-column grid
              reads as two missing cards, so a one-item list centres itself at a
              readable width instead. Add topics to `lectures.topics.items` and
              the grid comes back on its own. */}
          <div
            className={cn(
              "mt-12 grid gap-5",
              topics.length === 1
                ? "mx-auto max-w-2xl"
                : "md:grid-cols-2 lg:grid-cols-3"
            )}
          >
            {topics.map((topic, index) => (
              <Reveal key={index} delay={(index % 3) * 80}>
                <div className="h-full rounded-2xl border border-foreground/[0.08] bg-surface-1 p-6 shadow-card sm:p-8">
                  <h3 className="text-xl font-medium tracking-tight text-foreground">
                    {topic.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                    {topic.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA — booking language, not "leave your details". */}
      <section className="bg-background px-6 pb-24">
        <Reveal>
          <div className="mx-auto max-w-4xl rounded-2xl border border-brand/20 bg-brand-wash px-8 py-12 text-center shadow-card">
            <h2 className="text-[2.4rem] text-balance">
              {t("closing.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              {t("closing.description")}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <LeadButton
                variant="brand"
                source="lectures"
                className="h-12 rounded-lg px-6 text-base"
              >
                {t("cta.primary")}
              </LeadButton>
            </div>
          </div>
        </Reveal>
      </section>
    </PageShell>
  );
}
