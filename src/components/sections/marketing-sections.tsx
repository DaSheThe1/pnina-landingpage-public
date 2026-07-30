import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  CheckCircle2,
  Phone,
  Sparkles,
  Target,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { ContactForm } from "@/components/sections/contact-form";
import { LeadButton } from "@/components/lead/lead-button";
import { HeroVideo } from "@/components/sections/hero-video";
import { FreeCallAnchor } from "@/components/motion/free-call-anchor";
import { ProcessSpine } from "@/components/motion/process-spine";
import { InstagramIcon } from "@/components/ui/instagram-icon";
import { PortraitFrame } from "@/components/ui/portrait-frame";
import { Price } from "@/components/ui/price";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { hasMedia, media, type ImageSlot } from "@/content/media";
import { Reveal } from "@/components/ui/reveal";
import { audienceTopics } from "@/content/audience";
import { moments as momentConfig } from "@/content/moments";
import { services as serviceConfig } from "@/content/services";
import { processSteps } from "@/content/process";
import { offerTracks } from "@/content/offers";
import { founderDisplayName, siteConfig } from "@/config/site";
import { sectionIds } from "@/config/navigation";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type ServiceItem = { title: string; description: string; details: string[] };
type TrackItem = {
  title: string;
  duration: string;
  price: string;
  fit: string;
  includes: string[];
};
type TitledText = { title: string; text: string };

/**
 * The three palette legs, as a card accent. Shared by the audience grid and the
 * moments list so the two new sections read as one system with the process
 * cards above them (which carry their own richer copy of this in STEP_TINTS).
 */
const CARD_TINTS = {
  plum: "border-brand/25 bg-brand-wash text-brand-accent",
  teal: "border-teal/25 bg-teal-soft/60 text-teal-deep",
  gold: "border-gold/35 bg-gold-soft/70 text-gold-deep",
} as const;

