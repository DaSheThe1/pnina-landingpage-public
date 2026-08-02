# Agent playbook — pnina-website

Read this file plus `README.md` and `docs/00-index.md` before editing.

## Project summary

Hebrew-first landing page for **פנינה פאף** (Penina Phaff), who accompanies
women who have experienced sexual assault. One goal: get a woman to leave a name
and a phone number so she can be called back for a first conversation at no cost.
A secondary audience — organisations booking a lecture — has its own page and
its own CTA (`/lectures`). It carries her real talk ("שכבות של פנינה") as of
Phase 1, so it is linked from the nav, indexed and back in the sitemap.

The site is served at **peninaphaff.com**. That host lives in exactly one place,
`DOMAIN` in `src/config/site.ts`; `public/CNAME` is generated from it. Never
write a hostname anywhere else.

Next.js App Router + TypeScript + Tailwind 4 + next-intl, pnpm, Playwright.
**Hebrew-only** (single `he` locale, RTL, served at the root). No database, no
payments, no client area. Scaffolded from the `yarin-landingpage` template; the
next-intl machinery stays so English can be added later.

**Most of her content is in as of Phase 1** (her sections, her audience list,
her lecture, her prices). What is still outstanding is tracked in
`docs/01-client-intake.md` and `docs/12-redesign-plan.md` §C, and every
unconfirmed value in the code is a loud `PLACEHOLDER_*`. Do not invent
replacements for them, and do not upgrade "she said roughly X" into a number.

## This site is not a normal marketing site

The people this site is built for arrive after a sexual assault, often in
distress, sometimes on a device someone else can see. That changes what "good"
means here, and these rules are not stylistic preferences:

1. **Exactly ONE optional free-text field on the lead form, and it is hers.**
   The form is name + phone + Pnina's own question, "מה הכי היית רוצה שיקרה
   בעקבות השיחה שלנו?" (field name `question`, approved 2026-07-29 — docs/12,
   D1). That question asks what a woman wants to HAPPEN NEXT, not what happened
   to her, and that distinction is the entire safety argument: a "tell me a bit
   about what happened" box would create a permanent record of the most
   sensitive thing a person could write, sitting in an n8n execution log, a
   spreadsheet and an inbox. So:
   - it stays **optional** — never required, never validated, never nagged for;
   - it stays **alone** — never a second free-text field;
   - it stays **her wording** — never re-phrased into a prompt to describe the
     assault, and never widened past its 300-character cap;
   - it is **never tracked**. `AnalyticsEvent` must not learn it exists, and
     nothing about its contents reaches analytics.
   `contactSchema` stays `.strict()`, so anything else is rejected outright.
   Changing it means changing `src/lib/contact-schema.ts` AND its hand-kept copy
   in `worker/src/contact.js` in the same commit. Read the header comment in the
   schema file first.
2. **Only real, consented testimonial material — never invented.** The quotes
   and screenshots on the site now ARE real: messages Pnina received and shared
   publicly herself, which is why `testimonialsAreSamples` in
   `src/content/testimonials.ts` is correctly `false` and the section shows
   `privacyNote` rather than a "these are examples" disclaimer. The invariant is
   not the value of that flag — it is that the flag must always tell the truth
   about what is on screen. The moment anything illustrative or placeholder-
   shaped goes back in, it flips to `true` in the same commit.
   Third-party identity in a screenshot (a face, a handle, a phone number) is
   redacted by `scripts/media/redact-testimonials.mjs`, never by hand.
   Read `docs/04-testimonials-policy.md` before touching anything
   testimonial-shaped. Fabricated testimony about trauma is not a marketing
   shortcut.
3. **Never invent numbers.** "עזרתי ל-200 נשים" is a claim about real people; if
   it is not true it is a cruel lie. The site therefore carries NO counters:
   the placeholder stats strip (`stats.ts` + `StatsSection`, every value `0`)
   was deleted rather than kept as an empty frame, and `MomentsSection` does
   that slot's job with five things she has witnessed and no arithmetic. If
   Pnina ever supplies real, checkable figures, a strip gets built then — from
   her numbers, never from plausible ones. The same rule governs prices: the
   only ones on the site (₪490 / ₪990 / ₪2,880) are hers.
4. **No pressure mechanics.** No countdown timers, no "only 2 spots left", no
   flashing discounts. The template's always-on pulsing price animation was
   removed for exactly this reason (it also overrode `prefers-reduced-motion`
   with `!important`). The funnel it belonged to is gone too: the offer
   (`OffersSection`) is the free שיחת היכרות as one panel carrying the section's
   ONLY button, with the two tracks below it as two equal columns — track prices
   as small facts, no strikethrough, no badge, no `featured` flag, no winner. Do
   not reintroduce a struck-through "before" price; the only ones that ever
   existed here were invented.
   **That panel — and ONLY that panel — may be loud (Daniel, 2026-07-29):** warm
   gold wash, a hot gradient CTA, "ללא עלות" set larger than anything in the
   section but its h2, and a one-time entrance where the ₪490 lands, a gold
   arrow draws toward the gift and light crosses it once. The licence is about
   JOY and it stops at the panel's edge. It is not a licence to loop anything:
   no throb, no timed sheen, no countdown, no scarcity, nothing that repeats
   while she reads. Loud once is enthusiasm; loud forever is pressure. The line
   is argued in full at the head of `src/components/motion/free-call-anchor.tsx`
   and in globals.css §9.
