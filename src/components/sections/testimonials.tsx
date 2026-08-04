"use client";

import { useTranslations } from "next-intl";
import { Info, Quote } from "lucide-react";

import { GalleryCarousel } from "@/components/sections/project-gallery";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/sections/marketing-sections";
import { testimonialShots } from "@/content/media";
import type { GalleryImage } from "@/content/gallery";
import { testimonialsAreSamples } from "@/content/testimonials";
import { useBucketMedia } from "@/lib/use-bucket-media";
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
 * Nominal dimensions for a screenshot discovered in the bucket at runtime.
 *
 * The listing endpoint returns names and URLs, not pixel sizes, and reading
 * them would mean downloading every image before rendering any of it. The
 * carousel tile does not need them (it is `fill` inside a fixed 2:3 frame);
 * only the lightbox does, and there the image is `object-contain` inside
 * `max-h-[82vh]`, so these values set an aspect ratio and nothing else. 2:3 is
 * the shape of every phone screenshot she has sent.
 */
const BUCKET_SHOT_WIDTH = 1080;
const BUCKET_SHOT_HEIGHT = 1620;

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

  // ── The R2 media system (docs/12 §B D8, docs/06-media-and-cdn.md) ──
  // Reference implementation of `useBucketMedia`: Pnina uploads a new
  // screenshot to the bucket and it appears here within minutes, with no
  // rebuild and no deploy.
  //
  // ⚠️ CONSENT. The Worker lists ONLY objects under
  // `sites/pnina/reviews/published/` — never `draft/`, never the bucket root.
  // That published/ folder is the human review step this section depends on:
  // a screenshot of a private message carries a handle, a display name, a
  // profile photo or a phone number that no automated check can see, and the
  // repo's leak gate cannot look inside a bucket at all. Moving a file into
  // published/ is the act of clearing it. Read docs/04-testimonials-policy.md
  // before doing it; the rules there apply to bucket uploads exactly as they
  // apply to files committed to public/images/.
  //
  // `items: null` covers loading, an undeployed Worker, a missing binding and
  // an empty collection alike — all of which mean "keep what we shipped".
  const bucket = useBucketMedia("reviews");
  const bucketShots: GalleryImage[] | null =
    bucket.items?.map((item) => ({
      src: item.url,
      // Runtime-discovered files carry no per-image alt text — there is nowhere
      // for it to live. The section's own generic label is the honest fallback;
      // a screenshot whose exact wording matters belongs in
      // `testimonialShots` in src/content/media.ts, where it gets real alt text.
      alt: t("shotsLabel"),
      note: `From the media bucket: ${item.name}`,
      width: BUCKET_SHOT_WIDTH,
      height: BUCKET_SHOT_HEIGHT,
    })) ?? null;

  const visibleShots = bucketShots ?? shots;

  if (items.length === 0 && visibleShots.length === 0) return null;

  return (
    <section className="relative bg-background px-6 py-14 sm:py-20">
      {/* ── The halo, and its OWN clipper ──
          The 46rem halo below is wider than a phone viewport, and unclipped it
          gave the whole document 173px of horizontal scroll on a 390px screen.
          So it still has to be clipped — but the clip lives on this
          single-purpose wrapper and NOT on the <section>, and that is
          load-bearing rather than tidiness.

          `overflow: hidden` makes an element a SCROLL CONTAINER, and
          `animation-timeline: view()` — the scroll reveal, globals.css §1 —
          resolves against the nearest scroll container, not against the
          viewport. With the clip on the section, every [data-reveal] inside it
          measured itself against a box that never scrolls, so each card's
          reveal froze at whatever progress that fixed geometry happened to
          give it and no amount of scrolling ever moved it. The first two quote
          cards happened to land past 100% and looked normal; the bottom two
          parked at 0.58 and 0.51 opacity forever, which is what Daniel saw on
          2026-07-30 as "an extra thing on top of them, like a different shade"
          over "את הצלת אותי" and "תודה ששלחת לי. הגיע לי בול בזמן". Nothing was
          on top of them: they were half-faded-in and stuck there.

          Keeping the clip on a wrapper that contains only the halo gives the
          same clip with no scroll container anywhere on a reveal's ancestor
          path. `-z-10` stays on the clipper so the paint order is unchanged
          (`--background` is transparent, so the halo does show through).

          If you ever need to clip the section itself, use `overflow-x: clip` —
          `clip` does not create a scroll container. `hidden` does. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute left-1/2 top-24 h-72 w-[46rem] -translate-x-1/2 rounded-full bg-brand/10 blur-[110px]" />
      </div>
      <div className="mx-auto max-w-6xl">
        {showHeading ? (
          <Reveal className="text-center">
            <SectionHeading
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
        {visibleShots.length > 0 ? (
          <div
            role="group"
            aria-label={t("shotsLabel")}
            className="mx-auto max-w-4xl"
          >
            <GalleryCarousel
              // Remount when the source swaps. The carousel tracks the centred
              // slide by index into a cloned array sized from `images.length`;
              // handing it a different-length list in place leaves that index
              // pointing at the wrong slide until the next auto-advance.
              key={bucketShots ? "bucket" : "static"}
              images={visibleShots}
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
                  <blockquote className="mt-4 flex-1 text-lg leading-relaxed text-foreground">
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

        {/* ⚠️ THE PRIVACY NOTE UNDER THE SHOTS IS GONE (Pnina, 2026-08-04) —
            REMOVED AS A REPETITION, NOT AS A POLICY CHANGE. It read "ההודעות
            מפורסמות באישור, בלי שמות מלאים ובלי פרטים מזהים", and the section's
            own description four blocks above already says the same thing in her
            shorter wording ("מפורסמות באישור ובאנונימיות"). Saying it twice on
            one screen read as anxiety about the material rather than as care.

            ⛔ THE CLAIM ITSELF IS STILL LOAD-BEARING AND STILL ON THE PAGE. If
            `testimonials.description` ever stops carrying it, this note comes
            back — docs/04-testimonials-policy.md requires the page to state the
            consent basis exactly once, not zero times. `privacyNote` is kept in
            `messages/he.json` for that reason.

            The `samplesNotice` branch is untouched: if `testimonialsAreSamples`
            ever flips back to true, that disclaimer still renders. */}
      </div>
    </section>
  );
}