/* ──────────────────────────  Shared  ────────────────────────── */

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
      {children}
    </main>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-surface-2/85 px-3.5 py-1.5 text-sm font-semibold tracking-[0.04em] text-brand-accent shadow-card backdrop-blur-sm">
      {/* A static dot. It used to carry `animate-ping` — a perpetual pulse on
          every section label on every page, which is a "live/urgent" signal
          attached to nothing that is live or urgent. See rule 4 in AGENTS.md:
          nothing on this site throbs. */}
      <span
        aria-hidden
        className="inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent"
      />
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
          "text-[2.4rem] text-balance sm:text-[2.85rem]",
          gradient ? "text-gradient" : "text-foreground"
        )}
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
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
    // ── `overflow-clip`, and NEVER `overflow-hidden` ──
    // The clip is load-bearing: the aurora below is 60rem wide, the two side
    // washes hang 12% off each edge, and the video's own halo (hero-video.tsx,
    // `-inset-x-16`) bleeds 4rem past its frame. Unclipped, this section gives
    // a 390px phone horizontal scroll.
    // The KEYWORD is load-bearing too. `overflow: hidden` makes an element a
    // SCROLL CONTAINER, and `animation-timeline: view()` — the scroll reveal,
    // globals.css §1 — resolves against the nearest scroll container rather
    // than against the viewport. While this said `hidden`, every [data-reveal]
    // in the hero measured itself against a box that never scrolls and froze at
    // whatever progress that fixed geometry happened to give it: on a phone the
    // subtitle, the CTA row and the badge row parked at 0.90, 0.55 and 0.23
    // opacity and no amount of scrolling moved them. `clip` clips to exactly
    // the same box, is NOT a scroll container, and is inside this project's
    // browser baseline (Safari 16 < Tailwind 4's own floor of 16.4).
    // The other way out is a wrapper that clips only the decoration — that is
    // what testimonials.tsx does, and its comment there is the long version.
    // It does not work here, because the bleed that has to be clipped is not
    // only decoration: the video halo lives inside the content.
    <section className="relative overflow-clip">
      {/* Backdrop layers */}
      {/* Low sun overhead, peach on one side, silver-blue on the other — the
          three washes off her reference photograph. The cool blob is the
          counterweight: without it the whole top of the page settles into one
          flat temperature and reads as a beige smear rather than as light. */}
      <div
        aria-hidden
        className="aurora-hero pointer-events-none absolute -top-40 left-1/2 h-[42rem] w-[60rem] -translate-x-1/2 animate-aurora rounded-full blur-[90px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-12%] top-24 h-[28rem] w-[28rem] wash-warm animate-float rounded-full blur-[100px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-12%] top-56 h-[26rem] w-[26rem] wash-cool animate-float rounded-full blur-[100px]"
      />
      {/* There used to be a `from-transparent to-background` fade band here. It
          painted nothing: `--background` IS transparent on this site (every
          section is a window onto the SiteBackground field — see globals.css),
          so the gradient ran transparent → transparent. Removed rather than
          repointed at `--canvas`, which would have laid an opaque cream band
          over the drifting field the hero is supposed to sit in. */}

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
            {/* Two BLOCKS, not two inline runs.
                The headline is two sentences ("אפשר לאהוב את החיים שלך שוב." /
                "דווקא בזכות מה שעברת"), and while they were inline the browser
                chose the break itself. In RTL it kept choosing badly: the line
                filled up just before the full stop, so the sentence broke after
                "שוב" and line two opened with a lonely "." — the punctuation of
                one sentence sitting at the head of the next. Making each
                sentence its own block means the break is ours, it is the same
                on a phone and on a desktop, and no neutral character can drift
                across it. Nothing else is allowed back on this line. */}
            <h1 className="mt-5 text-[2.85rem] leading-[1.06] text-balance sm:text-[3.75rem]">
              <span className="block">{t("titleLead")}</span>
              {/* PINK, not bronze, and it is the same pink as the filled CTA:
                  `--headline-accent` resolves through `--rose-deep` (globals.css
                  `:root`). Daniel, 2026-07-30 — the accent he asked for has to
                  be visible in the buttons AND on this line. Do not put
                  `text-brand-accent` back here. */}
              <em className="mt-1 block font-display not-italic text-headline-accent">
                {t("titleHighlight")}
              </em>
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
            <p className="mt-8 text-center text-lg leading-relaxed text-foreground lg:mt-6 lg:text-start">
              {t("subtitle")}
            </p>
          </Reveal>

          <Reveal delay={120}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <LeadButton
                variant="brand"
                className="h-11 rounded-lg px-5"
              >
                {t("ctaPrimary")}
                <ArrowRight data-icon="inline-end" />
              </LeadButton>
              {/* Labelled "איך הליווי עובד", so it goes to the process
                  section. It pointed at #testimonials for the whole of the
                  first release — a woman who clicked "how does this work"
                  landed on other women's messages instead of the four steps. */}
              <Link
                href={`/#${sectionIds.process}`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-11 rounded-lg px-5"
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
 * frame line, number plate, rule and fallback panel, so the four rows walk the
 * palette instead of repeating one hue four times.
 *
 * The KEY NAMES are historical (`plum`, `teal`) and no longer describe the
 * colour: since v0.8.0 `plum` resolves to the natural brown, and since 0.12.0
 * `teal` resolves to the dusty ROSE, because these are token references and only
 * the tokens changed. They are left alone deliberately — the same three strings
 * are a union type in `src/content/process.ts`, and renaming them for a hue
 * change is churn with a merge conflict attached. Read the value, not the key.
 *
 * ── WHY THE COOL STEP WENT WARM (Daniel, 2026-07-30) ──
 * "Review the colours used, mostly for the text and the backgrounds of the stuff
 * around the text; I don't think they are complementary."
 *
 * Step 02 was the site's silver-blue: a pale blue-grey panel with a blue-grey
 * 80px numeral, sitting third in a row of four warm cream cards, on a page whose
 * light is now a dusty rose. Measured in OkLCh the ink and its surface were 132°
 * apart in hue — the single widest gap on the site — and it looked it: one card
 * in that row read grey and dead while the other three glowed.
 *
 * The header of globals.css licenses the silver-blue as "the ONE cool note, used
 * at low alpha, and it stays out of the way". A 1.5rem reassurance chip with a
 * tick in it does stay out of the way, and those are untouched. A full card panel
 * plus an 80px numeral does not. So this step now walks the rose instead, which
 * also puts the site's new accent into its largest section rather than leaving it
 * to the buttons.
 *
 * The gold step's numeral moved too, for the same reason in the other direction:
 * `--gold` at 45% on cream composites to a pale LEMON (OkLCh hue 89°, i.e. into
 * the yellow-greens) — the exact "I think it's gold but what I see is green"
 * Daniel called out in 0.11.3, reappearing at watermark scale. `--gold-deep` at
 * 30% is a warm antique sand and stays in the family the rest of the page is in.
 */
const STEP_TINTS = {
  plum: {
    panel: "from-brand-wash via-surface-2 to-brand-soft/70",
    numeral: "text-brand/30",
    icon: "border-brand/30 bg-surface-1/85 text-brand-accent",
    rule: "bg-brand/45",
  },
  teal: {
    panel: "from-rose-soft/80 via-surface-1 to-rose-soft",
    numeral: "text-rose/40",
    icon: "border-rose/35 bg-surface-1/85 text-rose-ink",
    rule: "bg-rose-line/50",
  },
  gold: {
    panel: "from-gold-soft/80 via-surface-1 to-gold-soft",
    numeral: "text-gold-deep/30",
    icon: "border-gold/40 bg-surface-1/85 text-gold-deep",
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
    // `process-spine-scope` declares the NAMED view-progress timeline the spine
    // draws itself on, and it belongs on THIS element because the progress the
    // hairline should track is the SECTION's — a bare `view()` on the line
    // would measure the 2px-wide overlay it lives in. Keep the class on an
    // ancestor of <ProcessSpine> or the name goes out of scope and the line
    // stops drawing. See globals.css §2.
    //
    // `overflow-clip`, NOT `overflow-hidden`: the 24rem × 48rem wash below is
    // wider than a phone and still has to be clipped, but `hidden` would make
    // this a SCROLL CONTAINER and freeze every [data-reveal] inside it against
    // a box that never scrolls (globals.css §1). It did: the fourth step card
    // and the trust row under the grid sat at 0.54 and 0.11 opacity forever.
    // `clip` clips the same box without being a scroll container. The SPINE is
    // indifferent to both — a named `view-timeline-name` measures its own
    // element against the page scroller, never against a clip on itself.
    <section className="process-spine-scope relative overflow-clip bg-background px-6 pt-8 pb-14 sm:pt-10 sm:pb-20">
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

        {/* The wrapper exists only to give the decorative spine something to be
            positioned against; the steps markup below is untouched. */}
        <div className="relative">
          <ProcessSpine steps={steps.length} />
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
                  {/* `border-border`, not the `border-foreground/[0.08]` this
                      card used to carry. That literal is an alpha of the INK,
                      and after dark the ink is near-white on a near-black
                      canvas: 8% of it measured 1.22:1 against the card, an
                      outline you have to hunt for on a phone at night. The
                      token is scheme-aware (12% of the brown on paper, 22% of
                      the cream after dark, both measured at the head of the
                      dark block in globals.css) and is the value this site is
                      supposed to draw a card edge with. */}
                  <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-surface-1/80 shadow-card backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_28px_60px_-32px_var(--shadow-strong)]">
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
                              "font-display select-none text-[5rem] leading-none",
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
                          "absolute bottom-3 end-3 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-semibold shadow-card backdrop-blur-md",
                          tint.icon
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span dir="ltr">
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
                        {/* `uppercase` used to sit on this class list. Hebrew
                            has no case, so it did nothing to "שלב" and only
                            ever shouted at the Latin digits; the 0.18em
                            tracking that came with it pulled the two Hebrew
                            letters apart into ש ל ב. Both gone — a small label
                            is made small by size and colour, not by spacing
                            letters a script does not letterspace. */}
                        <span className="text-sm font-semibold tracking-[0.06em] text-subtle-foreground">
                          {t("stepLabel")}{" "}
                          <span dir="ltr">
                            {number}
                          </span>
                        </span>
                      </div>
                      {/* No `lg:` step any more: with the 0.14 scale `text-xl`
                          is already 27px from 640px up, so the arbitrary rem
                          this used to carry had become a SHRINK at the widest
                          breakpoint rather than a step up. */}
                      <h3 className="mt-3 text-lg font-semibold leading-snug tracking-tight text-balance text-foreground sm:text-xl">
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
                            className="text-sm leading-[1.75] text-muted-foreground"
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
        </div>

        {/* The closing line of the process, and the last thing read before the
            offer below it.

            It used to be a teal pill with a green tick in it, which is the
            visual language of a confirmation button — "step complete, proceed
            to purchase" — sitting on the path between the four steps and the
            prices. Wrong register entirely. It is now what it actually is: one
            sentence, centred, between two gold hairlines. No chip, no icon,
            nothing to click. */}
        <Reveal className="mt-14 flex items-center justify-center gap-4 sm:gap-5">
          <span aria-hidden className="h-px w-10 bg-gold/30 sm:w-16" />
          <p className="text-center text-base font-medium tracking-[0.01em] text-foreground-soft">
            {t("endpoint")}
          </p>
          <span aria-hidden className="h-px w-10 bg-gold/30 sm:w-16" />
        </Reveal>
      </div>
    </section>
  );
}

