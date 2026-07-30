# Site structure — and why

## The shape

A **long single landing page** carrying the whole funnel, plus a small number of
sub-pages that each earn their place.

```
/                    the funnel (see order below)
/lectures            organisations booking a talk — different audience, different CTA
/about               who she is; schema.org Person for search/AI answer engines
/contact             a clean address to send someone to
/thank-you           post-submission: her video + what happens next
/privacy /terms /accessibility
```

## Why not a conventional multi-page site

The template this came from was built for an architect, where `/examples` is the
product — a portfolio of buildings. There is no equivalent here. A separate
services page, examples page and reviews page would each carry two paragraphs.
Eight thin pages read as less professional than one confident page, and they
split the funnel across clicks that a person in distress will not make.

So: services became a section, reviews became a section next to the CTA (social
proof works beside the ask, not one navigation step away), and examples was
dropped entirely.

## Why `/lectures` is a page and not a section

It serves a **different reader**: an HR lead, a school counsellor, a community
centre coordinator. They need "what will you deliver, to whom, for how long,
what does it cost". A woman looking for personal support needs the opposite —
unhurried, private, no logistics. Mixing the two registers on one page weakens
both. The page also has its own CTA wording ("book a talk", not "leave your
details"), and leads from it carry `source: "lectures"` so they can be answered
appropriately.

She does give talks — one, "שכבות של פנינה", to the seven kinds of audience
listed on the page — so as of Phase 1 the route is linked, indexed and in the
sitemap again. There is deliberately no price row on it (decision D5): a booker
who wants a number asks for one.

## Why `/accessibility` exists

Israeli regulations (תקנות שוויון זכויות לאנשים עם מוגבלות, pointing at the
ת"י 5568 standard) require a business website serving the Israeli public to
publish an accessibility statement naming a contact for accessibility problems.
Most small practice sites skip it. See [09-accessibility.md](09-accessibility.md).

## The order of the landing page

Reordered 2026-07 at Pnina's request (decision D11, `docs/12-redesign-plan.md`).

```
hero          what this is, and that the introductory call costs nothing
founder       who she is, and that she has been where the reader is
audience      "למי הליווי מתאים" — the eight things women arrive with  #audience
process       what happens step by step, so nothing is a surprise      #process
offer         what the call is worth, that it is free, and the two tracks
moments       what she has watched become possible
testimonials  other women's words                                      #testimonials
trust band    her pearl line, closing the proof; discretion, no obligation
faq           the questions that stop someone from calling             #faq
final CTA     the form itself, inline                                  #contact
```

**Identification before reassurance, reassurance before proof, and the ask
last.** Her story used to sit eighth, between the reviews and the FAQ; she asked
for it near the top and she was right. The first thing a woman on this page
needs is not an argument about a method — it is the recognition that the person
on the other side of it has been where she is. Her story does that, and the
audience grid immediately after it lets the reader find her own sentence on the
page before anyone explains anything.

Only then does the conventional argument run: what the accompaniment is, what
happens step by step, what it costs. The conventional landing-page order would
put social proof high, right after the hero; here the question in a reader's
mind is not "is she any good" but "is this safe, and will I have to explain
myself", so the audience grid and the process answer that before anyone is asked
to believe a testimonial or leave a number.

**The `#approach` block is gone (2026-07-29).** "הליווי נבנה סביבך, לא סביב
תבנית" (`ServicesTeaser`) used to sit between the audience grid and the process.
It repeated the argument the audience grid had just made, one screen earlier and
in weaker words, so Daniel took it off the page. The component is kept unmounted
in `marketing-sections.tsx` in case /about ever wants it; the header slot it
owned now points at `#audience`, which is the section a hesitating reader
actually needs.

**Do not push the story back down.** It moved because she asked, not because it
tested better.

**The trust band moved BELOW the testimonials (2026-07-29, Daniel).** It used to
introduce them. Read straight after other women's own messages, her pearl line
reads as what those messages meant; read before them, it was a claim the reader
was then handed the evidence for. Nothing about the section itself changed.

The **moments** section sits where the stats strip used to. Every stat there was
a placeholder zero and the strip hid itself, so that slot rendered nothing at
all; five generalised things she has witnessed do the job a numbers row was
there to do without making a single claim about how many women or how long.
`stats.ts` and `StatsSection` were deleted outright in v0.9.0 — an empty frame
nobody could fill is not an asset. Real figures, if she ever supplies them, get
a section built for them.

The **offer** ("מהצדפה אל הפנינה") is two blocks, not a pricing table: the free
שיחת היכרות as a panel of its own carrying the section's only button, and under
it — behind the label "המסלולים שנדבר עליהם בשיחה" — the two tracks as two equal
side-by-side columns. The free call is the thing being given away; the tracks are
what gets discussed on it, which is why they are not its siblings. It was one
three-rung vertical ladder until 2026-07-29 — see D10 and the review-round note
in `docs/12-redesign-plan.md`.

The FAQ sits immediately before the form on purpose: it is a list of the exact
objections that stop someone from calling ("do I have to say what happened", "do
I need to file a complaint", "it was a long time ago"), answered at the moment
the decision is made.

Anchor ids are declared in `src/config/navigation.ts` so a rename breaks in one
place.

**The header links to the reviews, not to the FAQ.** There are five header slots
and more sections than that, so one section had to lose its slot. The FAQ answers
objections *at the moment of decision*, which is why it sits directly above the
form — someone who has scrolled that far will reach it anyway. The reviews are
what a hesitating visitor goes looking for *before* she scrolls, and a header
link is the only way to get there in one click. The FAQ keeps its `#faq` anchor
and its footer link (`footerNavigation`).

## If a Node deployment is ever needed

The `[locale]` route segment plus next-intl middleware exists so English can be
added later as a config change. It is also the source of the `next start`
redirect loop described in [11-testing.md](11-testing.md). If this site ever
needs a real server (it currently does not — it is a static export), the clean
fix is to drop the `[locale]` segment and render Hebrew directly from
`src/app/`, keeping next-intl only as a message loader.
