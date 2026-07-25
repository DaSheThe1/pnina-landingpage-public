# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html);
see `AGENTS.md` for the bump rules.

## [0.3.2] - 2026-07-26

The videos move to the CDN, and the site goes public.

### Changed
- `NEXT_PUBLIC_MEDIA_BASE_URL` is set to **https://media.trickticmedia.com**, the
  custom domain on the R2 bucket. Verified against a real CI-shaped export: every
  `<source>` in the emitted HTML points at R2, and both objects answer with
  `206 Partial Content` and `accept-ranges: bytes`, so seeking works.
- The publish mirror now excludes `public/video/`. Production never serves those
  files — they are the dev fallback — and 11 MB of MP4 in a public repo's
  permanent history is not worth carrying. It also cuts the deployed artifact
  from 17 MB to 6 MB.

### Deployment
- **The site is live at https://pnina.trickticmedia.com.** First publish of the
  public mirror; Pages enabled with GitHub Actions as its source, custom domain
  set, certificate issued, HTTPS enforced. The hero video plays from R2 on the
  live page (`readyState: 4`, 720×1280) and no request on the page 4xxs.
- The Worker was redeployed so production validates phone numbers the same way
  the site does. It had been running the pre-0.3.0 length check.
- **Outstanding: the DNS record is still DNS-only (grey cloud), so the lead form
  does not work yet.** A Worker route only fires on proxied traffic, so
  `POST /api/contact` is answered by Pages with a 405. Grey was required for
  GitHub to issue the certificate; that is done, so the record can be flipped to
  proxied now. See the runbook in `docs/07-deployment-target.md`.

## [0.3.1] - 2026-07-25

The site can now honestly claim WCAG 2.1 AA, which its accessibility statement
has to state under ת"י 5568. Audited with axe-core against the real production
export — 8 pages × 2 viewports — and it comes back with **zero** violations,
WCAG and best-practice alike. It was 86 contrast failures per viewport before.

### Fixed
- **`--subtle-foreground` was `#9a8290`: 3.25:1 on the cream canvas**, used at
  12px for the footer's section labels, the copyright line and the legal pages'
  meta. A straight AA failure on the smallest type on the site. Darkened to
  `#7a6671` (4.9:1), still visibly lighter than `--muted-foreground` so the ink
  ladder is intact.
- **The footer's WhatsApp link was WhatsApp green on cream — 1.8:1.** Effectively
  invisible to anyone with low vision. The tile behind the glyph keeps the brand
  colour; the type is now a darkened green at 5:1.
- The logo in the header and footer carried `alt="פנינה פאף"` while her name sat
  in text right beside it, so a screen reader announced it twice on every page.
  The mark is decorative in that lockup and is now `alt=""`.
- The floating WhatsApp button sat outside every landmark, so anyone navigating
  by landmark skipped it entirely. Wrapped in a labelled `complementary`.

## [0.3.0] - 2026-07-25

Real phone validation, a real terms page, and a process section that fits on a
screen.

### Added
- **`NEXT_PUBLIC_MEDIA_BASE_URL`** — the public base URL of the R2 media bucket.
  One value now covers every video: each clip's filename lives beside its slot in
  `src/content/media.ts`, and `videoSrc()` resolves override → bucket → bundled
  file → poster panel. `NEXT_PUBLIC_ABOUT_VIDEO_URL` joins the two per-clip
  overrides for the /about video, which previously could only be served locally.
- Her photo now appears beside her name in the header and the footer.
- A reviews link in the header.

### Changed
- **The phone field is validated against the Israeli numbering plan.** It used to
  accept anything with 7 to 15 digits, so `123456789` sailed through and nobody
  found out until she dialled it. Mobile (`05X`), virtual/VoIP (`07[2-9]`) and
  landline (`0[23489]`) prefixes are checked, `+972`/`00972` forms are accepted,
  and everything else is rejected. Non-Israeli numbers are now rejected too — see
  the note in `src/lib/contact-schema.ts` for why, and for the one line to change
  if that ever needs widening.
- **Leads reach n8n with a normalised phone** (`054-754-7452`, `+972 54 754 7452`
  and `00972547547452` all arrive as `0547547452`), so the workflow can dial or
  build a `wa.me` link without parsing anything.
- **The process section is four cards in a row on desktop instead of four
  full-width rows.** The rows could not collide, but they made the section four
  screens tall, which defeats the point of "four steps, no surprises". Below
  `lg` they fall to two columns and then one.
- **Terms of use rewritten** as a standard Israeli site's terms: scope,
  what the service is and is not, enquiries, permitted use, IP, privacy,
  liability, third-party services, accessibility, changes, governing law and
  contact. The "this site is not an emergency service" section is gone, at
  Daniel's request.
- The header's fifth slot is the reviews; the FAQ keeps its anchor and its
  footer link.

### Fixed
- **The header nav overlapped the Instagram button at 768px.** The centred nav
  is absolutely positioned, so it slides under the logo and the buttons instead
  of pushing them. It now appears at `lg`; tablets get the mobile menu.
- **The lead form's labels were not attached to their inputs.** "שם" and "טלפון"
  sat beside their boxes with no `htmlFor`/`id` pair and no wrapping `<label>`,
  so they were decoration: a screen reader announced two unlabelled text fields,
  and tapping the word did not focus the box. The label wraps the control now,
  and the error line is a live `role="alert"`.
- **The lead dialog announced two identical "סגירה" buttons.** Its backdrop was
  a labelled button sharing a name with the real close button in the corner —
  and, being first in the DOM, it was what "the close button" resolved to for
  anything scripted. The backdrop is presentational now; Escape and the corner
  button cover every keyboard and screen-reader path. Six e2e tests that had
  been failing on this pass again.