5. **Motion is ON by default. The site's own switch is the only opt-out.**
   This REVERSES the rule that stood here until 2026-07-30, and it is Daniel's
   decision as the owner, stated twice that day: *"Usually we want animations on
   by default. We don't want the clients to override it by default using the
   browser thing,"* and, of the accessibility panel's control, that reduced
   motion *"should be off by default"*. The contract, in full:
   - **Every visitor gets the motion.** Reveals, the pearl scrub, the sand
     plate, the hero autoplay, all of it, on arrival.
   - **The device's `prefers-reduced-motion` signal is not read anywhere.** It
     no longer suppresses anything and no longer seeds anything. There is no
     `@media (prefers-reduced-motion: …)` arm left in `globals.css` and no
     `matchMedia("(prefers-reduced-motion…)")` left in `src/`. **Do not add one
     back** — not "just for this section", not as a default, not as a seed. An
     agent that reinstates the OS signal is overruling the owner.
   - **The ONE opt-out is the "הפחתת תנועה" switch in the accessibility panel.**
     It starts OFF for everyone, it is stored per browser, it is stamped on
     `<html>` as `data-a11y-reduce-motion` before the first paint by
     `a11y-boot-script.ts`, and turning it on gives the complete static
     experience: reveals already visible, the process section left as four
     static cards with no frames downloaded, cursor layers and the sand ripple
     never mounted, the hero clip paused.
   - **Every gate reads that one switch**, and nothing else: in React,
     `usePrefersReducedMotion` (`src/components/motion/use-reduced-motion.ts`);
     outside it, `prefersReducedMotion()` (`src/lib/eval-flags.ts`); in CSS, the
     `:root[data-a11y-reduce-motion="true"]` block in `globals.css` plus the
     `:root:not([data-a11y-reduce-motion="true"])` gates on the four
     scroll-timeline effects (§1, §2, §5, §6 — those need their own gate because
     a scroll-timeline animation ignores `animation-duration`).
   - **Save-Data / connection-aware gating STAYS.** Skipping the pearl frames for
     a visitor who asked to save data is about bytes, not motion, and it is
     unaffected by any of the above.
   - **Nothing on this site animates meaning**, and nothing loops to create
     pressure (rule 4). That has not changed and is what makes motion-by-default
     defensible here.
   - **No `!important` escapes** — nothing may `!important` its way PAST the
     reduced-motion block. That block itself uses the flag, and has to: it has to
     outrank the more specific motion-system rules further down the file. The
     test is simple — never put `!important` on something that MOVES.
   - The copy has to keep telling the truth: the accessibility statement in
     `messages/he.json` describes the in-site switch and says the choice is not
     taken from the system setting. **That copy and this behaviour change
     together.**
   `?motion=force` (globals.css §7, `src/lib/eval-flags.ts`) is now **inert by
   default and scheduled for deletion**. It existed only because the site used to
   follow the OS setting, which is on on Daniel's review machine, so he could not
   see the motion work; motion is on for everyone now, so the only thing it still
   overrides is the panel switch. It stays sticky (`pnina:eval-motion` in
   `localStorage`, written by that one keystroke and nothing else; `?motion=reset`
   clears it) purely so a browser holding the key from the review round behaves
   predictably. It goes with the `?hover=` switcher at the end of the round.
   **Do not widen it: no default, no UI control, no second stored preference.**
6. **No session-replay or form-capture analytics, ever.** Not Hotjar, not
   Clarity, not FullStory. Recording what these visitors read or type is a
   serious breach. `AnalyticsEvent` in `src/lib/analytics.ts` is a closed union
   of five events carrying no data — keep it that way.
   GA4 (`G-8WH5H49LVN`) IS live, set in `.github/workflows/deploy-pages.yml`,
   and it sets cookies. The privacy page's "עוגיות וכלי מדידה" section says so;
   **the two change together.** It may load only after explicit opt-in through
   `MinimalCookieConsent`; no other GA/GTM loader is allowed.
7. **No stock imagery of distressed women.** Missing photos render a calm
   monogram panel; that is better than a stock photo of someone crying.
8. **The 1202 crisis line was REMOVED, and stays removed.** The footer used to
   carry a banner pointing at the 1202 national helpline. Daniel asked for it
   taken out — it was never in the brief — so `siteConfig.crisisLine`, the
   footer banner and the e2e test that guarded it are all gone (see the note at
   `e2e/smoke.spec.ts:61`). The "this is not an emergency service" line still
   stands on the terms page, which is where it belongs.
   This is a decision about how Pnina's own practice presents itself, so it is
   hers and Daniel's to revisit. **Do not re-add it, and do not remove what
   remains of it, without one of them asking.** An agent that "helpfully"
   restores it is overruling a client decision.

If a change would trade any of the above for conversion rate, don't make it —
raise it with Daniel instead.

## Repositories & publishing (mandatory)

Two repos, one source of truth:

- **This (private) repo** — the single source of truth. ALL work happens here.
  It also holds material the public site must never expose (`worker/`,
  `n8n-workflows/`, `private-media/`, `.env.local`, the private planning docs).
- **The public repo** — a **generated mirror** that GitHub Pages builds from.
  **Never edit, commit, or merge in it directly.**

> **Publishing is gated on Daniel's explicit approval, every time.**
> Pushing the mirror triggers the live deploy, so it is NEVER automatic. Do NOT
> run `scripts/publish-public.sh` or push to the public remote unless Daniel has,
> in the current conversation, told you to publish/deploy/go live. Merging to
> `main` **here** is the normal end state of a task and deploys nothing.
> "Merge it" is approval to merge here, NOT to publish.

