"use client";

import { useTranslations } from "next-intl";
import { Info, Quote } from "lucide-react";

import { GalleryCarousel } from "@/components/sections/project-gallery";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/sections/marketing-sections";
import { testimonialShots } from "@/content/media";
import type { GalleryImage } from "@/content/gallery";
import { testimonialsAreSamples } from "@/content/testimonials";
import { cn } from "@/lib/utils";

type Testimonial = {
  quote: string;
  author: string;
  role: string;
  result?: string;
};

/**
 * Only shots with real dimensions can be rendered — `next/image` needs them for
 * the lightbox, and a slot with `src: null` is a slot we are still waiting on.
 */
const shots = testimonialShots.filter(
  (shot): shot is GalleryImage =>
    typeof shot.src === "string" && !!shot.width && !!shot.height
);

/**
 * Social proof, screenshots first.
 *
 * This used to be a text-only carousel of typed-out quotes, which is the least
 * credible way to show a testimonial: anyone can type a sentence in quotation
 * marks. The actual messages — in WhatsApp green and Instagram dark, with the
 * timestamps and the reply bubbles still attached — carry the proof. The typed
 * quotes stay underneath as a readable, searchable, screen-reader-friendly
 * layer, because a JPEG of a conversation is not accessible on its own.
 *
 * Either half can be empty: with no screenshots the section is just the quote
 * grid, with no quotes it is just the wall, and with neither it renders nothing.
 */
export function Testimonials({ showHeading = true }: { showHeading?: boolean }) {
  const t = useTranslations("testimonials");
  const items = t.raw("items") as Testimonial[];

  if (items.length === 0 && shots.length === 0) return null;

  return (
    // overflow-hidden is load-bearing, not tidiness: the 46rem halo below is
    // wider than a phone viewport, and without a clip it gave the whole
    // document 173px of horizontal scroll on a 390px screen.
    <section className="relative overflow-hidden bg-background px-6 py-14 sm:py-20">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-24 -z-10 h-72 w-[46rem] -translate-x-1/2 rounded-full bg-brand/10 blur-[110px]"
      />
      <div className="mx-auto max-w-6xl">
        {showHeading ? (
          <Reveal className="text-center">
            <SectionHeading
              eyebrow={t("eyebrow")}
              align="center"
              title={t("title")}
              description={t("description")}
            />
          </Reveal>
        ) : null}

        {testimonialsAreSamples ? (
          <Reveal delay={60}>
            <p
              className={cn(
                "mx-auto flex w-fit items-center gap-2 rounded-full border border-foreground/12 bg-foreground/[0.03] px-4 py-1.5 text-xs text-muted-foreground",
                showHeading ? "mt-8" : "mt-0"
              )}
            >
              <Info className="h-3.5 w-3.5 shrink-0" />
              {t("samplesNotice")}
            </p>
          </Reveal>
        ) : null}

        {/* ── The wall ──
            A centre-mode carousel with arrows and auto-advance, not a static
            grid: there are three screenshots today and there will be more, and
            a grid stops scaling the moment there are six. `contain` so nothing
            is cropped — the sentence at the bottom of a screenshot is usually
            the point of it. */}
        {shots.length > 0 ? (
          <div
            role="group"
            aria-label={t("shotsLabel")}
            className="mx-auto max-w-4xl"
          >
            <GalleryCarousel
              images={shots}
              aspectClass="aspect-[2/3]"
              fit="contain"
              showCaption={false}
              sideScale={0.62}
              intervalMs={4200}
            />
          </div>
        ) : null}

        {/* ── The typed layer ── */}
        {items.length > 0 ? (
          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            {items.map((item, i) => (
              <Reveal key={item.quote} delay={i * 70} className="h-full">
                <figure className="hairline-top relative flex h-full flex-col rounded-2xl border border-foreground/[0.08] bg-surface-1/90 p-6 shadow-card backdrop-blur-sm transition-colors duration-300 hover:border-brand/25 sm:p-7">
                  <Quote
                    aria-hidden
                    className="h-6 w-6 shrink-0 text-gold"
                  />
                  <blockquote className="mt-4 flex-1 text-[17px] leading-8 text-foreground">
                    {item.quote}
                  </blockquote>
                  <figcaption className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-foreground/[0.07] pt-4 text-sm">
                    <span className="font-medium text-brand-accent">
                      {item.author}
                    </span>
                    <span aria-hidden className="text-subtle-foreground">
                      ·
                    </span>
                    <span className="text-muted-foreground">{item.role}</span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        ) : null}

        {!testimonialsAreSamples ? (
          <Reveal>
            <p className="mt-10 text-center text-xs text-subtle-foreground">
              {t("privacyNote")}
            </p>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
