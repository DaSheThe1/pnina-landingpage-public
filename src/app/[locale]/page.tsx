import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  AudienceSection,
  FinalCta,
  FounderTeaser,
  HeroSection,
  OffersSection,
  PageShell,
} from "@/components/sections/marketing-sections";
import { FaqSection } from "@/components/sections/faq";
import { SectionCta } from "@/components/sections/section-cta";
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
      {/* ── A CTA AFTER EVERY SECTION (Pnina, 2026-08-03) ──
          Six of these, plus the free panel's own button and the hero's, so a
          reader is never more than one section away from the one action this
          page wants. Read the header of `SectionCta` for why repeating an
          OFFER is not the pressure pattern rule 4 bans — the short version is
          that none of them claims a deadline and none of them moves. */}
      <SectionCta label="founder" />
      {/* ── PROCESS BEFORE AUDIENCE (2026-07-30, Daniel) ──
          The process/animation section moved ABOVE "למי זה מתאים" at Daniel's
          request: "I think it's nicer and more important." The pearl scrub is
          the site's showpiece, and it now lands right after her story instead
          of after the audience grid. The identification-before-reassurance
          argument in the header comment still holds — her story is still
          first; only the how-it-works and the who-it-is-for swapped places.

          `ProcessExperience`, not `ProcessSection`: its final native-scroll
          shell is present in the first server HTML and never waits for video
          before occupying its real height. The in-site reduced-motion switch
          and Save-Data expose the separately rendered four-card version and
          download no process media. Same anchor, same copy either way. */}
      <section id={sectionIds.process} className="scroll-mt-20">
        <ProcessExperience />
      </section>
      {/* The "הליווי נבנה סביבך, לא סביב תבנית" teaser used to sit between
          the audience grid and the process. Removed from the home page on
          2026-07-29 at Daniel's request: it said the same thing the audience
          section had just said, in weaker words and a busier frame.
          `ServicesTeaser` itself is kept (unmounted, like `QuoteReveal`) so the
          copy is one line away if it ever earns a place on /about — see
          docs/02-site-structure.md. */}
      {/* ── THE CTA SITS IN THE GAP, NOT AGAINST THE ANIMATION (Pnina, 2026-08-04) ──
          *"after the animation, make a little bit of buffer and space because it
          looks ugly… move the call to action so it will be half between the
          animation and half between the 'who is it for' section."*
          The scrub ends flush against its own boundary surface, so a button
          rendered straight after it sat on the seam with almost no air above it
          while the section below had a full `py-12`. `spacing="loose"` gives
          this one equal room on both sides instead.
          ⚠️ It does NOT change the animation's own height — the scrub's `100lvh`
          stage and its `400lvh` track are untouched, which is what she asked
          for ("don't touch the widget height-wise"). */}
      <SectionCta label="process" spacing="loose" />
      <section id={sectionIds.audience} className="scroll-mt-20">
        <AudienceSection />
      </section>
      {/* Her own wording, and the reason it sits HERE: Daniel wanted the
          "דייט" line somewhere down the page where it arrives as a surprise
          rather than at the top where it would have to carry the whole hero. */}
      <SectionCta label="dateWithMe" />
      <OffersSection />
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
      {/* ── PROOF DIRECTLY UNDER THE OFFER (Pnina, 2026-08-03) ──
          *"הוכחה חברתית אחרי מי אני"* on the call, refined by Daniel the next
          day to *"right under the offer section"*. So the testimonials swapped
          places with the moments: what a reader meets immediately after being
          asked to book a free call is other women saying it was worth it. The
          moments follow, and they now close the argument rather than delay the
          proof. */}
      <section id={sectionIds.testimonials} className="scroll-mt-20">
        <Testimonials />
      </section>
      {/* Pulled in tight against the quotes above it, at her request: the
          messages ARE the argument, so the button belongs to them rather than
          floating in its own band. */}
      <SectionCta label="testimonials" spacing="tight" />
      {/* ── ⚠️ TWO SECTIONS HIDDEN ON 2026-08-04, BY PNINA, NOT DELETED ──
          `MomentsSection` ("מה הופך לאפשרי בתהליך הליווי", her five vignettes)
          and `TrustBand` (the pearl quote above the FAQ) are both unmounted at
          her request. She gave no reason for either beyond wanting them gone,
          and the page does read faster without them — by that point it has
          already made the argument twice, in her own story and in the messages
          other women sent.

          ⛔ THE CONTENT IS NOT DELETED and must not be. `moments.*` and the
          trust band's copy stay in `messages/he.json`, both components stay in
          the tree, and putting either back is uncommenting one line. The five
          moments in particular took a consent decision to write (all five are
          generalised on purpose — docs/04), and that work should not have to be
          redone if she changes her mind.
          They join `ServicesTeaser`, `QuoteReveal` and `PearlRevealSection`,
          which are kept the same way and for the same reason. */}
      {/* To bring either back: re-add the import and uncomment.
          <MomentsSection />
          <SectionCta label="moments" />
          <TrustBand />
      */}
      <section id={sectionIds.faq} className="scroll-mt-20">
        <FaqSection />
      </section>
      <SectionCta label="faq" />
      <section id={sectionIds.contact} className="scroll-mt-20">
        <FinalCta />
      </section>
    </PageShell>
  );
}