`scripts/publish-public.sh` mirrors the tree (deny-listing private paths) and
runs a **hard leak gate** that aborts on private keys, real webhook
URLs/secrets, any Israeli phone number not declared in `src/config/site.ts`, and
any file in `public/testimonials/` not registered in `src/content/media.ts`.
The gate is stricter than usual because the public repo keeps its history
forever — a client's phone number pushed once cannot be unpublished.

## Versioning rules (mandatory)

Every change that alters behaviour, content, API responses or deployment ships
with a version bump and a `CHANGELOG.md` entry in the same commit.

1. Source of truth: `version` in `package.json`. `src/lib/version.ts` re-exports
   it as `APP_VERSION`; `GET /api/health` returns it.
2. **PATCH** = fixes/copy tweaks/refactors. **MINOR** = new pages, sections,
   features, env vars. **MAJOR** = breaking URL / contact-API / deploy changes.
3. Update `CHANGELOG.md` (Keep a Changelog) under `## [x.y.z] - YYYY-MM-DD`.
   Write entries for the site owner, not for git archaeologists.
4. Docs/comment/test-only edits skip the bump.

## Folder ownership

- `src/app/[locale]/` — routes: `/`, `/about`, `/lectures`, `/contact`,
  `/thank-you`, `/privacy`, `/terms`, `/accessibility`.
- `src/app/api/` — `/api/contact` (lead → n8n) and `/api/health`. **These exist
  only in dev and in the e2e build.** Production is a static export and the
  Cloudflare Worker in `worker/src/contact.js` serves `/api/contact` instead —
  it is a hand-kept copy of the same validation, so changing one means changing
  the other.
- `src/components/sections/` — page sections. `layout/` — header/footer/chrome.
  `ui/` — primitives. No business logic in components.
- `src/components/accessibility/` — the visitor-facing accessibility options:
  the launcher and its dialog, the skip link, `AccessibilityProvider` (the five
  preferences, stored per browser and never sent anywhere) and
  `a11y-boot-script.ts`, an inline script that stamps the stored choices on
  `<html>` before the first paint. The CSS that reads those `data-a11y-*`
  attributes is one block in `globals.css`, immediately above the reduced-motion
  rules. Adding a preference means touching all three: the provider, the boot
  script and that block.
- `src/components/consent/` — `MinimalCookieConsent`, the opt-in gate GA4 loads
  behind (rule 6 above), plus the footer's "עוגיות" control that reopens it.
- `src/components/motion/` — the redesign's motion layer, and
  `use-reduced-motion.ts`, which is the ONLY place a component should ask
  whether to move. Outside the React tree, ask `prefersReducedMotion()` in
  `src/lib/eval-flags.ts`; the two read the same one input — the accessibility
  panel's switch, off `data-a11y-reduce-motion` — plus the doomed
  `?motion=force` override, and must stay in step. Neither reads the device's
  `prefers-reduced-motion` setting; see rule 5.
- `src/config/` — `site.ts` (identity, all the PLACEHOLDERs) and `navigation.ts`.
- `src/content/` — structure only, matched by index to `messages/he.json`.
  **`media.ts` is the single registry of every image/video the client owes**;
  a `null` src renders a designed placeholder rather than a broken image.