/* ──────────────────────────  Services teaser  ────────────────────────── */

/**
 * ⚠️ CURRENTLY UNMOUNTED — nothing renders this.
 *
 * "הליווי נבנה סביבך, לא סביב תבנית" sat between the audience grid and the
 * process section until 2026-07-29, when Daniel took it off the home page: it
 * made the same argument the audience section immediately above it had just
 * made ("אין רשימת תנאים… אלה הדברים שנשים מגיעות איתם אליי"), in weaker words
 * and inside a busier frame. Two blocks saying one thing is one block too many
 * on a page whose job is a single phone number.
 *
 * Kept rather than deleted — the same call as `QuoteReveal` — because the copy
 * is real and /about has no "what the accompaniment actually is" block yet. If
 * it is still unmounted at the end of this redesign round, delete it together
 * with the `servicesTeaser` message block and its `client-messages.ts` entry.
 * Its two internal links point at `/#process`, because the `#approach` anchor
 * retired with the section.
 */
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
                  href="/#process"
                  className={cn(
                    buttonVariants({ variant: "brand" }),
                    "h-11 rounded-lg px-5"
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
                    href="/#process"
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
                    <span className="text-sm font-medium leading-tight text-foreground-soft transition-colors group-hover:text-foreground">
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

type IntroCall = {
  label: string;
  title: string;
  free: string;
  valueLabel: string;
  valuePrice: string;
  body: string;
  includes: string[];
  cta: string;
};

/* ── The three node shapes ──
   Purely decorative and `aria-hidden`: the section's meaning is carried by the
   headings, the labels and the prices. The geometry lives in `.offer-node` in
   globals.css.

   They used to be beads threaded onto a vertical spine. The spine is gone (see
   the header of `OffersSection`), so they are now small icons that sit beside
   each block's label — the same three shapes, telling the same story
   (shell → circle → pearl), just no longer strung on a line. */

/** The free call — an open shell: a hairline gold ring with a gap at the top.
 *  Open, hollow and symmetric about the vertical, so it points nowhere. A
 *  chevron or an arrow here would be a direction, and this section is not
 *  pushing. */
function ShellNode({ size, strokeWidth = 1.6 }: NodeSizeProps = {}) {
  return (
    <span
      aria-hidden
      className="offer-node offer-node--shell"
      style={size ? ({ "--node-size": size } as CSSProperties) : undefined}
    >
      <svg viewBox="0 0 24 24" className="absolute inset-0 h-full w-full">
        <path
          d="M8,5.07 A8,8 0 1 0 16,5.07"
          fill="none"
          stroke="var(--gold)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/** Both node shapes scale off one custom property, so the same three drawings
 *  serve as a 16px label icon and as a 72px figure in an empty image slot. */
type NodeSizeProps = { size?: string; strokeWidth?: number };

/** מסלול צדפה — an empty circle, same hairline. */
function HollowNode({ size }: NodeSizeProps = {}) {
  return (
    <span
      aria-hidden
      className="offer-node border border-gold/70"
      style={size ? ({ "--node-size": size } as CSSProperties) : undefined}
    />
  );
}

/** מסלול פנינה — the pearl, and the only filled shape in the section. Static by
 *  design: see the note on `.pearl-sphere` in globals.css. `.pearl-sphere` draws
 *  the object (the cursor pearl in §3 wears the same class); `.offer-node--pearl`
 *  only sets this instance's size. */
function PearlNode({ size }: NodeSizeProps = {}) {
  return (
    <span
      aria-hidden
      className="offer-node offer-node--pearl pearl-sphere"
      style={size ? ({ "--node-size": size } as CSSProperties) : undefined}
    />
  );
}

/**
 * The picture in a track card: a closed shell for צדפה, a pearl for פנינה — the
 * section's title, "מהצדפה אל הפנינה", as two pictures.
 *
 * ── IT IS A SIDE PANEL NOW, NOT A THUMBNAIL (Daniel, 2026-07-30) ──
 * "right-side image, left-side text, with price and everything — currently it's
 * ugly." It was an 11rem square parked above the copy, which on a wide card left
 * a stranded little tile with a lot of empty beside it. From `sm` up it is a
 * FULL-HEIGHT column down one side of the card at ~38% of its width, so the card
 * reads as one object: picture, then a rule of light, then the words.
 *
 * `h-full` + `object-cover` rather than a fixed aspect ratio: the height is
 * whatever the copy column turns out to be, which is what makes the two cards in
 * the row match each other however their text wraps. On a phone it goes back on
 * top as a wide 16:9 band — a side panel in a 342px column would leave neither
 * half enough room.
 *
 * Both slots are `src: null` until Daniel's generated images land (see the note
 * on `trackShell` / `trackPearl` in src/content/media.ts). While they are empty
 * this draws the same track's node motif on a soft wash: a finished, calm panel
 * that is fine to ship, not a grey "image missing" box and not a stock
 * photograph. When a file arrives nothing here changes — the slot's `src` stops
 * being null and the photograph takes the frame.
 */
function TrackFigure({
  slot,
  node,
}: {
  slot: ImageSlot;
  node: "hollow" | "pearl";
}) {
  return (
    // It BLEEDS to the card's edge — no border and no radius of its own, the
    // card's `overflow-hidden` does the rounding. A picture inset inside a
    // padded card with its own second border is the "ugly" Daniel was pointing
    // at; a picture that is one wall of the card is the premium version.
    // `self-stretch` is what gives `fill` a height on the wide layout: the row's
    // height comes from the copy column, and the image takes all of it.
    <div className="relative h-44 w-full shrink-0 overflow-hidden bg-surface-2/50 sm:h-auto sm:w-[38%] sm:self-stretch">
      {hasMedia(slot) ? (
        <Image
          src={slot.src}
          alt={slot.alt}
          fill
          sizes="(min-width: 640px) 38vw, 100vw"
          className="object-cover"
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gold-soft/60 via-surface-1 to-brand-wash"
        >
          {node === "pearl" ? (
            <PearlNode size="5.5rem" />
          ) : (
            <HollowNode size="5.5rem" />
          )}
        </div>
      )}
    </div>
  );
}

/** A block's small letterspaced label — "הצעד הראשון", or a track's duration —
 *  set on the same line as that block's node.
 *
 *  The ink is `--accent-ink`, an accent ROLE (globals.css `:root`) and NOT gold.
 *  Read that note before changing it: these labels sit on the accent's own wash,
 *  and amber letters on rose light are the muddy pair Daniel flagged on
 *  2026-07-30. The bright gold on this line is the NODE, which is exactly what
 *  the palette rule in the header of globals.css asks for. */
function NodeLabel({
  node,
  children,
}: {
  node: ReactNode;
  children: string;
}) {
  return (
    <p className="flex items-center gap-2.5 text-sm font-semibold tracking-[0.05em] text-accent-ink">
      {node}
      {children}
    </p>
  );
}

/** What a block includes. Hairline dots rather than tick icons — a column of
 *  green checkmarks turns a plain fact into a sales point. */
function OfferIncludes({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "space-y-2 text-sm leading-[1.75] text-muted-foreground",
        className
      )}
    >
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span
            aria-hidden
            className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-gold/70"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * "מהצדפה אל הפנינה" — the free call, and the two tracks it might lead to.
 *
 * WHAT THIS USED TO BE, so nobody rebuilds it: a three-tier funnel that struck
 * through ₪1,000 and then ₪500 on the way down to "free", with an animated
 * crossing-out, `?` popovers, a breathing price and a glowing card at the
 * bottom. Phase 1 deleted the invented numbers — neither came from Pnina, and
 * presenting a made-up price as the thing she is generously discounting is a
 * lie told to a woman who has been lied to enough. Phase 3 deleted the FORM
 * they were told in, which was doing the same work more quietly: struck
 * anchors, per-tier shadow cards and a halo around the free option are how a
 * page says "look how much you are getting" at someone.
 *
 * ── THE SHAPE, AND WHY IT CHANGED AGAIN (2026-07-29, Daniel) ──
 * Phase 3 built this as ONE vertical ladder: a gold hairline spine with the
 * free call and both tracks as three rungs of the same thing. On a desktop that
 * read as three full-width stacked bands you had to scroll through, and it made
 * the free call look like the first item in a price list.
 *
 * It is not. The free call is the thing we are giving away and the ONLY thing
 * this section asks for; the two tracks are what gets discussed ON that call.
 * So the section is now two blocks, not three siblings:
 *
 *   1. the free call — a panel of its own, the section's only button, its own
 *      column for "ללא עלות" + the value line + the CTA;
 *   2. under it, behind its own small label ("המסלולים שנדבר עליהם בשיחה"), the
 *      two tracks as two EQUAL columns standing side by side on lg and up, so a
 *      reader sees both at once and compares them in place. They stack on a
 *      phone, in her order (צדפה then פנינה).
 *
 * The typographic order IS still the argument, and it is deliberately
 * upside-down versus a pricing page: the section title is the largest thing,
 * then the block names, then "ללא עלות", and the prices are small muted facts.
 * A price set large is a price being sold; a price set small is a price being
 * disclosed. Do not "balance" the layout by growing the numbers.
 *
 * Still: no badge, no `featured` flag, no winner, no glow, no strikethrough,
 * exactly one button. Her framing is that the two tracks are the same thing at
 * two lengths, so the only thing that differs between the two columns is which
 * node sits beside its label. See D10 in docs/12-redesign-plan.md.
 *
 * TODO(client): the two "מתאים לך אם…" lines (`offers.items[].fit`), the free
 * call's `intro.body` and the tracks label `tracksEyebrow` are the sentences
 * here that are not hers. They state length and next step and nothing more, on
 * purpose — but they still need her yes.
 */
export function OffersSection() {
  const t = useTranslations("offers");
  const intro = t.raw("intro") as IntroCall;
  const tracks = t.raw("items") as TrackItem[];

  return (
    <section className="bg-background px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow={t("eyebrow")}
            title={t("title")}
            description={t("description")}
          />
        </Reveal>

        {/* ── The free introductory call ──
            The one panel in the section, the one button, and the ONE place on
            this site allowed to raise its voice (Daniel, 2026-07-29): a warm
            gold wash, a gold edge, a warm halo, and the section's largest words
            after its own h2. That licence is local and it is about JOY, not
            pressure — it is still not a "best value" card. Nothing here throbs,
            counts down, claims scarcity or strikes a price through; everything
            loud about it happens ONCE, as it arrives. See the header of
            `FreeCallAnchor` for where exactly the line is drawn. */}
        <Reveal delay={80}>
          <div className="offer-free-panel relative mt-10 overflow-hidden rounded-3xl border border-gold/45 bg-surface-1/90 p-7 backdrop-blur-sm sm:mt-12 sm:p-9 lg:grid lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-center lg:gap-12">
            <div
              aria-hidden
              className="pointer-events-none absolute -start-16 -top-20 h-56 w-56 rounded-full bg-gold/15 blur-[90px]"
            />

            <div className="relative">
              <NodeLabel node={<ShellNode />}>{intro.label}</NodeLabel>
              <h3 className="font-display mt-2 text-[2rem] leading-tight text-foreground sm:text-[2.45rem]">
                {intro.title}
              </h3>
              <p className="mt-3 max-w-lg text-base leading-relaxed text-foreground-soft">
                {intro.body}
              </p>
              <OfferIncludes items={intro.includes} className="mt-4" />
            </div>

            {/* The price / action column. On lg it sits at the inline END with
                a hairline between it and the copy; below that it is simply the
                next block down, separated by the same hairline drawn on top. */}
            <div className="relative mt-7 border-t border-gold/25 pt-6 lg:mt-0 lg:border-s lg:border-t-0 lg:ps-12 lg:pt-0">
              {/* The value anchor: what the call is worth, then a hairline
                  leading to what it costs. Said ONCE, in that order, and never
                  as a struck-through number — read the header of
                  `FreeCallAnchor` before changing anything about it. */}
              <FreeCallAnchor
                valueLabel={intro.valueLabel}
                valuePrice={intro.valuePrice}
                free={intro.free}
              >
                {/* The button is the sequence's last beat, which is why it is
                    passed IN rather than rendered after. `.cta-hot` layers a
                    warm gradient and a gold edge over the `brand` variant; the
                    focus ring, the disabled state and the hover sheen still
                    come from the variant. */}
                <LeadButton
                  source="landing"
                  variant="brand"
                  className="cta-hot h-14 w-full rounded-2xl px-6 text-[1.4rem] tracking-[0.01em] [&_svg]:size-5"
                >
                  {intro.cta}
                  <ArrowRight data-icon="inline-end" />
                </LeadButton>
              </FreeCallAnchor>
            </div>
          </div>
        </Reveal>

        {/* ── The two tracks ──
            Deliberately BELOW the call and behind their own label, so they read
            as "what we would talk about" rather than as two more things being
            sold. Two equal columns on lg; both end in a full stop, because
            nothing here should ask a woman to buy a three-month process before
            she has spoken to anyone. */}
        <Reveal delay={120}>
          <div className="mt-12 flex items-center gap-4 sm:mt-14">
            <span aria-hidden className="h-px flex-1 bg-gold/25" />
            {/* `text-base`, not the `text-sm` the rest of the eyebrows wear:
                Daniel named THIS string ("המסלולים שנדבר עליהם בשיחה") as his
                example of type that is too small on a 27-inch monitor. It was
                pinned at 14px and never moved with the scale at all. */}
            <p className="text-center text-base font-semibold tracking-[0.04em] text-foreground-soft">
              {t("tracksEyebrow")}
            </p>
            <span aria-hidden className="h-px flex-1 bg-gold/25" />
          </div>
        </Reveal>

        {/* ── The two track cards ──
            PICTURE ON THE VISUAL RIGHT, WORDS ON THE VISUAL LEFT (Daniel,
            2026-07-30: "right-side image, left-side text, with price and
            everything — currently it's ugly").

            The figure is FIRST in the DOM, and in this RTL document `flex-row`
            therefore puts it at the inline start, which is the RIGHT of the
            card. That is the layout Daniel described, and it is also the correct
            reading order: the picture is what the card is, the words are what it
            costs and contains. `ltr:sm:flex-row-reverse` pins it to the right in
            physical terms too, so an `en` locale later would not silently mirror
            a composition that was chosen visually.

            WHY THEY STACK INSTEAD OF SITTING IN TWO COLUMNS. Up to 0.11.4 these
            were two equal columns on lg (see the section note above). A card
            that is 38% picture and 62% words does not fit in half of a 1024px
            container — the copy column lands at ~19 characters a line, which is
            a newspaper column, not a premium card. So from `sm` up each card is
            a full-width horizontal band and the two stack. You still see both
            without scrolling; they are still equal, still in her order (צדפה
            then פנינה), still with no badge, no glow and no winner.

            The prices stay SMALL and muted on purpose — rule 4 in CLAUDE.md. The
            wide layout makes room for them, which is not permission to grow
            them: a price set large is a price being sold. */}
        <ol className="mt-7 space-y-5 sm:mt-8 sm:space-y-6">
          {tracks.map((track, index) => (
            <Reveal key={track.title} as="li" delay={160 + index * 80}>
              <div className="flex flex-col overflow-hidden rounded-2xl border border-foreground/[0.08] bg-surface-1/60 sm:flex-row ltr:sm:flex-row-reverse">
                <TrackFigure
                  slot={
                    offerTracks[index]?.node === "pearl"
                      ? media.trackPearl
                      : media.trackShell
                  }
                  node={offerTracks[index]?.node ?? "hollow"}
                />
                <div className="flex-1 p-6 sm:p-8 lg:p-9">
                  <NodeLabel
                    node={
                      offerTracks[index]?.node === "pearl" ? (
                        <PearlNode />
                      ) : (
                        <HollowNode />
                      )
                    }
                  >
                    {track.duration}
                  </NodeLabel>
                  {/* Name and price on one baseline: the price is a fact ABOUT
                      the name, not a headline of its own, and putting it on the
                      same line is what keeps it from reading as a price tag.
                      `flex-wrap` because "מסלול הפנינה" + "₪2,880" does not fit
                      one line on a phone. */}
                  <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <h3 className="font-display text-[2rem] leading-tight text-foreground sm:text-[2.2rem]">
                      {track.title}
                    </h3>
                    <p className="text-base text-muted-foreground">
                      <Price>{track.price}</Price>
                    </p>
                  </div>
                  <p className="mt-3.5 max-w-xl text-base leading-relaxed text-foreground-soft">
                    {track.fit}
                  </p>
                  {/* Two short items each, so on the wide card they sit side by
                      side rather than as a two-item column with a lot of nothing
                      beside it. `sm:space-y-0` is what releases the stacked
                      rhythm the vertical version needs. */}
                  <OfferIncludes
                    items={track.includes}
                    className="mt-4 sm:flex sm:flex-wrap sm:gap-x-9 sm:gap-y-2 sm:space-y-0"
                  />
                </div>
              </div>
            </Reveal>
          ))}
        </ol>

        <Reveal>
          <p className="mt-9 text-center text-base leading-relaxed text-balance text-subtle-foreground">
            {t("note")}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ──────────────────────────  Audience  ────────────────────────── */

/**
 * "למי הליווי מתאים" — the eight subjects women come to her with, in her own
 * list and her own order (structure in src/content/audience.ts).
 *
 * The section is written as recognition, not as segmentation: a woman should
 * find herself in one of these tiles, and the closing line widens rather than
 * narrows ("המסרים מתאימים לכל אישה, כולל נשים מהקהל הדתי והחרדי"). No tile
 * promises an outcome — each says what we work on, which is the only thing
 * anyone can honestly say up front.
 */
export function AudienceSection() {
  const t = useTranslations("audience");
  const items = t.raw("items") as TitledText[];

  return (
    <section className="bg-background px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow={t("eyebrow")}
            title={t("title")}
            description={t("description")}
          />
        </Reveal>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">
          {items.map((item, index) => {
            const config = audienceTopics[index];
            const Icon = config?.icon ?? Sparkles;
            return (
              <Reveal
                key={item.title}
                as="li"
                delay={(index % 4) * 80}
                className="h-full"
              >
                <div className="h-full rounded-2xl border border-foreground/[0.08] bg-surface-1/70 p-5 shadow-card backdrop-blur-sm">
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl border",
                      CARD_TINTS[config?.tint ?? "plum"]
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold leading-snug text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-normal text-muted-foreground">
                    {item.text}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </ul>

        <Reveal className="mt-8 flex justify-center">
          <p className="max-w-xl text-center text-sm leading-normal text-foreground-soft">
            {t("closing")}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ──────────────────────────  Moments  ────────────────────────── */

/**
 * "מה הופך לאפשרי בתהליך הליווי" — five things Pnina has watched happen,
 * written so that none of them belongs to an identifiable person. The reasoning
 * is in the header of src/content/moments.ts and it is not optional.
 *
 * This sits where the stats strip used to. Every stat there was a placeholder
 * zero and the strip hid itself, so the slot rendered nothing at all; these
 * five lines do the job a numbers row was there to do, without making a single
 * claim about how many women or how long. The strip itself was deleted in
 * v0.9.0 — see AGENTS.md rule 3.
 */
export function MomentsSection() {
  const t = useTranslations("moments");
  const items = t.raw("items") as string[];

  return (
    <section className="border-y border-foreground/[0.06] bg-background px-6 py-14 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow={t("eyebrow")}
            title={t("title")}
            description={t("description")}
          />
        </Reveal>

        <ul className="mt-10 grid gap-3.5 sm:mt-12">
          {items.map((item, index) => {
            const config = momentConfig[index];
            const Icon = config?.icon ?? Sparkles;
            return (
              <Reveal
                key={item}
                as="li"
                delay={Math.min(index, 4) * 70}
                className="h-full"
              >
                <div className="flex h-full items-start gap-4 rounded-2xl border border-foreground/[0.08] bg-surface-1/70 p-5 shadow-card backdrop-blur-sm sm:p-6">
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                      CARD_TINTS[config?.tint ?? "plum"]
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="text-base leading-relaxed text-foreground-soft">
                    {item}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </ul>

        <Reveal className="mt-8 flex justify-center">
          <p className="text-center text-sm text-subtle-foreground">
            {t("closing")}
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
              {/* SOLID `surface-1`, not the old `bg-foreground/[0.02]` tint
                  (2026-07-30). That 2% wash was designed to sit on flat cream,
                  where it read as a faint card; on the full-strength sand
                  photograph it reads as nothing at all — the sand shows straight
                  through and the four promises turn muddy. Daniel: *"the square
                  should be white to give a good contrast."*
                  `surface-1` is the right token in BOTH schemes: it is literally
                  white on paper and the documented card surface (#27201a) on
                  dark, so this stays a lifted card rather than becoming a glaring
                  white slab in a dark room.
                  The hover no longer tints the fill — an opaque card has nowhere
                  to go — so the lift, the brand border and the shadow carry it. */}
              <div className="group h-full cursor-pointer select-none rounded-xl border border-foreground/[0.08] bg-surface-1 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-card">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-foreground/12 bg-brand/10 text-brand-accent transition-all duration-300 group-hover:scale-110 group-hover:border-brand/40 group-hover:bg-brand/20">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <p className="mt-4 text-base font-medium text-foreground">
                  {reason.title}
                </p>
                <p className="mt-1.5 text-sm leading-normal text-muted-foreground">
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
            {/* One temperature, two corners. This used to be a plum wash in
                one corner and a mint one in the other, which split the card
                down the middle into a warm half and a cold half. Both washes
                are warm now — gold above, brown below — and the card reads as
                one lit surface. */}
            <div
              aria-hidden
              className="pointer-events-none absolute -start-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-gold/20 blur-[90px]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -end-20 bottom-0 h-56 w-56 rounded-full bg-brand/15 blur-[80px]"
            />

            {/* Portrait card */}
            <div className="relative mx-auto flex w-full max-w-[19rem] flex-col items-center text-center md:mx-0">
              <div className="relative w-full">
                {/* Two offset frame lines — brown inside, gold outside — so
                    the photograph sits inside the palette instead of floating
                    on top of it. */}
                <span
                  aria-hidden
                  className="absolute -inset-3 rounded-[1.75rem] border border-brand/30"
                />
                <span
                  aria-hidden
                  className="absolute -inset-6 rounded-[2.25rem] border border-gold/35"
                />
                {hasMedia(portrait) ? (
                  <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-surface-2 shadow-[0_26px_60px_-26px_rgba(107,79,58,0.55)]">
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
              <p className="mt-1 text-sm leading-normal text-muted-foreground">
                {t("role")}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {chips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-brand/20 bg-brand-wash px-2.5 py-1 text-sm font-medium text-brand-accent"
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
              <h2 className="mt-4 text-[2.4rem] text-balance sm:text-[2.85rem]">
                {t("title")}
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-foreground-soft">
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
                  {/* ARROW-RIGHT, not arrow-up-right. `data-icon="inline-end"`
                      mirrors the glyph under RTL (globals.css, the RTL block),
                      which turns a → into the ← this page reads toward — right.
                      It turns a ↗ into a ↖, i.e. the universal "opens somewhere
                      else" mark, pointing BACKWARDS. Every other button-shaped
                      CTA on the site uses this arrow; this one was the odd one
                      out, and it is an internal link to /about anyway. */}
                  <ArrowRight data-icon="inline-end" />
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

/**
 * The last block on the page, and the actual ask.
 *
 * The form is rendered INLINE here rather than behind a button. Every other CTA
 * on the site opens the LeadDialog, which is right for a CTA someone meets
 * mid-scroll — but at the bottom of the page the reader has already decided,
 * and asking her to press one more thing before she can see two input boxes is
 * a step that only ever loses people. The dialog stays for everything else.
 */
export function FinalCta() {
  const t = useTranslations("finalCta");

  return (
    <section className="bg-background px-6 pb-24 pt-4">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          {/* NO PANEL HERE, DELIBERATELY (2026-07-30, launch night).
              This used to be a `bg-surface-1` card — pure white, full-width,
              rounded, bordered — with the form card sitting on it in cream. Two
              stacked surfaces for one ask. Daniel, reviewing on the sand: *"I
              don't see the reason why we need a bit larger white square."* He is
              right; the outer one was doing nothing the inner one wasn't.
              So the heading and the WhatsApp line now sit straight on the sand
              like every other section's heading does, and the form card below is
              the section's ONE surface. Do not re-wrap this in a panel. */}
          {/* The gold aurora wash that used to sit here went with the panel. It
              was a light source FOR the white card — and with the card gone it
              had nothing to warm, no `overflow-hidden` left to clip it, and at
              `w-[44rem]` it would have pushed a horizontal scrollbar onto every
              390px phone. The sand is the warmth now. */}
          <div className="relative px-6 py-14 sm:px-10 sm:py-16">
            <div className="relative">
              <div className="text-center">
                <h2 className="mx-auto max-w-2xl text-[2.4rem] text-balance sm:text-[2.85rem]">
                  {t("titleLead")}
                  <span className="text-gradient">{t("titleHighlight")}</span>
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                  {t("body")}
                </p>
              </div>

              {/* SOLID, not `surface-2/80`. The 80% was tuned against the white
                  panel that used to be behind it — the sand it now sits on is
                  darker and far busier, and 20% of a photograph coming through
                  the surface a woman types her phone number on is both a
                  contrast problem and a visual one. Same colour, no transparency,
                  no backdrop blur (nothing left to blur). */}
              <div className="mx-auto mt-9 w-full max-w-md rounded-2xl border border-foreground/[0.08] bg-surface-2 p-6 shadow-card sm:p-7">
                <ContactForm source="landing" />
              </div>

              {/* Kept from the old two-button block: writing is easier than
                  talking for some people, and this is the one place on the page
                  where that alternative belongs. It opens WhatsApp with the
                  shared opening line pre-filled. */}
              <div className="mt-8 flex flex-col items-center gap-2.5">
                <p className="text-sm text-subtle-foreground">
                  {t("orWhatsapp")}
                </p>
                <WhatsAppLink
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-11 rounded-lg px-5"
                  )}
                >
                  <WhatsAppIcon className="h-4.5 w-4.5 shrink-0 text-[#25d366]" />
                  {t("ctaSecondary")}
                </WhatsAppLink>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
