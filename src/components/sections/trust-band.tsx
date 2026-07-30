import { Quote } from "lucide-react";
import { useTranslations } from "next-intl";

import { Reveal } from "@/components/ui/reveal";
import { founderDisplayName } from "@/config/site";

export function TrustBand() {
  const t = useTranslations("trustBand");
  const principles = t.raw("principles") as string[];

  return (
    <section className="bg-background px-6 py-14 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-foreground/[0.08] bg-surface-1 px-6 py-14 text-center sm:px-12">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[36rem] -translate-x-1/2 rounded-full bg-brand/15 blur-[100px]"
            />
            {/* Warm above, warm below. The mint wash that used to sit in this
                corner made the quote card read as two surfaces glued together. */}
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-20 left-1/4 h-48 w-[28rem] rounded-full bg-gold/15 blur-[100px]"
            />
            <div className="relative">
              <Quote className="mx-auto h-8 w-8 text-gold" />
              {/* Her pearl line, and it is two sentences. Each gets its own
                  block so the break lands between them rather than wherever the
                  line happens to fill up — the same reason the hero headline is
                  built this way.

                  Phase 4 built `<QuoteReveal>`
                  (src/components/motion/quote-reveal.tsx) for exactly this
                  paragraph and left it unmounted until the phases merged. They
                  are merged now, and it still does not fit: QuoteReveal splits
                  ONE string into words, while this markup is deliberately two
                  blocks with `text-gradient` on the second. Swapping it in would
                  cost both the sentence break above and the gradient, to buy a
                  scroll effect on a line that is already the loudest thing in
                  the card. Left unmounted on purpose — if it is ever wanted
                  here, QuoteReveal needs a lead/highlight shape first, and that
                  is a design decision, not a merge. */}
              <p className="mx-auto mt-6 max-w-2xl text-balance text-2xl font-medium leading-snug tracking-tight text-foreground sm:text-3xl">
                <span className="block">{t("quoteLead")}</span>
                <span className="text-gradient block">
                  {t("quoteHighlight")}
                </span>
              </p>
              <p className="mt-6 font-medium text-xs uppercase tracking-wider text-subtle-foreground">
                {t("attribution", { founder: founderDisplayName() })}
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-3">
                {principles.map((p) => (
                  <span
                    key={p}
                    className="rounded-full border border-teal/25 bg-teal-soft/50 px-4 py-1.5 text-sm font-medium text-teal-deep"
                  >
                    {p.replace("{founder}", founderDisplayName())}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
