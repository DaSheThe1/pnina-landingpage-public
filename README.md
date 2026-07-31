# pnina-website

Hebrew landing page for a practice accompanying women who have experienced
sexual assault. One conversion goal: name + phone → a callback for a first
conversation at no cost. A second audience (organisations booking a lecture)
has its own page at `/lectures`.

**Start here:** [`AGENTS.md`](AGENTS.md) for the working rules,
[`docs/00-index.md`](docs/00-index.md) for everything else.
[`docs/01-client-intake.md`](docs/01-client-intake.md) is what the client still
owes us — most of the site is placeholder until she sends it.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind 4 · next-intl (Hebrew, RTL) ·
Zod · Playwright · pnpm 11.5.2.

Production is a **static export** on GitHub Pages, behind Cloudflare, with a
Cloudflare Worker serving `POST /api/contact` and Cloudflare R2 serving the
videos. See [`docs/07-deployment-target.md`](docs/07-deployment-target.md).

## Local development

```bash
pnpm install
cp .env.example .env.local     # nothing real is required to run it
pnpm dev                       # http://localhost:3006
```

The site runs with no configuration at all: no domain, no n8n webhook, no
videos, no photos. Missing media renders designed placeholders and the lead form
reports itself as temporarily unavailable, so you can develop against the real
layout before the client sends anything.

```bash
pnpm lint            # eslint
pnpm typecheck       # tsc --noEmit
pnpm build           # production build
./scripts/dev/validate.sh   # all of the above; also runs on push via .githooks
pnpm test:e2e        # runs; a few stale assertions remain — see docs/11-testing.md
pnpm test:motion     # isolated mobile process-animation regression suite
```

## Where things live

| I want to change… | Edit |
| --- | --- |
| Any visible text | `messages/he.json` |
| Her name, phone, email, domain | `src/config/site.ts` |
| Which images/videos exist | `src/content/media.ts` |
| Prices on the offer ladder | `messages/he.json` → `offers` |
| Colours, type, spacing | `src/app/globals.css` (tokens at the top) |
| Header/footer links | `src/config/navigation.ts` |

Full map: [`docs/05-content-guide.md`](docs/05-content-guide.md).

## Before launch

See the checklist at the end of
[`docs/05-content-guide.md`](docs/05-content-guide.md). Nothing goes live
without Daniel's explicit go-ahead — publishing is a manual step, never
automatic (see `AGENTS.md`).
