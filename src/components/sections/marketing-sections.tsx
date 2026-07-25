import type { ReactNode } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronsDown,
  Phone,
  Sparkles,
  Target,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { LeadButton } from "@/components/lead/lead-button";
import { HeroVideo } from "@/components/sections/hero-video";
import { PriceCrossout } from "@/components/sections/price-crossout";
import { InstagramIcon } from "@/components/ui/instagram-icon";
import { PortraitFrame } from "@/components/ui/portrait-frame";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { hasMedia, media } from "@/content/media";
import { Reveal } from "@/components/ui/reveal";
import { services as serviceConfig } from "@/content/services";
import { processSteps } from "@/content/process";
import { offers } from "@/content/offers";
import { founderDisplayName, siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type ServiceItem = { title: string; description: string; details: string[] };
type OfferItem = {
  bestFor: string;
  title: string;
  summary: string;
  includes: string[];
  cta: string;
};
type TitledText = { title: string; text: string };

/* ──────────────────────────  Shared  ────────────────────────── */

export function PageShell({ children }: { children: ReactNode }) {
  return <main className="flex-1">{children}</main>;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-surface-2/85 px-3.5 py-1.5 text-[13px] font-semibold tracking-[0.04em] text-brand-accent shadow-card backdrop-blur-sm">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-accent opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-accent" />
      </span>
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  gradient = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  gradient?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow ? (
        <div className={cn("mb-5", align === "center" && "flex justify-center")}>
          <Eyebrow>{eyebrow}</Eyebrow>
        </div>
      ) : null}
      <h2
        className={cn(
          "text-3xl tracking-tight text-balance sm:text-4xl",
          gradient ? "text-gradient" : "text-foreground"
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-[17px]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

/* ──────────────────────────  Hero  ────────────────────────── */

export function HeroSection() {
  const t = useTranslations("hero");
  const badges = t.raw("badges") as string[];

  return (
    <section className="relative overflow-hidden">
      {/* Backdrop layers */}
      {/* Plum overhead, teal on the far side. The counterweight matters: with
          only the plum blob the entire top of the page washed pink and the
          palette read as one hue rather than as a complementary pair. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[42rem] w-[60rem] -translate-x-1/2 animate-aurora rounded-full bg-[radial-gradient(circle_at_center,rgba(194,74,133,0.26),transparent_62%)] blur-[90px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-12%] top-24 h-[28rem] w-[28rem] animate-float rounded-full bg-[radial-gradient(circle_at_center,rgba(224,169,63,0.22),transparent_60%)] blur-[100px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-12%] top-56 h-[26rem] w-[26rem] animate-float rounded-full bg-[radial-gradient(circle_at_center,rgba(27,155,144,0.2),transparent_62%)] blur-[100px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background"
      />

      {/* Her clip is vertical, so on lg+ it sits BESIDE the copy rather than
          under it — a 9:16 frame stacked below a centred headline pushes the
          first CTA a full screen down. On mobile the single column restores the
          original order: headline, then the video as the immediate focal point,
          then the rest. The lg grid places all three blocks explicitly, which
          overrides the mobile `order-*` values. */}
      {/* The video column is a fixed track, not `auto`: an auto track sized
          around a `w-full` child collapses to nothing. */}
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-6 pb-10 pt-6 sm:pb-16 lg:grid lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-center lg:gap-x-14 lg:pt-10">
        {/* self-end / self-start on the two copy rows: the video spans both
            rows and is taller than they are, so without this the leftover
            height is split between them and a gap opens under the headline. */}
        <div className="order-1 max-w-3xl text-center lg:col-start-1 lg:row-start-1 lg:self-end lg:text-start">
          <Reveal className="flex justify-center lg:justify-start">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-5 text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">
              {t("titleLead")}
              <em className="font-display not-italic text-brand-accent">
                {t("titleHighlight")}
              </em>
              {t("titleTrail")}
            </h1>
          </Reveal>
        </div>

        <Reveal
          delay={200}
          className="order-2 mt-9 w-full lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0"
        >
          <HeroVideo />
        </Reveal>

        <div className="order-3 w-full max-w-3xl lg:col-start-1 lg:row-start-2 lg:self-start">
          <Reveal delay={160}>
            <p className="mt-8 text-center text-lg leading-8 text-foreground lg:mt-6 lg:text-start">
              {t("subtitle")}
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <LeadButton
                variant="brand"
                className="h-11 rounded-lg px-5 text-[15px]"
              >
                {t("ctaPrimary")}
                <ArrowRight data-icon="inline-end" />
              </LeadButton>
              <Link
                href="/#testimonials"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-11 rounded-lg px-5 text-[15px]"
                )}
              >
                {t("ctaSecondary")}
              </Link>
            </div>
          </Reveal>

          {/* Teal, not plum: these three pills are the page's first reassurance
              signal, and teal is the reassurance colour in this system (see
              globals.css). It also breaks up the pink hero. */}
          <Reveal delay={220}>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
              {badges.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal-soft/50 px-3.5 py-1.5 text-sm font-medium text-foreground-soft shadow-card backdrop-blur-sm"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-deep" />
                  {item}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────  Process  ────────────────────────── */

/** Copy shape for one process step. Line breaks are hers — see the note in
 *  ProcessSection before collapsing `lines` into a single string. */
type ProcessCopy = { title: string; lines: string[] };

/**
 * Per-step tints. Each step wears one colour from the palette across its offset
 * frame line, number plate, rule and fallback panel, so the four rows walk
 * plum → teal → gold → plum instead of repeating one hue four times.
 */
const STEP_TINTS = {
  plum: {
    panel: "from-brand-wash via-surface-2 to-brand-soft/70",
    numeral: "text-brand/30",
    icon: "border-brand/30 bg-white/85 text-brand-accent",
    rule: "bg-brand/45",
  },
  teal: {
    panel: "from-teal-soft/70 via-surface-1 to-teal-soft",
    numeral: "text-teal/35",
    icon: "border-teal/30 bg-white/85 text-teal-deep",
    rule: "bg-teal/45",
  },
  gold: {
    panel: "from-gold-soft/80 via-surface-1 to-gold-soft",
    numeral: "text-gold/45",
    icon: "border-gold/40 bg-white/85 text-gold-deep",
    rule: "bg-gold/55",
  },
} as const;

/**
 * The four steps, as four cards that sit side by side on a wide screen and
 * stack on a narrow one.
 *
 * Layout history, so nobody re-derives it. First shape: a two-sided timeline
 * where every step after the first was pulled 5rem UP into the one before
 * (`md:-mt-20`). That only holds while both columns stay exactly the same
 * height, so the moment one step's text wrapped differently the steps
 * overlapped and the section rendered as a pile. Second shape: alternating
 * full-width rows, which could not collide but made the section four screens
 * tall on a desktop — the whole process became a scroll marathon, and the point
 * of "four steps, no surprises" is that you can see all four at once.
 *
 * So: a real grid. On lg the four cards are a single horizontal row about one
 * screen tall; below that they fall to two columns and then one. Cards stretch
 * to equal height, so uneven copy lengths cannot break the row. The images move
 * to a 4:3 band at the top of each card, because a square image in a ~17rem
 * column eats the height the copy needs.
 */
export function ProcessSection() {
  const t = useTranslations("process");
  const steps = t.raw("steps") as ProcessCopy[];
  // Icons, tints and images are structural, so they live with the step config.

  return (
    <section className="relative overflow-hidden bg-background px-6 pt-8 pb-14 sm:pt-10 sm:pb-20">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[24rem] w-[48rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-[120px]"
      />
      <div className="relative mx-auto max-w-6xl">
        <Reveal>
          <SectionHeading
            eyebrow={t("eyebrow")}
            align="center"
            title={t("title")}
            description={t("description")}
          />
        </Reveal>

        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4 lg:gap-5">
          {steps.map((step, index) => {
            const config = processSteps[index];
            const Icon = config?.icon ?? Target;
            const tint = STEP_TINTS[config?.tint ?? "plum"];
            const image = config?.image;
            const number = `0${index + 1}`;

            return (
              <Reveal
                key={step.title}
                delay={index * 90}
                as="li"
                className="h-full"
              >
                <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-foreground/[0.08] bg-surface-1/80 shadow-card backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_28px_60px_-32px_rgba(38,20,31,0.45)]">
                  {/* Image band. 4:3 rather than the square the rows used — in a
                      ~17rem column a square photo is half the card. */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2">
                    {image && hasMedia(image) ? (
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        sizes="(min-width: 1024px) 17rem, (min-width: 640px) 45vw, 90vw"
                        className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
                      />
                    ) : (
                      // Designed fallback, not a grey "image missing" box: it
                      // is fine to ship as-is if a photo is ever removed.
                      <div
                        aria-hidden
                        className={cn(
                          "absolute inset-0 flex items-center justify-center bg-gradient-to-br",
                          tint.panel
                        )}
                      >
                        {/* Forced LTR so "01" never reorders to "10" inside
                            the surrounding RTL document. */}
                        <span
                          dir="ltr"
                          className={cn(
                            "font-display select-none text-[4.5rem] leading-none tracking-tighter",
                            tint.numeral
                          )}
                        >
                          {number}
                        </span>
                      </div>
                    )}

                    {/* Step number plate, over the lower corner of the photo. */}
                    <span
                      className={cn(
                        "absolute bottom-3 end-3 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[13px] font-semibold shadow-card backdrop-blur-md",
                        tint.icon
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span dir="ltr" className="tabular-nums">
                        {number}
                      </span>
                    </span>
                  </div>

                  {/* Copy */}
                  <div className="flex flex-1 flex-col p-5 sm:p-6 lg:p-5">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className={cn("h-px w-6 shrink-0", tint.rule)}
                      />
                      <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-subtle-foreground">
                        {t("stepLabel")}{" "}
                        <span dir="ltr" className="tabular-nums">
                          {number}
                        </span>
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold leading-snug tracking-tight text-balance text-foreground sm:text-xl lg:text-[1.15rem]">
                      {step.title}
                    </h3>
                    {/* Her line breaks are load-bearing here: the short closing
                        lines ("אני לא רוצה להישאר עם זה לבד יותר.") are written
                        to land on their own, so each stays its own paragraph
                        rather than being reflowed into one block. */}
                    <div className="mt-3 space-y-2">
                      {step.lines.map((line) => (
                        <p
                          key={line}
                          className="text-[13.5px] leading-6 text-muted-foreground sm:text-sm"
                        >
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </ol>

        <Reveal className="mt-14 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-teal/35 bg-teal-soft/60 px-4 py-2 text-sm font-medium text-teal-deep">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {t("endpoint")}
          </span>
        </Reveal>
      </div>
    </section>
  );
}

/* ──────────────────────────  Services teaser (home)  ────────────────────────── */

export function ServicesTeaser() {
  const t = useTranslations("servicesTeaser");
  const tServices = useTranslations("services");
  const services = tServices.raw("items") as ServiceItem[];

  return (
    <section className="bg-background px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="ring-shine relative grid gap-10 overflow-hidden rounded-3xl border border-foreground/[0.08] bg-surface-1 p-7 sm:p-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-brand/15 blur-[100px]"
            />
            <div className="relative">
              <SectionHeading
                eyebrow={t("eyebrow")}
                title={t("title")}
                description={t("description")}
              />
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/#approach"
                  className={cn(
                    buttonVariants({ variant: "brand" }),
                    "h-11 rounded-lg px-5 text-[15px]"
                  )}
                >
                  {t("cta")}
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </div>
            </div>
            <div className="relative grid gap-2.5 sm:grid-cols-2">
              {services.map((service, index) => {
                const Icon = serviceConfig[index]?.icon ?? Sparkles;
                // Cycle the three palette legs across the tiles so this block
                // is not four identical pink squares.
                const tile = [
                  "border-brand/25 bg-brand-wash text-brand-accent",
                  "border-teal/25 bg-teal-soft/60 text-teal-deep",
                  "border-gold/35 bg-gold-soft/70 text-gold-deep",
                  "border-brand/25 bg-brand-wash text-brand-accent",
                ][index % 4];
                return (
                  <Link
                    key={service.title}
                    href="/#approach"
                    className="group flex items-center gap-3 rounded-xl border border-foreground/[0.08] bg-foreground/[0.02] p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/30 hover:bg-foreground/[0.04]"
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-transform duration-300 group-hover:scale-110",
                        tile
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-sm font-medium leading-5 text-foreground-soft transition-colors group-hover:text-foreground">
                      {service.title}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ──────────────────────────  Offers  ────────────────────────── */

type Funnel = {
  heading: string;
  anchorLabel: string;
  anchorPrice: string;
  anchorVat: string;
  anchorTip: string;
  strikeNote: string;
  midLabel: string;
  midPrice: string;
  midTip: string;
  midNote: string;
  freeKicker: string;
  freeHeadline: string;
  freeBody: string;
  scarcity: string;
  cta: string;
};

/** A struck-through price tier in the funnel — the "this is what it usually
 *  costs, but not what you pay" rungs above the free offer. The crossed-out
 *  price is interactive (animated X + explanatory popover) via PriceCrossout. */
function StruckTier({
  label,
  price,
  note,
  tip,
  vat,
}: {
  label: string;
  price: string;
  note: string;
  tip: string;
  vat?: string;
}) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-foreground/[0.08] bg-surface-1/80 px-6 py-5 text-center shadow-card backdrop-blur-sm">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <div className="mt-1.5 flex items-center justify-center gap-2.5">
        {/* The zoom lives on this wrapper, not on the price button itself —
            the button already owns a `transform` for its hover tilt, and two
            transforms on one element silently overwrite each other. */}
        <span className="inline-block price-breathe">
          <PriceCrossout price={price} tip={tip} />
        </span>
        {vat ? (
          <span className="rounded-full border border-foreground/10 bg-foreground/[0.04] px-2 py-0.5 text-[11px] text-subtle-foreground">
            {vat}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm font-medium text-foreground-soft">{note}</p>
    </div>
  );
}

export function OffersSection() {
  const t = useTranslations("offers");
  const f = t.raw("funnel") as Funnel;
  const items = t.raw("items") as OfferItem[];
  const offer = items[offers.findIndex((o) => o.featured)] ?? items[0];

  return (
    <section className="bg-background px-6 pt-10 pb-12 sm:pt-16 sm:pb-14">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow={t("eyebrow")}
            title={t("title")}
            description={t("description")}
          />
        </Reveal>

        <Reveal delay={120}>
          <div className="relative mx-auto mt-12 flex flex-col items-center">
            <p className="mb-6 text-center text-lg font-medium text-foreground">
              {f.heading}
            </p>

            {/* Rung 1 — the real market price, struck through. */}
            <StruckTier
              label={f.anchorLabel}
              price={f.anchorPrice}
              vat={f.anchorVat}
              tip={f.anchorTip}
              note={f.strikeNote}
            />

            <ChevronsDown
              aria-hidden
              className="my-3 h-6 w-6 text-brand-accent/70"
            />

            {/* Rung 2 — the site price, also struck through. */}
            <StruckTier
              label={f.midLabel}
              price={f.midPrice}
              vat={f.anchorVat}
              tip={f.midTip}
              note={f.midNote}
            />

            <ChevronsDown
              aria-hidden
              className="my-3 h-7 w-7 animate-float text-brand-accent"
            />

            {/* Rung 3 — the payoff: free for the first ten. */}
            <div className="ring-shine glow-breathe relative w-full max-w-xl overflow-hidden rounded-3xl border border-brand/45 bg-brand/[0.07] p-7 text-center sm:p-9">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[30rem] -translate-x-1/2 rounded-full bg-brand/25 blur-[90px]"
              />
              <div className="relative">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-deep px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                  {f.freeKicker}
                </span>
                {/* The payoff is the one number on the page that is NOT struck
                    through, so it gets the gold and the same breathing zoom as
                    the prices above it. */}
                <h3 className="mt-5">
                  <span className="font-display price-breathe inline-block text-4xl leading-tight text-gold-deep sm:text-[2.75rem]">
                    {f.freeHeadline}
                  </span>
                </h3>
                <p className="mx-auto mt-4 max-w-md leading-7 text-foreground-soft">
                  {f.freeBody}
                </p>

                <ul className="mx-auto mt-6 grid max-w-md gap-2.5 text-start text-sm text-foreground-soft sm:grid-cols-1">
                  {offer.includes.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-teal-deep" />
                      <span className="leading-6">{item}</span>
                    </li>
                  ))}
                </ul>

                <LeadButton
                  variant="brand"
                  className="mt-8 h-12 rounded-lg px-6 text-base"
                >
                  {f.cta}
                  <ArrowRight data-icon="inline-end" />
                </LeadButton>
                <p className="mt-4 text-sm font-medium text-gold-deep">
                  {f.scarcity}
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-subtle-foreground">
            {t("note")}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ──────────────────────────  Why  ────────────────────────── */

export function WhySection() {
  const t = useTranslations("why");
  const reasons = t.raw("items") as TitledText[];

  return (
    <section className="bg-background px-6 py-14 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <Reveal>
          <SectionHeading
            eyebrow={t("eyebrow")}
            title={t("title")}
            description={t("description")}
          />
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2">
          {reasons.map((reason, i) => (
            <Reveal key={reason.title} delay={i * 80} className="h-full">
              <div className="group h-full cursor-pointer select-none rounded-xl border border-foreground/[0.08] bg-foreground/[0.02] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:bg-foreground/[0.04] hover:shadow-card">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-foreground/12 bg-brand/10 text-brand-accent transition-all duration-300 group-hover:scale-110 group-hover:border-brand/40 group-hover:bg-brand/20">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <p className="mt-4 text-[15px] font-medium text-foreground">
                  {reason.title}
                </p>
                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                  {reason.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────  Founder  ────────────────────────── */

/** Who she is: her photograph, her story, and the two ways to reach her. */
export function FounderTeaser() {
  const t = useTranslations("founder");
  const tFooter = useTranslations("footer");
  const founderName = founderDisplayName();
  const chips = t.raw("chips") as string[];
  const portrait = media.founderTeaser;

  return (
    <section className="bg-background px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="ring-shine relative grid gap-10 overflow-hidden rounded-3xl border border-foreground/[0.08] bg-surface-1 p-7 md:grid-cols-[auto_1fr] md:items-center md:gap-12 md:p-10">
            <div
              aria-hidden
              className="pointer-events-none absolute -start-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-brand/20 blur-[90px]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -end-20 bottom-0 h-56 w-56 rounded-full bg-teal/15 blur-[80px]"
            />

            {/* Portrait card */}
            <div className="relative mx-auto flex w-full max-w-[19rem] flex-col items-center text-center md:mx-0">
              <div className="relative w-full">
                {/* Offset plum and teal frame lines, so the photograph sits
                    inside the palette instead of floating on top of it. */}
                <span
                  aria-hidden
                  className="absolute -inset-3 rounded-[1.75rem] border border-brand/30"
                />
                <span
                  aria-hidden
                  className="absolute -inset-6 rounded-[2.25rem] border border-teal/25"
                />
                {hasMedia(portrait) ? (
                  <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-surface-2 shadow-[0_26px_60px_-26px_rgba(138,31,88,0.55)]">
                    <Image
                      src={portrait.src}
                      alt={portrait.alt}
                      fill
                      sizes="(min-width: 768px) 19rem, 80vw"
                      className="object-cover object-top"
                    />
                  </div>
                ) : (
                  <PortraitFrame
                    slot={portrait}
                    className="relative aspect-[2/3] w-full rounded-2xl"
                    sizes="19rem"
                  />
                )}
              </div>

              <p className="mt-10 text-xl font-semibold tracking-tight text-foreground">
                {founderName}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t("role")}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {chips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-brand/20 bg-brand-wash px-2.5 py-1 text-[11px] font-medium text-brand-accent"
                  >
                    {chip}
                  </span>
                ))}
              </div>
              {siteConfig.profiles.instagram ? (
                <a
                  href={siteConfig.profiles.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground-soft transition-colors hover:text-brand-accent"
                >
                  <InstagramIcon className="h-4 w-4 shrink-0" />
                  <span dir="ltr">@{siteConfig.instagramHandle}</span>
                </a>
              ) : null}
            </div>

            {/* Story */}
            <div className="relative">
              <Eyebrow>{t("eyebrow")}</Eyebrow>
              <h2 className="mt-4 text-3xl text-balance sm:text-4xl">
                {t("title")}
              </h2>
              <p className="mt-5 text-[17px] leading-8 text-foreground-soft">
                {t("body", {
                  brand: siteConfig.name,
                  founder: founderName,
                })}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/about"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "h-10 rounded-lg px-4"
                  )}
                >
                  {t("more", { founder: founderName })}
                  <ArrowUpRight data-icon="inline-end" />
                </Link>
                <WhatsAppLink
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-10 rounded-lg px-4"
                  )}
                >
                  <WhatsAppIcon className="h-4.5 w-4.5 shrink-0 text-[#25d366]" />
                  {tFooter("whatsapp")}
                </WhatsAppLink>
                <a
                  href={`tel:${siteConfig.phoneE164}`}
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-10 rounded-lg px-4"
                  )}
                >
                  <Phone className="h-4 w-4 shrink-0 text-brand-accent" />
                  <span dir="ltr">{siteConfig.phone}</span>
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ──────────────────────────  Final CTA  ────────────────────────── */

export function FinalCta() {
  const t = useTranslations("finalCta");

  return (
    <section className="bg-background px-6 pb-24 pt-4">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-foreground/[0.08] bg-surface-1 px-6 py-16 text-center sm:px-10">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[44rem] -translate-x-1/2 animate-aurora rounded-full bg-[radial-gradient(circle_at_center,rgba(194,74,133,0.5),transparent_60%)] blur-[80px]"
            />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-3xl tracking-tight text-balance sm:text-4xl">
                {t("titleLead")}
                <span className="text-gradient">{t("titleHighlight")}</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                {t("body")}
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <LeadButton
                  variant="brand"
                  className="h-11 rounded-lg px-5 text-[15px]"
                >
                  {t("ctaPrimary")}
                  <ArrowRight data-icon="inline-end" />
                </LeadButton>
                <Link
                  href="/#approach"
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-11 rounded-lg px-5 text-[15px]"
                  )}
                >
                  {t("ctaSecondary")}
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