- **Two sources of horizontal scroll on a phone.** The testimonials section's
  46rem halo was unclipped, giving a 390px viewport 173px of sideways scroll —
  which is why the page appeared shifted and cut off. The video frame's halo did
  the same on /about. Every page now measures `scrollWidth === clientWidth` at
  390px.
- `e2e/navigation.spec.ts` read `page.url()` immediately after a click, racing a
  client-side navigation. It uses `toHaveURL` now, which retries.

**The e2e suite is green for the first time: 34/34.** It had been 24/33, and
every one of those failures was the suite correctly reporting a real defect in
the form and the dialog rather than a harness problem.

## [0.2.0] - 2026-07-25

The site gets an address. Everything that referenced a placeholder domain now
points at **pnina.trickticmedia.com** — a subdomain of an existing Cloudflare
zone, chosen so launch does not wait on buying a `.co.il`.

### Added
- `public/CNAME` — the Pages custom domain, deployed with the export so the
  domain survives every redeploy.

### Changed
- `siteConfig.domain`/`url`, the Pages workflow's `NEXT_PUBLIC_SITE_URL`, the
  Worker's route/`zone_name`/`SITE_ORIGIN`, and both `.env` examples now carry
  the real host. Canonical tags, `sitemap.xml`, `robots.txt` and the OG/schema
  URLs come out of the build pointing at it.
- `public/llms.txt` — real name, description and contact address instead of
  placeholders, plus an explicit line that this is accompaniment and not
  regulated psychotherapy.
- `docs/07-deployment-target.md` — a step-by-step go-live runbook, and a warning
  about the DNS-only/proxied ordering (see below).

### Fixed
- The Worker's failure message told visitors to email `PLACEHOLDER@example.com`.
  If the n8n webhook were ever down, every lead would have been sent to a dead
  address. It now uses her real one.
- **A testimonial screenshot showed the sender's Instagram handle.**
  `review-3.jpg` had `@adiavrahami1` legible in the corner — a real, findable
  person, published permanently, next to a message about recovering from sexual
  assault. The handle is now blurred out; the unedited original is in the
  git-ignored `private-media/`.
- The publish leak gate's Israeli-phone-number check had never run. `tr -d '+- '`
  reads as a reversed character range, so `tr` errored, the result came back
  empty, and every number passed. Fixed, and confirmed to catch an injected one.
- `.env.example` had picked up the real dev n8n webhook URL. That file is
  committed *and* mirrored publicly; the URL is back to a placeholder.

### Added (publishing safety)
- The leak gate now stops and lists every testimonial screenshot before it can
  publish, and requires `PUBLISH_SHOTS_REVIEWED=1` to continue. Text greps
  cannot see a handle burned into a JPEG — only a person can.

### Deployment notes
- The Cloudflare record must be **DNS-only** until GitHub issues the TLS
  certificate, then **proxied** before launch: a Worker route only fires on
  proxied traffic, so `/api/contact` — the lead form — returns Pages' 404 while
  the record is grey.

## [0.1.0] - 2026-07-25

First scaffold. The site runs, looks finished, and is safe to show — but almost
all of its content is placeholder until the client sends her material
(`docs/01-client-intake.md`).

### Added
- Single-page lead funnel at `/` — hero + video frame, the accompaniment, the
  price funnel ending at a free first conversation, the four-step process,
  reassurance band, testimonials, about teaser, FAQ, and the lead form.
- `/lectures` — a separate page for organisations booking a talk, with its own
  CTA. Leads from it are tagged `source: "lectures"` so they can be answered
  differently.
- `/about`, `/contact`, `/thank-you`, `/privacy`, `/terms`.
- `/accessibility` — an accessibility statement, required of an Israeli business
  website (תקנות שוויון זכויות; ת"י 5568).
- A discreet link to the 1202 sexual-assault crisis line in the footer, since
  this site is a private practice with a callback delay, not a 24/7 service.
- `src/content/media.ts` — one registry of every image and video the client
  still owes. Missing media renders a designed placeholder instead of a broken
  image, so the site is presentable at every stage.
- Cloudflare R2 media CDN support for both videos
  (`NEXT_PUBLIC_HERO_VIDEO_URL`, `NEXT_PUBLIC_THANK_YOU_VIDEO_URL`).
- Public-mirror publish script with a leak gate that blocks private keys, real
  webhook secrets, unrecognised Israeli phone numbers, and unregistered
  testimonial screenshots.

### Changed (from the `yarin-landingpage` template it was scaffolded from)
- New warm, light design system (sand · rose · sage) replacing the template's
  dark black/gold one, tuned for a calm rather than premium register.
- Body type moved to **Assistant**, a Hebrew-native face. The template loaded
  Inter with the Latin subset only, so every Hebrew character — i.e. the entire
  page — silently fell back to the device default.
- The lead schema was cut down to name + phone + source. The template's
  qualification fields (business name, goals, tools, free text) were removed;
  this site deliberately never asks a visitor to type anything about herself.
- Removed the always-on pulsing price animation. It read as sales pressure and
  it forced itself through `prefers-reduced-motion` with `!important`.
- Removed the per-letter animated hero headline in favour of a still one.
- Testimonials ship flagged as samples with a visible notice.

### Fixed (bugs inherited from the template)
- `rgba(…)` values written with spaces inside Tailwind arbitrary values parsed
  as several class tokens and emitted no CSS, so a number of background glows
  never rendered at all.
- Duplicate React keys where list items were keyed by their (repeating) text.
- The template author's own portrait was shipping as this site's favicon and
  apple-touch icon.

### Known issues
- `pnpm test:e2e` cannot start its web server. The specs are written; the
  harness is blocked by a Next 16 + next-intl interaction. Does not affect the
  site itself. See `docs/11-testing.md`.
