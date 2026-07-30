"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { Eyebrow, SectionHeading } from "@/components/sections/marketing-sections";
import { cn } from "@/lib/utils";

type FaqItem = { question: string; answer: string };

export function FaqSection() {
  const t = useTranslations("faq");
  const faqs = t.raw("items") as FaqItem[];
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-background px-6 py-14 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <Reveal className="text-center">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <SectionHeading
            align="center"
            title={t("title")}
            description={t("description")}
          />
        </Reveal>

        <div className="mt-12 flex flex-col gap-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={faq.question} delay={i * 50}>
                <div
                  className={cn(
                    "rounded-xl border transition-colors",
                    isOpen
                      ? "border-foreground/[0.14] bg-foreground/[0.04]"
                      : "border-foreground/[0.08] bg-foreground/[0.02] hover:border-foreground/[0.12]"
                  )}
                >
                  {/* Question-as-heading: h3 wraps the trigger (accordion pattern). */}
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
                    >
                      <span className="text-base font-medium text-foreground">
                        {faq.question}
                      </span>
                      <Plus
                        className={cn(
                          "h-4.5 w-4.5 shrink-0 text-muted-foreground transition-transform duration-300",
                          isOpen && "rotate-45 text-brand-accent"
                        )}
                      />
                    </button>
                  </h3>
                  <div
                    className={cn(
                      "grid transition-[grid-template-rows] duration-300 ease-out",
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="overflow-hidden">
                      {/* Clicking anywhere in the open answer collapses it too. */}
                      <button
                        type="button"
                        tabIndex={isOpen ? 0 : -1}
                        aria-label={t("collapse")}
                        onClick={() => setOpen(null)}
                        className="block w-full cursor-pointer px-5 pb-5 text-start text-sm leading-[1.75] text-muted-foreground"
                      >
                        {faq.answer}
                      </button>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
