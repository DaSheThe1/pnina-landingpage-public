import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Layers,
  Mail,
  MessageCircle,
  Sparkles,
  Star,
} from "lucide-react";

import { Eyebrow, PageShell } from "@/components/sections/marketing-sections";
import { ThankYouVideo } from "@/components/sections/thank-you-video";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const nextStepIcons = [MessageCircle, Clock, CalendarCheck];
const whileYouWaitIcons = [Layers, Sparkles, Star];

// Post-conversion page — reached after the contact form is submitted. Kept out
// of search indexes (and the sitemap) so it only ever shows to real leads.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as "he" | "en", namespace: "pages.thankYou" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    robots: { index: false, follow: false },
    // Root-served, no locale prefix — the real URL is /thank-you/, not /he/thank-you.
    alternates: { canonical: `${siteConfig.url}/thank-you` },
  };
}

export default async function ThankYouPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as "he" | "en");
  const t = await getTranslations({ locale: locale as "he" | "en", namespace: "pages.thankYou" });
  const nextSteps = t.raw("nextSteps") as { title: string; text: string }[];
  const whileYouWait = t.raw("whileYouWait") as {
    title: string;
    text: string;
    href: string;
  }[];

  return (
    <PageShell>
      <section className="relative overflow-hidden">
        {/* A fade into the page — the thank-you hero stays clean and light,
            with no coloured aurora wash. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background"
        />

        <div className="relative mx-auto w-full max-w-6xl px-6 pb-20 pt-20 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal className="flex justify-center">
              <Eyebrow>{t("eyebrow")}</Eyebrow>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-6 text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">
                <span className="text-foreground">{t("titleLead")}</span>
                <span className="text-shimmer">{t("titleHighlight")}</span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
                {t("subtitle")}
              </p>
            </Reveal>
          </div>

          {/* The video is the point of this page — give it the most room. */}
          <Reveal delay={200} className="mt-10 lg:mt-12">
            <ThankYouVideo />
          </Reveal>

          <Reveal delay={120}>
            <p className="mx-auto mt-8 flex max-w-md items-center justify-center gap-2 text-center text-sm text-subtle-foreground">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-accent" />
              {t("reassurance")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* What happens next */}
      <section className="bg-background px-6 pb-20">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="text-center font-medium text-xs uppercase tracking-[0.18em] text-subtle-foreground">
              {t("whatNext")}
            </p>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {nextSteps.map(({ title, text }, i) => {
              const Icon = nextStepIcons[i] ?? MessageCircle;
              return (
                <Reveal key={title} delay={i * 90} className="h-full">
                  <div className="relative h-full rounded-2xl border border-foreground/[0.08] bg-foreground/[0.02] p-6">
                    <span className="absolute end-5 top-5 font-medium text-xs text-subtle-foreground">
                      0{i + 1}
                    </span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-foreground/12 bg-brand/10 text-brand-accent">
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="mt-4 text-[15px] font-medium text-foreground">
                      {title}
                    </p>
                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                      {text}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* While you wait — keep them on the site instead of bouncing */}
      <section className="bg-background px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="ring-shine relative overflow-hidden rounded-3xl border border-foreground/[0.08] bg-surface-1 p-7 sm:p-9">
              <div
                aria-hidden
                className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand/15 blur-[100px]"
              />
              <div className="relative">
                <h2 className="text-2xl tracking-tight text-foreground sm:text-3xl">
                  {t("whileYouWaitTitle")}
                </h2>
                <p className="mt-2 max-w-xl text-muted-foreground">
                  {t("whileYouWaitText")}
                </p>
                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  {whileYouWait.map(({ title, text, href }, i) => {
                    const Icon = whileYouWaitIcons[i] ?? Layers;
                    return (
                      <Link
                        key={title}
                        href={href}
                        className="group flex flex-col rounded-2xl border border-foreground/[0.08] bg-foreground/[0.02] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:bg-foreground/[0.04]"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-foreground/12 bg-brand/10 text-brand-accent transition-transform duration-300 group-hover:scale-110">
                          <Icon className="h-4.5 w-4.5" />
                        </span>
                        <span className="mt-4 flex items-center gap-1 text-[15px] font-medium text-foreground-soft transition-colors group-hover:text-foreground">
                          {title}
                          <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                        </span>
                        <span className="mt-1 text-sm leading-6 text-muted-foreground">
                          {text}
                        </span>
                      </Link>
                    );
                  })}
                </div>

                <div className="mt-8 flex flex-col items-start gap-4 border-t border-foreground/[0.06] pt-7 sm:flex-row sm:items-center sm:justify-between">
                  <a
                    href={`mailto:${siteConfig.email}`}
                    className="inline-flex items-center gap-1.5 text-sm text-brand-accent transition-colors hover:text-brand-hover"
                  >
                    <Mail className="h-4 w-4" />
                    {t("emailLine")} {siteConfig.email}
                  </a>
                  <Link
                    href="/"
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "h-10 rounded-lg px-4"
                    )}
                  >
                    {t("backHome")}
                    <ArrowRight data-icon="inline-end" />
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
