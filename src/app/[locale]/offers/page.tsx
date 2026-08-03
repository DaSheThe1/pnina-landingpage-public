import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  HollowNode,
  NodeLabel,
  OfferIncludes,
  PageShell,
  PearlNode,
  SectionHeading,
  TrackFigure,
} from "@/components/sections/marketing-sections";
import { Price } from "@/components/ui/price";
import { Reveal } from "@/components/ui/reveal";
import { media } from "@/content/media";
import { offerTracks } from "@/content/offers";
import { pageMetadata } from "@/lib/seo";

/**
 * ── THE TWO TRACKS, ON A PAGE NOBODY FINDS BY ACCIDENT ──
 *
 * "מסלול צדפה" and "מסלול פנינה" used to sit under the free call on the home
 * page. Pnina asked for them taken off it entirely (2026-08-03 call), and the
 * reasoning is the clearest strategic thing she has said about this site: **the
 * page sells the CALL, and she sells the tracks ON the call.** Two priced
 * packages sitting under a free offer are two reasons to hesitate in front of
 * the only thing the page actually wants.
 *
 * She did not want them deleted — she likes how the cards look — so they live
 * here, and she sends the link by hand to a woman she is already talking to.
 *
 * ── "INVISIBLE" MEANS THREE SPECIFIC THINGS, AND ONE IT DOES NOT ──
 * Done here: `robots: noindex, nofollow` below; no entry in `sitemap.ts`; no
 * link from the nav, the footer, or any page on the site. Nothing crawls to it
 * and nothing on the site points at it.
 *
 * ⚠️ NOT done, and deliberately: it is still a PUBLIC URL. `noindex` hides a
 * page from search engines; it does not make it secret, and anyone who has the
 * link — or types the path — gets the page. Daniel accepted that explicitly on
 * 2026-08-04 ("it's fine that it can be guessable… no one is going to stumble
 * on it"), which is a reasonable call for a price sheet she hands out herself.
 * ⛔ It is NOT a reasonable place to put anything that would matter if a
 * stranger read it. No lead data, no client detail, no unpublished claim. If
 * this page ever needs to hold something private, it needs real access control,
 * not a quiet path.
 *
 * ── NO CTA ON PURPOSE ──
 * Daniel, 2026-08-04: *"That page doesn't end with a CTA. It is purely an
 * offer-explaining sheet."* Whoever is reading this is already on the phone
 * with her; a button asking her to leave a name and a phone number would be
 * asking for something she has already given.
 *
 * ── VAT ──
 * There is no VAT line and there must not be one. Pnina does not charge it
 * (Daniel, 2026-08-04 — a small business, same as his). ₪990 and ₪2,880 are the
 * final amounts. That also closes the "כולל מע״מ" question that has been open
 * in docs/01 since July: the answer is that the phrase does not belong here at
 * all, rather than that it was never confirmed.
 *
 * ── WHAT IS HERS AND WHAT IS NOT ──
 * Hers: both prices, both durations, and the meeting counts (4 and 12), given
 * on the 2026-08-03 call.
 * TODO(client): the two "מתאים לך אם…" lines are still ours, carried over from
 * the home page. She should read them.
 * ❓ Still missing and worth asking for: how long a single מפגש runs. Daniel
 * has said not to chase it, so nothing on this page states a length — do not
 * invent one to fill the row.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as "he",
    namespace: "tracks",
  });
  return {
    ...pageMetadata({
      locale,
      title: t("metaTitle"),
      description: t("metaDescription"),
      path: "/offers",
    }),
    // The whole point of the page. Keep both halves: `nofollow` stops a crawler
    // that reached this URL some other way (a pasted link in an indexed page,
    // a browser extension) from walking onward from it.
    robots: { index: false, follow: false },
  };
}

type TrackItem = {
  title: string;
  duration: string;
  meetings: string;
  price: string;
  fit: string;
  includes: string[];
};

export default async function OffersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as "he");
  const t = await getTranslations({ locale: locale as "he", namespace: "tracks" });
  const tracks = t.raw("items") as TrackItem[];

  return (
    <PageShell>
      <section className="bg-background px-6 py-14 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <SectionHeading
              align="center"
              title={t("title")}
              description={t("description")}
            />
          </Reveal>

          {/* The card layout is carried over verbatim from the home page's
              0.11.4 tracks — picture on the visual right, words on the visual
              left, prices small. The reasoning for all of it is in the note on
              `TrackFigure` in marketing-sections.tsx and is unchanged by the
              move; the only new field is the meeting count, which is the one
              thing this page exists to state. */}
          <ol className="mt-10 space-y-5 sm:mt-12 sm:space-y-6">
            {tracks.map((track, index) => (
              <Reveal key={track.title} as="li" delay={index * 90}>
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
                    {/* Name, meeting count and price on one baseline: all three
                        are facts ABOUT the name rather than headlines of their
                        own, which is what keeps the number from reading as a
                        price tag. `flex-wrap` because the three do not fit one
                        line on a phone. */}
                    <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <h2 className="font-display text-[2.0rem] leading-tight text-foreground sm:text-[2.2rem]">
                        {track.title}
                      </h2>
                      <p className="text-base font-semibold text-heading-gold">
                        {track.meetings}
                      </p>
                      <p className="text-base text-muted-foreground">
                        <Price>{track.price}</Price>
                      </p>
                    </div>
                    <p className="mt-3.5 max-w-xl text-base leading-relaxed text-foreground-soft">
                      {track.fit}
                    </p>
                    <OfferIncludes
                      items={track.includes}
                      className="mt-4 sm:flex sm:flex-wrap sm:gap-x-9 sm:gap-y-2 sm:space-y-0"
                    />
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>
    </PageShell>
  );
}