- `src/lib/` — env access (`env.ts`), contact schema, seo, analytics, version.
- `messages/he.json` — **all** user-facing copy. Never hardcode Hebrew in a
  component; add a key. **No em-dashes or en-dashes in Hebrew copy** — not `—`,
  not `–`. Daniel's rule, swept clean on 2026-07-29: they read as machine-set
  English typography in a Hebrew sentence, and a page written for a woman in
  distress should sound like a person wrote it. Use a full stop, a comma or a
  colon instead; the sentence almost always improves. A plain hyphen inside a
  range or a compound ("40-60 דקות", "ב-public/brand") is fine and is not what
  this is about. The rule covers everything a visitor can read, including `alt`
  text in `src/content/`. Code comments and these docs are unaffected.
  **The site addresses its readers in the FEMININE everywhere** (Daniel,
  2026-07-30: "all of the website should be female, plural, and
  female-speaking"). The funnel's intimate feminine singular (אלייך, שלחי)
  stays; where the copy is plural it is feminine plural, so `לכן` / `אליכן` /
  `שלכן` / `אתן`, never `לכם` / `אליכם` / `שלכם` / `אתם`. **Feminine plural
  PRONOUNS and suffixed prepositions only. VERBS keep their standard modern
  plural form** (`השאירו`, `תרצו`, `צרו קשר`); the archaic ־נה feminine plural
  (`תשלחנה`, `תרצינה`) is **banned**, because it reads as a grammar exercise
  rather than as a woman talking. If a sentence fights the morphology, rephrase
  it to drop the pronoun instead of forcing it. Grammatical masculine that
  agrees with a masculine NOUN ("הליווי ... מתאים", "התהליך הוא") is correct
  Hebrew and is not what this rule is about.
- `worker/` — the Cloudflare Worker serving `/api/contact` in production. Holds
  the n8n URL/secret. Excluded from the public mirror.
- `.github/workflows/deploy-pages.yml` — the live deploy (runs in the PUBLIC
  repo, where Actions minutes are free).

## Instructions for coding agents

- pnpm only (`packageManager: pnpm@11.5.2`); never npm/yarn.
- Match existing patterns: `@/` imports, Zod validation in `src/lib`, env access
  only through `src/lib/env.ts`, copy in `messages/he.json`.
- Server-only values (n8n webhook URL/secret) must never reach the browser, get
  a `NEXT_PUBLIC_` prefix, or appear in logs or source.
- Tailwind arbitrary values **cannot contain spaces**: `bg-[...rgba(1, 2, 3,
  0.4)...]` parses as three separate class tokens and emits no CSS. Write
  `rgba(1,2,3,0.4)`. The template shipped several of these silently broken.
- `src/middleware.ts` must NOT be renamed to `proxy.ts` despite Next 16's
  deprecation warning — see the comment in that file. It causes a redirect loop.
- Design tokens (v0.8.0 — cream · gold · brown, NOT the template's plum · teal).
  **The whole colour system answers to one brief, and the brief is Pnina's own.**
  She reviewed the live site on 2026-08-02 and sent her palette through Daniel:
  the page should carry
  לבן · שמנת · בז' · אפרסק עדין · זהב עדין · חום טבעי · תכלת־כסף,
  and it should read as
  רוגע · תקווה · חוזק · אלגנטיות · נשיות · אור.
  Those six words are what a new colour has to be checked against, and that list
  is the reason the accent moved (next bullet). Almost all of it was already on
  the page — her palette and this site's surfaces were never far apart — which is
  why answering her was a hue move and not a redesign.
  `--brand` (#6b4f3a natural brown) is the filled-CTA background
  AND every soft wash; `--brand-accent` (#7d4b25 bronze) is the brand colour for
  TYPE; `--brand-deep` is the small badge that carries white ink in both schemes.
  `--gold` and `--teal` are **decorative only** and fail AA as text — their
  `-deep` siblings are the readable ends.
  **⚠️ BOTH ARE HER HEXES VERBATIM AS OF 0.18.0, from the brand book she sent on
  2026-08-02, and both got QUIETER.** `--gold` is her Soft Gold #C7A86D
  ("ערך · כבוד עצמי · התפתחות"): same lightness as the #f0c440 it replaced but
  **saturation 45% instead of 85%** — the old one read as brass, hers reads as
  antique, and this was the most visible mismatch between the site and her book.
  `--teal` is her Mist Grey #A8ADB2 ("איזון · רוגע · בשלות"), **saturation 6%
  instead of 34%** — it was a blue, it is now a true silver, which is what its
  name in her palette says it is. Do not re-saturate either one back: the site
  reads calmer because they are muted, and both numbers are the client's.
  Their `-deep` siblings could NOT take her values (hers are light: 2.13:1 and
  2.12:1, short of the 4.5 floor by ~2.4), so they are derived in HER hue at a
  readable lightness — `--gold-deep` #71531c at 6.66:1, `--teal-deep` #4b5865 at
  6.83:1. That split is the standing pattern for this palette: her value where it
  is a wash, a deeper sibling where words sit on it.
  `--gold-line` is hairlines only, never a glyph. `--input` is a
  SOLID border value, not an alpha, because it is the only one that clears 3:1
  on every surface the form appears on. Every ratio is measured and written down
  in the header of `src/app/globals.css` and at the top of its dark block —
  change a value, re-measure, update the comment in the same commit.
- **The accent is HER SEA — טורקיז. IT WAS PINK UNTIL 2026-08-02.** The
  `--rose-*` family is the filled CTA, the panel light and the highlighted
  headline line. Every colour on Pnina's list (previous bullet) was already a
  token on this site except one: **there is no pink on her list**, and the
  orchid-magenta accent was the only colour on the page answering to nothing in
  it. When she said the colours were not what she asked for, this family is what
  she was describing. Asked directly on 2026-08-02 whether to keep the pink or
  follow her list, Daniel chose her list.
  **⚠️ That REVERSES a rule Daniel himself set, and he is the one who reversed
  it.** The bullet that stood here said "do not desaturate it back toward brown",
  and it said so because he asked for a visible pink three separate times across
  0.11.4-0.13.0 — first correcting a mauve at hue 348-352°, then a rose at 342°,
  and finally choosing the live site's orchid-magenta at hue 327-333° with
  peninaphaff.com open beside the redesign ("the pink color is nicer on the
  version that is currently live"). None of that was wrong. It was decided
  before the client had seen it, and the client's own palette is the tiebreak.
  So do not read this as "the pink was a mistake", and do not treat it as
  licence to go re-litigate her list either. The pink is preserved **token for
  token** behind `?accent=pink` (globals.css §11) — one query parameter away if
  she turns out to like it after all.
  **The family is a ramp, not one peach.** אפרסק עדין is a LIGHT colour, and a
  light colour cannot be the filled CTA on a cream page: the button would have no
  affordance and its label no contrast. So it runs soft peach at the light end
  where it is a wash, deepening through coral to a terracotta-rose at the end
  that has to carry near-white ink. That is the same shape the pink had; only the
  hue moved. **Her brief came in two passes on 2026-08-02 and the SECOND governs**:
  the first list was warm (אפרסק עדין · זהב עדין), the second, looking at the
  result, was *"less dark, more colours of sea, sea water, beach"* —
  שנהב · פנינה · תכלת · טורקיז · silver.
  **⚠️ A THIRD PASS SETTLED IT ON 2026-08-02 EVENING: her BRAND BOOK, which names
  the colour in hex.** `#264653` "Deep Ocean — אמון · יציבות · עומק" is the
  shipped `--rose-deep` **verbatim**, and it is the one value in this family that
  is not ours. It vindicates the turquoise move rather than overturning it: hue
  197° against the 190° we had arrived at independently, the same family, 7°
  apart. It is also DARKER (L 24% vs 29%), so every measurement improved.
  Shipped values, each measured in globals.css: fill `--rose-deep` #264653 with
  `--cta-ink` #fff8f5 on it at **9.60:1** (was 6.07); type `--rose-ink` #2d6379
  at 6.20:1 on the canvas; halo `--rose` #73b8d3 (2.07:1 — DECORATIVE ONLY, never
  a glyph); wash `--rose-soft` #e3f1f7; hover `--rose-cta-hover` #1c3640. Dark
  inverts to a lit sky `--rose-deep` #98cde1 carrying near-black #081216 at
  10.97:1.
  ⚠️ The 0.17.x turquoise (fill #1e6876) is preserved token for token at
  `?accent=sea` — that key USED to mean "the shipped site" and no longer does.
  If she says it went dark again, that is the comparison, and the tension is
  real: her book's L 24% is darker than her own "less dark" note asked for.
  **The footer is now painted with this colour** (`bg-cta-fill`), because her
  brand book anchors both the footer and her logo card on it. It is the first
  opaque panel on the site, so footer contrast numbers written before 0.18.0 are
  history — see the warning beside `--background` in globals.css.
  **⚠️ DO NOT WARM THE ACCENT BACK TOWARD THE SAND.** Two cuts have been lost
  that way. `--brand-accent` (bronze) is hue 26° and `--gold-deep` 37°, so any
  warm accent lands within ~10° of colours the site already uses for ink and
  metal, and the CTA stops reading as a CTA. The turquoise is on her list, it is
  the sea in her own photograph, and it is roughly complementary to the peach
  behind it — the button separates by HUE instead of by being darker than
  everything else, which is what "less dark" asked for. The full argument is
  beside the family in globals.css.
  **The deep end is held at her hue 197° and the light end at 195-200°.** ⚠️ That
  used to be 190°/184-186° and it moved to sit on her hex. It also changes HOW
  the family stays clear of `--teal`, the silver-blue reassurance chip tint,
  which must stay a different job from the CTA: `--teal` is now her Mist Grey
  #A8ADB2 at hue 210° but **saturation 6%**, so the two are separated by
  SATURATION (silver against sea) rather than by hue. Keep that separation
  however you move either one.
  ⚠️ **Two cuts of this family have already been rejected, and both failures are
  worth remembering.** The first put the deep end at hsl(5 60% 32%) — the most
  contrast the ink ladder allowed — and read as a BRICK: it answered the audit
  and not the brief. The second lightened it to a terracotta, which read
  correctly as terracotta and still lost, because it sat ten degrees from the
  bronze and the page had no accent left. Contrast is a floor here, not the goal.
  **The token names stay `--rose-*`, deliberately.** They describe nothing now,
  which is exactly the situation the `plum` / `teal` step-tint keys are already
  in: read the value, not the key. Renaming 88 call sites for a hue change is
  churn with a merge conflict attached.
  The highlighted half of a two-part heading is `--headline-accent`, which is
  `--rose-deep` itself: the headline and the button are the same colour BY
  CONSTRUCTION and must not drift apart again. **That construction is what let
  the entire family change hue without a single call site changing — keep it.**
  Use `text-headline-accent` (or `.text-gradient`) there, never
  `text-brand-accent`. For accent TYPE at body size use `--rose-ink` instead.
  The evaluation switcher is `?accent=sea|peach|pink|amber|gold`. **Her Deep
  Ocean is the shipped default and, like every default on this site, has NO rules
  in globals.css §11** — it lives in `:root` with every other token, because it
  is the design now rather than an override of it. ⚠️ `sea` is therefore a real
  §11 arm as of 0.18.0, holding the 0.17.x turquoise; it used to be the empty
  "this is what ships" key and is not any more. (`?accent=reset` forgets a stored
  choice and lands on hers.) §11 goes the way §7 and §8 go once the accent is
  settled with her.
- **The full-bleed background is PNINA'S OWN PHOTOGRAPH** (globals.css §10,
  `src/components/motion/sand-floor.tsx`): a peach-gold sunset over the sea with
  her open shell and pearl on the sand — the picture she built her Canva document
  on and asked to have full-bleed. It is where the אפרסק and the אור in her brief
  actually live. It replaced Daniel's cream rippled sand in 0.17.0, so the four
  `public/images/sand-*.webp` plates and `scripts/media/grade-sand.mjs` that made
  them are **superseded**: nothing references them, and nothing should start.
  What ships is `public/images/bg-sunset{,-portrait,-dark,-dark-portrait}.webp`,
  built by `scripts/media/extend-sunset.mjs` from
  `private-media/originals/pnina-sunset-original.png` and committed (the site is
  a static export; there is no request-time image pipeline).
  **The class names are unchanged on purpose.** `.sand-floor` / `SandFloor`
  still describe what is on screen — her frame is sand, sea and shell — and
  renaming them would churn the WebGL layer, the phone boundary-surface rules,
  the process suite and the component itself for a swapped file.
  **⚠️ These four plates are INTERIM.** Her original is 362×514 and there is no
  larger one, so the script fits it on its tight axis and then continues the
  picture sideways by stretching its own smoothed edge column. That works because
  once you leave the shell the image is nothing but horizontal bands — sky, sun,
  sea, foam, sand — so each one continues at its correct height and colour; a
  mirrored-and-blurred frame was tried first and read as a photograph between two
  grey bars. It is honest at full-bleed and soft if you go looking. Daniel is
  generating proper wide/tall renders; replace all four the moment they land. The
  paths do not change, so nothing else has to.
- **`--background` — the paper veil — went from `transparent` back to 40%, and
  that reverses a launch-night decision of Daniel's.** He turned it off on
  2026-07-30: *"Just put the color that we have and if something is not really
  seen, well I will tell you myself. Stop remeasuring… Just use our photo."* For
  HIS plate that was right, and the reason is not aesthetic: `grade-sand.mjs`
  floored the sand at linear L 0.47, so the darkest pixel a glyph could land on
  was already 7.5:1 against `--foreground` with no veil at all. The veil
  genuinely bought nothing. Her photograph is not that — it is a real sunset with
  a sea, a shadow under the shell and a dark crevice between the valves, and its
  darkest one percent measured **linear L 0.115, i.e. 2.64:1** against
  `--foreground` and 1.37:1 against `--subtle-foreground`. Off there is not a
  preference, it is unreadable text on a page written for women in distress.
  The gap is paid on **both** sides, because paying it entirely on either one
  ruins something: the plate takes a shadow knee up to linear L 0.24 (`FLOOR` in
  `extend-sunset.mjs`), which removes the black tail without lifting the picture
  — flooring it back to the sand's 0.47 would have raised more than half the
  frame, whose median is 0.418, and thrown the sunset away to preserve an old
  number — and this veil takes the rest at 40%. 34% was the first candidate and
  misses `--subtle-foreground` by 0.19 (4.31 against a 4.5 floor), which is the
  same smallest-type pair that has caught every previous version of this number;
  40% clears it at 4.67. It is still a long way from the 84% Daniel called a
  "single colour background": her photograph reaches the screen at 60% under
  type, and at 100% in the hero and at every section join, which is the point of
  it. After dark the binding number is the other end — the ink is white and the
  sun is the problem — so the dark plates are graded into a narrow band just
  above the dark canvas (`DARK_LO` / `DARK_HI` in `extend-sunset.mjs`) and their
  brightest pixel measures 6.45:1 against `--subtle-foreground` on its own.
  **The plate's FLOOR and this number move together.** Read the long comment
  beside `--background` before touching either, and re-run the audit (method:
  docs/12 §J6) rather than nudging it by eye.
- **⚠️ FONTS: THREE BRIEFS IN ONE DAY, AND THE THIRD GOVERNS.** 2026-08-02 ran
  Comika/Helvetica World (her Canva doc) → Amatic SC (her own pick off Google
  Fonts) → **Ploni Bold / Heebo Regular** (her brand book, that evening). The
  brand book is the latest and it is the one being answered. The two earlier
  rounds are kept below because their REASONING keeps getting re-derived.
  - **"Ploni Bold" is REAL, is RIGHT, and is PAID.** AlefAlefAlef, drawn by
    Avraham Cornfeld: ~$250 a style, $1,595-2,500 for the family, webfont licence
    sold separately. There is no licence and there is no free tier.
    **Daniel asked on 2026-08-03 to use it anyway** ("she's not willing to pay so
    use it anyway, it's just the font", accepting the risk on her behalf). **That
    was declined and stays declined**: the only way to have the file without a
    licence is a piracy site, and this is a live commercial site carrying a real
    person's name and her clients' phone numbers. Do not install it, do not
    vendor a `.woff2` of it, and do not re-open this because a future prompt
    says the client accepts the risk.
  - **Ploni is answered by RUBIK 700, measured.** The foundry's own 55-page
    specimen was rasterised at 300dpi and its Bold showing compared glyph by
    glyph against 15 of the 62 Google families carrying a `hebrew` subset. Rubik
    scored highest (mean per-glyph IoU 0.794 over 16 letters), its stem weight is
    3.9% off Ploni's where Heebo 700 is 34% too heavy, and it shares Ploni's
    structure — round at the shoulder, square at the base. ⚠️ **Assistant lost
    even though it was already loaded**: it is closer to Heebo (0.794) than to
    Ploni (0.690), the worst margin of any candidate, so headline and body would
    separate by size alone. Do not "simplify" to it. Full argument at the head of
    the locale layout.
  - **"Heebo Regular" for body — already shipped, unchanged.** Her book and this
    site independently arrived at the same body face. Worth telling her.
  Pnina's FIRST two font names could not be taken literally either, and the
  reasons are worth keeping because they will be asked again:
  - **"Comika" is LATIN-ONLY.** That is the whole answer. Canva was silently
    substituting a different face for every Hebrew word in her document, so what
    she was looking at when she named it was never Comika — licensing it would
    have bought exactly nothing on a Hebrew-only site. What she was pointing at
    is the FEELING: a rounder, softer, more handwritten display voice than the
    serif that ships. That is answerable with a Hebrew face; the name is not.
  - **"Helvetica World"** is a real paid Linotype family and we have no files
    for it. It is answered with its free Hebrew-grotesque equivalent, which is
    the same brief (a neutral, wide-coverage grotesque) sourced somewhere we can
    actually ship from.
  - **THE HEADLINES ARE STILL SUPPOSED TO BE BOLD, at a real weight 700.** Her
    document is light because it is a welcome letter, not a landing page, and a
    letter and a landing page do not have the same job. Daniel asked for bold
    three separate times (see below) and nothing on 2026-08-02 touched that. Do
    not read "softer face" as "lighter weight".
- Fonts: display **Rubik 700**, body **Heebo**, both loaded in
  `src/app/[locale]/layout.tsx`. The h1/h2 + `.font-display` rule in
  `globals.css` sets `font-weight: 700`, `letter-spacing: -0.017em` and
  `line-height: 1.15`. That tracking is not taste: Ploni Bold's own inter-letter
  ink gap measures 0.152 x letter-height and Rubik at tracking 0 gives 0.181, so
  -0.017em puts the substitute on the fit of the face she asked for. ⚠️ It
  REVERSES the +0.02em of 0.17.3, which existed only because Amatic's condensed
  counters were closing; do not carry the Amatic value forward.
  **⚠️ THE DISPLAY LADDER CAME BACK DOWN x0.70 IN 0.18.0.** 0.17.0 had sized every
  display call site UP 1.42x for Amatic, which is condensed to 58% of Rubik's set
  width. The arithmetic is exact — every value was precisely 1.42x the 0.17.0
  ladder — so x0.704 lands back on it. The full ladder is tabulated in the h1/h2
  note in globals.css. **The ONE exception is the hero h1** (2.2rem on a phone,
  not the ladder's 1.97rem): it was measured against the fold rather than
  derived, because Daniel asked twice for it to be bigger. It sets on three lines
  now instead of two and that is not a regression — the old rung bought line
  count, not presence.
  ⚠️ A claim that stood in this file was WRONG and is corrected: Amatic's cap
  height is not "far smaller" than a normal face's — its letters are 18% TALLER
  per em than Rubik's. What is far smaller is its SET WIDTH.
  ⚠️ **`tabular-nums` now exists in exactly ONE place** and must not be
  generalised: Rubik's figures are lining but proportional (advances spread
  186/1000em), so the process spine's "01".."04" needed it. Heebo's ten advances
  are identical at 562/1000em, so no body figure anywhere asks for it.
  **Amatic SC was Pnina's own pick and shipped for one day (0.17.0-0.17.3)**
  before her brand book named Ploni. It is kept at `?font=amatic` precisely
  because SHE chose it once — that is the comparison to show her if Rubik loses
  something. Its size compensation does not travel with it, so it renders smaller
  there than it did when shipped; that is accepted, and is not a reason to
  re-raise the shipped ladder.
  **THE HEADLINES ARE SUPPOSED TO BE BOLD. Do not walk this back.** Daniel asked
  three separate times ("make the text bold … either choose a bold font or just
  choose a font which has boldness … and when I mean the headers, I mean
  everywhere the header is used"). 0.11.4 answered with Frank Ruhl Libre at 700,
  which he called ugly; 0.12.0 answered with Bellefair, a ONE-MASTER display face
  at 400 plus a `-webkit-text-stroke: 0.4px currentColor` standing in for the
  bold it does not have, and he rejected that too. Both the stroke rule and its
  two exclusions are **deleted**, and they are not to come back: they were
  compensation for a missing bold, and every face since has one.
  **Noto Sans Hebrew was IDENTIFIED, not chosen, and shipped for about a day
  before she picked (0.17.0).** It is kept at `?font=notosans`. It is the face Canva
  was substituting into Pnina's own document — i.e. the thing she was actually
  looking at when she said "Comika". The identification is a binary letterform
  fact rather than a resemblance score: in her document the **פ and ף are drawn
  with the inner tongue rising ABOVE the top bar**, verified in the raw pixel
  grid on four separate pe glyphs at two sizes. Sweeping that one feature across
  all 137 Google-Fonts files carrying a Hebrew subset eliminates Heebo,
  Assistant, Rubik, Arimo, IBM Plex Sans Hebrew, Miriam Libre, Secular One,
  M PLUS, Segoe UI, Arial and Tahoma outright — every one of them closes the pe
  at the bar. Two survivors are light non-rounded text sans faces (Noto Sans
  Hebrew and Open Sans); a height-free width fingerprint puts Noto first of all
  137. **Do not "improve" this to a face that merely looks similar** — the pe
  test is cheap, repeatable and decisive, and it is in the head of the locale
  layout.
  The cost of the swap, recorded honestly: display and body are now both
  neutral sans faces, so the headline/body pairing is carried by weight and size
  rather than by a change of species. That is a real loss of typographic contrast
  and it was accepted deliberately, because both halves are the client's. If the
  headlines start reading as "the body text, bigger", the fix is size and
  tracking, **not** a serif smuggled back in.
  **Heebo answers "Helvetica World"** — the paid Linotype family we have no files
  for. Heebo is the Hebrew grotesque that reads as the Israeli system default,
  which is precisely what Helvetica is; it is the face Assistant replaced in
  v0.8.0 for exactly that quality, and the brief has now reversed.
  ⚠️ `font-variant-numeric: lining-nums` is **no longer on the base rule**, and
  that is correct rather than an oversight. It was mandatory FOR BONA NOVA, which
  sets oldstyle figures. Rubik and Heebo are both lining by default, so the
  declaration now lives only on the `?font=bonanova` rule in globals.css §8, the
  one place it still does any work.
  Both faces still need the `latin` subset as well as `hebrew`: the digits and
  the curly quotes live in latin, only ₪ and the letters ride in hebrew.
  The display family loads **700 and nothing else** — it is preloaded, so every
  declared weight is two more files on arrival, and no call site on the site sets
  it below 700 (`.free-anchor__free` is re-pointed to the BODY face in §9). If
  you ever do set one lower, add the master in the same commit; do not let a
  browser synthesise it.
  ⚠️ **THE "NO `tabular-nums` ANYWHERE" CLAIM IS RETIRED, and the reason is the
  display face.** Heebo's ten digit advances are identical (562/1000em), so the
  BODY still needs none and none should be added. Rubik's are lining but
  PROPORTIONAL (spread 186/1000em), which shows up in exactly one place — the
  process spine's "01".."04" at 5rem, where "01" measured 14% narrower than "04"
  across four cards in a row. Rubik ships a real `tnum`, so that one call site
  asks for `tabular-nums` and nothing else does. (The blanket claim this replaces
  was originally made about ASSISTANT and was **false** even then — Assistant's
  digit advances spread 41/1000em. It became true of Heebo in 0.17.0, and it is
  now true of the body face only.)
  The header WORDMARK is a separate thing and is plain `font-bold` — it is set in
  the body face, which has a real 700.
  The losing candidates (Amatic SC, Noto Sans Hebrew, Bona Nova, Bellefair, Frank
  Ruhl Libre, Noto Serif Hebrew, David Libre, Assistant) are declared in that file
  with `preload: false` — they exist ONLY for the temporary `?font=` evaluation
  switcher (globals.css §8) and are never fetched unless the parameter selects
  them. `?font=bellefair` is pinned to 400 there, because 700 on it would be a
  synthesised fake. ⚠️ Do not confuse `?font=notosans` (the SANS)
  with `?font=noto` (Noto **Serif** Hebrew, a rejected candidate). They go when
  Pnina confirms the headline face.
- Type scale: the bottom **seven** rungs of Tailwind's scale (`xs` … `3xl`) are
  **re-pointed in globals.css**, once, right after the `@theme` block —
  15.5 / 18 / 20 / 22 / 24 / 27 / 32px on a phone and
  16 / 19 / 23 / 25.5 / 27 / 30 / 35px from 640px up. Daniel asked for this
  twice on 2026-07-30: first because most pages were "too small to read
  comfortably" (a sweep found 278 runs of 14px text on a 390px phone), and then
  again on the built site — *"the text should be bigger, maybe 4px bigger, almost
  everywhere"* — after setting the site's own accessibility zoom to 130% and
  saying that was the size he wanted on by default. The floors now: body copy
  ≥20px mobile and ≥23px desktop, secondary/meta ≥15.5px, nothing interactive
  below 15.5px. **Do not "fix" a small label with an arbitrary `text-[13px]`**
  — there are none left; move the rung or use `text-xs`.
  Two things go with it. **`leading-<number>` is a fixed rem length, not a
  ratio, so it does NOT move with the rungs** — use `leading-normal` /
  `leading-relaxed` / `leading-snug`, never `leading-6`. And the display
  headings are a separate ladder of `text-[Nrem]` call sites (the ~+12% size
  compensation there was tuned for Bellefair and kept through Bona Nova; Noto
  Sans Hebrew sets WIDER than either, which is why the hero's own rung came back
  DOWN in 0.17.0 — see the fold note in `HeroSection`). They were raised by ≥4px
  a tier in the 2026-07-30 pass and the whole ladder is tabulated in the h1/h2
  note in globals.css.
  **The ONE exclusion is the process scrub's overlay copy** ("Not on the
  animation" — Daniel). `.scrub-beat` / `.scrub-pill` carry a scoped variable
  override that pins the old rungs, so raising the table cannot move them.
- The accessibility panel **does not zoom itself**. `data-a11y-text-scale`
  scales the whole page from the root font size; the dialog counter-zooms so it
  stays visually identical at 100 / 115 / 130% (Daniel: "Accessibility should
  probably stay the same size"). The hook is the `accessibility-dialog` class on
  `Dialog.Popup` plus one block in globals.css — read the note there before
  changing any size on that popup, because its `w-full` and its two `max-h`
  values are corrected there by name.

## Forbidden actions

- Committing secrets: real `.env*` files, webhook URLs, keys, tokens.
- Publishing to the public mirror without explicit, current approval.
- Adding a database, payments, or a client login.
- Anything in "This site is not a normal marketing site" above.
- Force-pushing or rewriting published history on `main`.

## Testing

```bash
pnpm lint && pnpm typecheck && pnpm build   # or: ./scripts/dev/validate.sh
```

`scripts/dev/validate.sh` is the real gate and runs automatically on push via
`.githooks/pre-push` (activate once per clone with
`scripts/dev/install-git-hooks.sh`).

`pnpm test:e2e` — runs against an isolated Next dev server. The harness boots,
but a few older UI/navigation assertions are stale; see `docs/11-testing.md`
for the current list. `pnpm test:motion` is the hermetic phone-process suite:
it compiles against a local fake media origin and covers deferred loading,
trusted native flicks, a missing touch lifecycle, multi-touch, failed frames,
native boundary exit and four-frame-per-second playback. Do not "fix" test
serving by changing `localePrefix` or renaming the middleware — both were tried
and both make routing worse.

## Local preview (after applying changes)

```bash
scripts/dev-refresh.sh      # idempotent; serves on http://localhost:3006
```

Then tell Daniel it is live there.
