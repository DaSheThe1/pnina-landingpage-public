# Agent playbook — pnina-website

Read this file plus `README.md` and `docs/00-index.md` before editing.

## Project summary

Hebrew-first landing page for **PLACEHOLDER_שם_מלא**, who accompanies women who
have experienced sexual assault. One goal: get a woman to leave a name and a
phone number so she can be called back for a first conversation at no cost.
A secondary audience — organisations booking a lecture — has its own page and
its own CTA (`/lectures`).

Next.js App Router + TypeScript + Tailwind 4 + next-intl, pnpm, Playwright.
**Hebrew-only** (single `he` locale, RTL, served at the root). No database, no
payments, no client area. Scaffolded from the `yarin-landingpage` template; the
next-intl machinery stays so English can be added later.

**The client has not delivered most of her content yet.** Everything she still
owes is tracked in `docs/01-client-intake.md`, and every unconfirmed value in the
code is a loud `PLACEHOLDER_*`. Do not invent replacements for them.

## This site is not a normal marketing site

The people this site is built for arrive after a sexual assault, often in
distress, sometimes on a device someone else can see. That changes what "good"
means here, and these rules are not stylistic preferences:

1. **Never add a free-text field to the lead form.** Name and phone, nothing
   else. A "tell me a bit about what happened" box would create a permanent
   record of the most sensitive thing a person could write, sitting in an n8n
   execution log. See the header comment in `src/lib/contact-schema.ts`.
2. **Never present invented testimonials as real.** `testimonialsAreSamples`
   stays `true` until real, consented quotes replace the placeholders. Fabricated
   testimony about trauma is not a marketing shortcut. Read
   `docs/04-testimonials-policy.md` before touching anything testimonial-shaped.
3. **Never invent numbers.** Every stat in `src/content/stats.ts` is `0` and the
   section hides itself while they all are. "עזרתי ל-200 נשים" is a claim about
   real people; if it is not true it is a cruel lie. Only Pnina supplies these.
4. **No pressure mechanics.** No countdown timers, no "only 2 spots left", no
   flashing discounts. The template's always-on pulsing price animation was
   removed for exactly this reason (it also overrode `prefers-reduced-motion`
   with `!important`). The price funnel itself is fine — anchor, strike, free —
   it just does not throb.
5. **Honour `prefers-reduced-motion` with no exceptions.** No `!important`
   escapes in `globals.css`. Nothing on this site animates meaning.
6. **No session-replay or form-capture analytics, ever.** Not Hotjar, not
   Clarity, not FullStory. Recording what these visitors read or type is a
   serious breach. `AnalyticsEvent` in `src/lib/analytics.ts` is a closed union
   of four events carrying no data — keep it that way.
7. **No stock imagery of distressed women.** Missing photos render a calm
   monogram panel; that is better than a stock photo of someone crying.
8. **Keep the crisis line.** `siteConfig.crisisLine` puts 1202 in the footer.
   This is a private practice with a callback delay, not a 24/7 service, and
   saying so costs the funnel nothing. Removing it is Pnina's call, not an
   agent's — flip `enabled` only if she asks.

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
- `src/config/` — `site.ts` (identity, all the PLACEHOLDERs) and `navigation.ts`.
- `src/content/` — structure only, matched by index to `messages/he.json`.
  **`media.ts` is the single registry of every image/video the client owes**;
  a `null` src renders a designed placeholder rather than a broken image.
- `src/lib/` — env access (`env.ts`), contact schema, seo, analytics, version.
- `messages/he.json` — **all** user-facing copy. Never hardcode Hebrew in a
  component; add a key.
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
- Design tokens: `--brand` is **decorative only** (fails AA as text);
  `--brand-accent` is the rose for type; `--brand-deep` is the filled-CTA
  background. Same split for sage. See the header of `src/app/globals.css`.

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

`pnpm test:e2e` — **currently blocked by a harness bug, not a site bug.** See
`docs/11-testing.md`. The specs are written and correct; the Playwright web
server cannot boot the app. Do not "fix" it by changing `localePrefix` or
renaming the middleware — both were tried and both make it worse.

## Local preview (after applying changes)

```bash
scripts/dev-refresh.sh      # idempotent; serves on http://localhost:3006
```

Then tell Daniel it is live there.
