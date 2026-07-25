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
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-20 left-1/4 h-48 w-[28rem] rounded-full bg-teal/15 blur-[100px]"
            />
            <div className="relative">
              <Quote className="mx-auto h-8 w-8 text-gold" />
              <p className="mx-auto mt-6 max-w-2xl text-balance text-2xl font-medium leading-snug tracking-tight text-foreground sm:text-3xl">
                {t("quoteLead")}
                <span className="text-gradient">{t("quoteHighlight")}</span>
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
