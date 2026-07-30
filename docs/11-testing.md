# Testing

## The gate

```bash
./scripts/dev/validate.sh     # install --frozen-lockfile, lint, typecheck, build
```

This runs automatically before every push via `.githooks/pre-push` (activate once
per clone with `scripts/dev/install-git-hooks.sh`). Cloud CI is not used —
Actions minutes are reserved for the public repo's Pages deploy.

## End-to-end (Playwright)

Four specs in `e2e/`, written and reviewed but **not currently runnable**:

| Spec | Covers |
| --- | --- |
| `smoke.spec.ts` | every route renders, one `<h1>` each, no console errors, `lang`/`dir`, alt text on every image, the real contact details are in the footer |
| `navigation.spec.ts` | header anchors scroll into the funnel, page links, logo home, all three legal links, mobile menu |
| `lead-form.spec.ts` | dialog open/close/Escape, validation, a valid lead reaching `/thank-you`, **that the payload carries no field beyond name/phone/source/language/company**, the lectures CTA tagging its source, and a server failure keeping the visitor on the form |
| `contact-api.spec.ts` | the API contract: bad input, strict-schema rejection of unknown fields, honeypot, the 503-with-an-email path, health |

Two of these are worth keeping even if the suite is ever trimmed: the payload-key
assertion in `lead-form.spec.ts` enforces the privacy boundary from `AGENTS.md`
in code, and the footer-contact assertion in `smoke.spec.ts` guards against a
regression to the scaffold's placeholder phone number, which would send every
enquiry to a stranger. (The crisis-line assertion that used to be named here is
gone with the crisis line itself — see the note at `e2e/smoke.spec.ts:61`.)

**Two specs are stale as of v0.6.0** and will fail once the harness is fixed:
`navigation.spec.ts` follows a `/lectures` nav link that no longer exists (the
route is deliberately unlinked and noindexed until Phase 1), and both it and
`smoke.spec.ts` still visit `/lectures` directly, which is fine. They are left
untouched rather than half-fixed against a harness nobody can run — updating
them belongs with the Phase 1 work that puts the link back.

## ⚠️ Known issue: the harness cannot start the app

`pnpm test:e2e` fails with `Timed out waiting 240000ms from config.webServer`.
The specs are fine; the web server never becomes ready.

**Cause.** next-intl's middleware rewrites `/x` to `/he/x` internally. Under
`next start` on Next 16.2.7 that rewrite comes back to the client as a `307` to
the *original* path — an infinite redirect loop on every URL. The response
carries both `x-middleware-rewrite` and a self-referential `location` header.

**Things already tried, that made it worse — do not repeat them:**

- `localePrefix: "never"` instead of `"as-needed"`. Looks like the tidier setting
  for a single-locale site; it produces the same 307 loop **in dev as well**, so
  it breaks the one environment that currently works. Reverted.
- Renaming `src/middleware.ts` to `src/proxy.ts`, as Next 16's deprecation
  warning asks. Under the proxy convention the loop appears in dev too.
  Reverted, and there is now a comment in `middleware.ts` saying so.
- Pointing the harness at `next dev` instead of `next build && next start`. Dev
  serves the site correctly by hand, but the harness still times out — this is
  where the investigation stopped.

**Why it does not affect the site.** Production is a static export with no
middleware at all: `scripts/flatten-locale-export.mjs` hoists `out/he/*` to the
root at build time, so the deployed site has no rewrite to get wrong. `pnpm dev`
on port 3006 serves every route correctly, which is how the build was verified.

**Likely real fix.** Drop the `[locale]` segment and render Hebrew directly from
`src/app/`, keeping next-intl purely as a message loader. That removes the
middleware, the flatten script and this entire class of bug, at the cost of
making a future English version a real refactor rather than a config change. See
[02-site-structure.md](02-site-structure.md).

## Manual verification in the meantime

```bash
pnpm dev            # http://localhost:3006
```

Check: the funnel end to end on desktop and on a phone viewport, the lead dialog,
a submission landing on `/thank-you`, and the RTL layout. The build was verified
this way — all 8 routes, desktop and mobile, console clean.
