# Content guide — where everything goes

Every piece of content maps to exactly one file. The site runs and looks
finished with placeholders, so content can arrive in any order.

> All visible Hebrew lives in **`messages/he.json`**, keyed by section. Edit the
> string values; don't add or remove keys without changing the component too.

## 1. Identity — `src/config/site.ts`

| Field | Now | Action |
| --- | --- | --- |
| `name`, `legalName`, `monogram` | `פנינה פאף` / `Penina Phaff` / `פ` | ✅ confirmed |
| `founder.role` | `PLACEHOLDER_תפקיד` | ⚠️ her exact title — see the legal note in [01-client-intake.md](01-client-intake.md) |
| `email`, `phone`, `phoneE164`, `whatsappUrl` | her real details | ✅ confirmed; powers `tel:`, WhatsApp, and the footer |
| `DOMAIN` (→ `domain`, `url`) | `peninaphaff.com` | ✅ **the** host. One constant; `url`, every canonical/og:url, the sitemap and `public/CNAME` all derive from it — see [07-deployment-target.md](07-deployment-target.md) |
| `profiles.*` | empty | optional; empty ones are simply not rendered |
| ~~`crisisLine`~~ | removed | the 1202 footer line was taken out at Daniel's request — do not re-add. See §3 of [03-open-decisions.md](03-open-decisions.md) |

## 2. Copy — `messages/he.json`

| Key | Where it renders |
| --- | --- |
| `hero` | top of the homepage — headline, subtitle, CTAs |
| `servicesTeaser`, `services` | the "what the accompaniment is" block (`#approach`) |
| `offers` | the "מהצדפה אל הפנינה" ladder — `offers.intro` is the free שיחת היכרות (rung 0, the only button), `offers.items` the two tracks |
| `process` | the four steps (`#process`) |
| `why` | the four commitments (also used on `/about`) |
| `trustBand` | the pull-quote strip |
| `testimonials` | the carousel — **read [04-testimonials-policy.md](04-testimonials-policy.md)** |
| `founder` | the about teaser on the homepage |
| `faq` | the FAQ (`#faq`) |
| `finalCta`, `contactForm` | the form (`#contact`) and the popup |
| `lectures`, `pages.lectures` | the whole `/lectures` page |
| `pages.about` | `/about` — her story, credentials, quick facts |
| `pages.thankYou` | `/thank-you` |
| `pages.privacy`, `pages.terms`, `pages.accessibility` | the legal pages |
| `nav`, `header`, `footer`, `common` | global chrome |
| `whatsapp` | the opening line every WhatsApp button pre-fills, in ONE place. Every button on the site renders `<WhatsAppLink>`, so editing `whatsapp.message` changes all six. Never link a bare `wa.me` URL — it opens an empty chat and makes the visitor find her own opening words |
| `og` | the social share card |

Strings still containing the word `PLACEHOLDER` are ones we invented as scaffolding
and that she must approve or replace. Find them all with:

```bash
grep -n "PLACEHOLDER" messages/he.json src/config/site.ts
```

## 3. Numbers and prices

- **Prices** → `messages/he.json` → `offers`. Three, all hers:
  `offers.intro.valuePrice` (₪490, what the free שיחת היכרות is worth) and
  `offers.items[].price` (₪990 / ₪2,880). Type `₪` BEFORE the digits — the
  component wraps each one in `<bdi>` so RTL cannot re-order it.
- **Stats** → gone. The placeholder strip was deleted in v0.9.0; there are no
  counters on this site. Do not invent any — see `AGENTS.md` rule 3.

## 4. Images and videos — `src/content/media.ts`

One registry for everything. A `null` src renders a designed placeholder rather
than a broken image, so nothing looks unfinished. Details and naming:
[06-media-and-cdn.md](06-media-and-cdn.md).

| Slot | What it is |
| --- | --- |
| `media.logo` | header/footer mark — optional; the monogram is a finished design |
| `media.founderTeaser` | portrait on the homepage |
| `media.aboutPortrait` | larger portrait on `/about` |
| `media.lecturesPortrait` | ideally her speaking to a room — this is what sells talks |
| `gallery` | optional photo gallery; empty = the section removes itself |
| `testimonialShots` | testimonial screenshots — policy applies |
| `videos.hero`, `videos.thankYou`, `videos.about` | each clip's local file and its filename in the R2 bucket. Read them through `videoSrc(key)`, never `videos[key].src` |

## 5. Look and feel

Design tokens are at the top of `src/app/globals.css`, with a contrast note
explaining which rose is safe for text. Fonts are set in
`src/app/[locale]/layout.tsx` (Assistant for body, Frank Ruhl Libre for
headlines).

## Before launch

- [ ] Every `PLACEHOLDER` replaced (`grep -rn PLACEHOLDER src/ messages/`)
- [ ] Domain bought and set in all four places ([07](07-deployment-target.md))
- [ ] Her professional title confirmed, and matching wording in `pages.terms`
- [ ] Prices confirmed (they are hers as of v0.7.0), and the two
      "מתאים לך אם…" lines on the ladder confirmed by her
- [ ] Real testimonials + consent, then Pnina flips `testimonialsAreSamples`
- [ ] Photos and both videos, or a conscious decision to launch without them
- [ ] n8n workflow live and the form tested end to end ([10](10-n8n-lead-workflow.md))
- [ ] Favicon added (`src/app/icon.png`) — the template's was removed
- [ ] The privacy page's "עוגיות וכלי מדידה" section matches the trackers
      actually configured in `.github/workflows/deploy-pages.yml` — verify
      against that file, not against what was planned
      (`grep -nE 'NEXT_PUBLIC_(GA_ID|UMAMI)' .github/workflows/deploy-pages.yml`)
- [ ] Social share image checked for Hebrew rendering ([03](03-open-decisions.md) §8)
- [ ] Privacy, terms and accessibility text reviewed by someone qualified
- [ ] Accessibility statement states what is actually true ([09](09-accessibility.md))
