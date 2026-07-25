import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  FinalCta,
  FounderTeaser,
  HeroSection,
  OffersSection,
  PageShell,
  ProcessSection,
  ServicesTeaser,
} from "@/components/sections/marketing-sections";
import { FaqSection } from "@/components/sections/faq";
import { JsonLd } from "@/components/seo/json-ld";
import type { Faq } from "@/content/faq";
import {
  faqPageSchema,
  organizationSchema,
  personSchema,
  webSiteSchema,
} from "@/lib/seo";
import { StatsSection } from "@/components/sections/stats";
import { Testimonials } from "@/components/sections/testimonials";
import { TrustBand } from "@/components/sections/trust-band";

/**
 * The whole funnel, on one page.
 *
 * Order is deliberate and reads as an argument, not a feature list:
 *   hero            — what this is, and that a first conversation costs nothing
 *   approach        — what the accompaniment actually is (#approach)
 *   offer           — the price funnel ending at the free first session
 *   process         — what happens step by step, so nothing is a surprise (#process)
 *   trust           — discretion, pace, no obligation
 *   testimonials    — the messages women actually sent her (#testimonials)
 *   founder         — who she is
 *   faq             — the questions that stop someone from calling (#faq)
 *   final CTA       — the form (#contact)
 *
 * Reassurance comes BEFORE proof and proof before the ask. Do not reorder this
 * into a conventional "social proof high up" layout without reading
 * docs/02-site-structure.md — the sequencing is the design.
 */
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as "he");
  const t = await getTranslations({ locale: locale as "he", namespace: "faq" });
  const faqs = t.raw("items") as Faq[];

  return (
    <PageShell>
      <JsonLd data={organizationSchema()} />
      <JsonLd data={webSiteSchema(locale)} />
      <JsonLd data={personSchema()} />
      <JsonLd data={faqPageSchema(faqs)} />
      <HeroSection />
      <section id="approach" className="scroll-mt-20">
        <ServicesTeaser />
      </section>
      <OffersSection />
      <StatsSection />
      <section id="process" className="scroll-mt-20">
        <ProcessSection />
      </section>
      <TrustBand />
      <section id="testimonials" className="scroll-mt-20">
        <Testimonials />
      </section>
      <FounderTeaser />
      <section id="faq" className="scroll-mt-20">
        <FaqSection />
      </section>
      <section id="contact" className="scroll-mt-20">
        <FinalCta />
      </section>
    </PageShell>
  );
}
