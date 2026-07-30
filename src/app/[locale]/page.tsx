import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  AudienceSection,
  FinalCta,
  FounderTeaser,
  HeroSection,
  MomentsSection,
  OffersSection,
  PageShell,
} from "@/components/sections/marketing-sections";
import { FaqSection } from "@/components/sections/faq";
import { ProcessExperience } from "@/components/sections/process-experience";
import { JsonLd } from "@/components/seo/json-ld";
import type { Faq } from "@/content/faq";
import {
  faqPageSchema,
  organizationSchema,
  personSchema,
  webSiteSchema,
} from "@/lib/seo";
import { Testimonials } from "@/components/sections/testimonials";
import { TrustBand } from "@/components/sections/trust-band";
import { sectionIds } from "@/config/navigation";

/**
 * The whole funnel, on one page.
 *
 * Order is deliberate and reads as an argument, not a feature list:
 *   hero            — what this is, and that the introductory call costs nothing
 *   founder         — who she is, and that she has been where the reader is
 *   process         — what happens step by step, so nothing is a surprise (#process)
 *   audience        — "למי הליווי מתאים", where the reader finds herself (#audience)
 *   offer           — what the call is worth, that it is free, and the two tracks
 *   moments         — what she has watched become possible
 *   testimonials    — the messages women actually sent her (#testimonials)
 *   trust           — her pearl line, closing the proof; discretion, no obligation
 *   faq             — the questions that stop someone from calling (#faq)
 *   final CTA       — the form itself (#contact)
 *
 * ── WHY THE QUOTE SITS AFTER THE REVIEWS (2026-07-29, Daniel) ──
 * The trust band used to introduce the testimonials. It now closes them: read
 * straight after other women's own messages, "פנינה לא נוצרת למרות השכבות שלה"
 * reads as what those messages MEANT, instead of as a claim the reader is then
 * handed the evidence for. Same section, same copy, one place later.
 *
 * ── WHY HER STORY MOVED UP (2026-07, at her request) ──
 * It used to sit eighth, between the reviews and the FAQ. The first thing a
 * woman on this page needs is not an argument about a method — it is the
 * recognition that the person on the other side has been where she is. So the
 * order is now IDENTIFICATION BEFORE REASSURANCE: her story, then the eight
 * things women arrive with, and only then how the accompaniment works and what
 * it costs. Reassurance still comes before proof, and the ask is still last.
 *
 * Do not reorder this into a conventional "social proof high up" layout, and do
 * not push the story back down, without reading docs/02-site-structure.md.
 *
 * The stats strip used to render between the offer and the process. Every stat
 * was a placeholder zero and the section hid itself, so it was rendering
 * nothing; MomentsSection now occupies that place in the flow, and `stats.ts` /
 * `StatsSection` were deleted in v0.9.0 rather than left as an empty frame.
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
      <FounderTeaser />
      <section id={sectionIds.audience} className="scroll-mt-20">
        <AudienceSection />
      </section>
      {/* The "הליווי נבנה סביבך, לא סביב תבנית" teaser used to sit here, between
          the audience grid and the process. Removed from the home page on
          2026-07-29 at Daniel's request: it said the same thing the audience
          section above it had just said, in weaker words and a busier frame.
          `ServicesTeaser` itself is kept (unmounted, like `QuoteReveal`) so the
          copy is one line away if it ever earns a place on /about — see
          docs/02-site-structure.md. */}
      {/* `ProcessExperience`, not `ProcessSection`: it renders the static four
          cards on the server and for every visitor who has asked for less
          motion or less data, and upgrades to the scroll-scrubbed pearl only
          when the frames actually exist. Same anchor, same copy either way. */}
      <section id={sectionIds.process} className="scroll-mt-20">
        <ProcessExperience />
      </section>
      <OffersSection />
      <MomentsSection />
      {/* ── THE PEARL SEQUENCE MOVED INTO THE PROCESS SECTION (2026-07-30) ──
          `PearlRevealSection` used to render here: the same pearl frames
          (`motion/pearl/`), as a wordless 300vh beat between the moments and
          the trust band. The process scrub that landed with Daniel's
          `agent/pearl-process-scrub` branch plays those exact frames, so
          keeping both would have shown one visitor the same animation twice on
          one page and probed the same bucket prefix from two components.
          The process one wins — it is the feature Daniel asked for, and it
          gives the frames a job (four stations, four steps) rather than a
          pause. `PearlRevealSection` itself is KEPT, unmounted, in the same
          spirit as `ServicesTeaser` and `QuoteReveal`: if the wordless beat is
          ever wanted back it needs its own frame collection, not this one.
          `StageRevealSection` on /lectures is untouched — different frames
          (`motion/stage/`), different page. */}
      <section id={sectionIds.testimonials} className="scroll-mt-20">
        <Testimonials />
      </section>
      {/* The pearl quote closes the proof, it does not introduce it (moved
          2026-07-29, Daniel). Read directly after the messages other women
          sent, "פנינה לא נוצרת למרות השכבות שלה" lands as the meaning of what
          the reader has just been shown, rather than as a claim she is then
          asked to verify. */}
      <TrustBand />
      <section id={sectionIds.faq} className="scroll-mt-20">
        <FaqSection />
      </section>
      <section id={sectionIds.contact} className="scroll-mt-20">
        <FinalCta />
      </section>
    </PageShell>
  );
}
