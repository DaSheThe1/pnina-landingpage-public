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

If the client turns out not to give talks, delete the route, its entry in
`src/config/navigation.ts`, and its line in `src/app/sitemap.ts`.

## Why `/accessibility` exists

Israeli regulations (תקנות שוויון זכויות לאנשים עם מוגבלות, pointing at the
ת"י 5568 standard) require a business website serving the Israeli public to
publish an accessibility statement naming a contact for accessibility problems.
Most small practice sites skip it. See [09-accessibility.md](09-accessibility.md).

## The order of the landing page

```
hero          what this is, and that a first conversation costs nothing
approach      what the accompaniment actually is                       #approach
offer         the price funnel, ending at the free first conversation
process       what happens step by step, so nothing is a surprise      #process
trust band    discretion, pace, no obligation
testimonials  other women's words                                      #testimonials
founder       who she is
faq           the questions that stop someone from calling             #faq
final CTA     the form                                                 #contact
```

**Reassurance comes before proof, and proof before the ask.** The conventional
landing-page order puts social proof high, immediately after the hero. Here the
first question in a reader's mind is not "is she any good" but "is this safe,
and will I have to explain myself" — so the approach and the process answer that
before anyone is asked to believe testimonials or leave a number.

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
