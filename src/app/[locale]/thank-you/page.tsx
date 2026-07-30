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
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
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
      <section className="relative overflow-clip bg-background">
        {/* The thank-you hero stays clean and light, with no coloured aurora
            wash. A `from-transparent to-background` fade band used to sit here
            and painted nothing — `--background` was transparent by design on
            this site at the time, so it faded transparent into transparent.
            Removed.

            `bg-background` IS painting something now: as of 0.12.1 that token is
            the translucent paper veil every content band lays over the sand
            photograph (globals.css, the note beside the token). This band needs
            it — "הפרטים הגיעו אליי בלבד" is the site's tightest small-text pair
            and it sat straight on the plate at 3.58:1 without it.

            The clip is `overflow-clip`, not `overflow-hidden`, and that is not
            tidying: `hidden` makes an element a SCROLL CONTAINER, and
            `animation-timeline: view()` (globals.css §1) resolves against the
            nearest scroll container rather than the viewport. With `hidden`
            here, the reassurance line and the WhatsApp row below the video
            measured themselves against a box that never scrolls and froze at
            0.49 and 0.30 opacity forever. `clip` clips the same box and is not
            a scroll container. Never `hidden`. */}

        <div className="relative mx-auto w-full max-w-6xl px-6 pb-20 pt-20 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal className="flex justify-center">
              <Eyebrow>{t("eyebrow")}</Eyebrow>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-6 text-[2.85rem] leading-[1.06] text-balance sm:text-[3.75rem]">
                <span className="text-foreground">{t("titleLead")}</span>
                <span className="text-shimmer">{t("titleHighlight")}</span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
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

          {/* A visible way to reach her right now. The page's whole promise is
              "I will call you back", which is a wait — and for someone who has
              just pressed send, writing is often easier than waiting. Uses the
              shared WhatsApp link so the opening line is pre-filled. */}
          <Reveal delay={160}>
            <div className="mt-6 flex justify-center">
              <WhatsAppLink
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-11 rounded-lg px-5"
                )}
              >
                <WhatsAppIcon className="h-4.5 w-4.5 shrink-0 text-[#25d366]" />
                {t("whatsappCta")}
              </WhatsAppLink>
            </div>
          </Reveal>
        </div>
      </section>

      {/* What happens next.

          `pt-10` is a CONTRAST fix, not spacing taste. `bg-background` paints the
          paper veil as a gradient that ramps up out of nothing over `--paper-fade`
          (2rem — globals.css §10), so the sand runs back to full strength in a soft
          band at every join between two sections. The rule that keeps that safe is
          "no line of type ever starts inside the ramp", and it holds everywhere
          else because these bands carry `py-12` or open with an opaque card. This
          one had padding on the bottom only, so "מה עכשיו" sat in the ramp with
          almost no paper under it. It survived while the plate was being lifted
          ×1.09 (4.54:1); on Daniel's actual photograph it measured 3.98:1. */}
      <section className="bg-background px-6 pt-10 pb-20">
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
                  {/* SOLID `surface-1`, same call as the /about "why" cards
                      (2026-07-30). The old `bg-foreground/[0.02]` tint was built
                      for a flat cream band; with the paper veil off, the sand
                      photograph reads straight through it and these three steps
                      stop looking like cards. `surface-1` is white on paper and
                      the card surface on dark, so it lifts in both schemes.

                      This also retires the `pt-10` contrast worry noted above:
                      "מה עכשיו" is still open type, but the steps under it are
                      now on opaque cards rather than floating on the plate. */}
                  <div className="h-full rounded-2xl border border-foreground/[0.08] bg-surface-1 p-6">
                    {/* The step number sits WITH the icon, not pinned to the
                        far corner. It used to be `absolute end-5 top-5`, which
                        stranded a tiny "01" across the card from the thing it
                        numbered — on a phone, most of a card's width away from
                        it, reading as a stray label rather than as a step. */}
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-foreground/12 bg-brand/10 text-brand-accent">
                        <Icon className="h-5 w-5" />
                      </span>
                      {/* Forced LTR so "01" cannot reorder to "10" inside the
                          surrounding RTL document. */}
                      <span
                        dir="ltr"
                        className="font-medium tabular-nums text-xs text-subtle-foreground"
                      >
                        0{i + 1}
                      </span>
                    </div>
                    <p className="mt-4 text-base font-medium text-foreground">
                      {title}
                    </p>
                    <p className="mt-1.5 text-sm leading-normal text-muted-foreground">
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
                <h2 className="text-[2rem] text-foreground sm:text-[2.4rem]">
                  {t("whileYouWaitTitle")}
                </h2>
                <p className="mt-2 max-w-xl text-base text-muted-foreground">
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
                        <span className="mt-4 flex items-center gap-1 text-base font-medium text-foreground-soft transition-colors group-hover:text-foreground">
                          {title}
                          <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                        </span>
                        <span className="mt-1 text-sm leading-normal text-muted-foreground">
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
