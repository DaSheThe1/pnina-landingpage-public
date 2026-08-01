# Testing

## The gate

```bash
./scripts/dev/validate.sh     # install --frozen-lockfile, lint, typecheck, build
```

This runs automatically before every push via `.githooks/pre-push` (activate once
per clone with `scripts/dev/install-git-hooks.sh`). Cloud CI is not used.

## End-to-end (Playwright)

The harness runs an isolated `next dev` server and keeps its build output away
from the normal `.next` directory:

```bash
pnpm test:e2e
```

| Spec | Covers |
| --- | --- |
| `accessibility.spec.ts` | axe route scans, preference persistence/migration, focus behavior, reduced motion and fixed-control geometry |
| `contact-api.spec.ts` | bad input, strict-schema rejection, honeypot, unavailable-webhook fallback and health/version |
| `cookie-consent.spec.ts` | Hebrew consent UI, no Google request before opt-in, Consent Mode and withdrawal |
| `lead-form.spec.ts` | validation, the optional question's privacy boundary, successful and failed submission paths |
| `navigation.spec.ts` | header anchors and page links, logo, legal links and mobile menu |
| `process-motion.spec.ts` | stable cold-load geometry, native scroll progress, step transitions, failed video, single-asset media, static gates, reload restoration and neighboring-section readiness |
| `smoke.spec.ts` | every route, headings, console, RTL, alt text, contact details and WhatsApp prefill |

The privacy assertions in `lead-form.spec.ts` and `contact-api.spec.ts` and the
real-contact assertion in `smoke.spec.ts` are load-bearing. Do not trim them.

### Motion suite

Run the phone process tests separately:

```bash
pnpm test:motion
```

The process video and poster are compact same-origin public assets, so the
suite is hermetic without a fake R2 server. It asserts:

- the final phone shell, local poster and step 1 exist before video responds,
  and delayed media cannot shift the following section;
- one translucent dark panel remains present while its four-copy rail crosses
  horizontally, with valid copy at every tested progress value;
- the phone overlay uses the concise visual edition while the semantic story
  remains complete, and desktop keeps the full copy on the physical right;
- a slow 72px held drag advances one adjacent step in either direction, a 20px
  movement stays put, one large multi-finger gesture cannot skip stations, and
  outward gestures from the two endpoint steps still leave the process;
- non-touch releases settle to the nearest step, while a fresh touch replaces
  an in-flight target instead of allowing it to run later;
- a hard phone-sized native scroll distance cannot cross the full `400lvh`
  process, and scrolling is not cancelled, snapped or body-locked;
- failed video leaves the poster, correct copy and following page usable;
- mobile uses one MP4 asset and no WebP frame burst (the browser may issue
  several byte-range requests against that one file while seeking);
- both the in-site reduced-motion choice and Save-Data expose all four static
  cards and make zero process-media requests;
- the page sections on both sides are fully visible before either process edge
  exposes them; their phone surfaces carry a local static sand plate, their
  cards do not sample a backdrop, and no reveal is allowed to make content
  transparent;
- reloading from inside the process starts at the top;
- the back-to-top control remains an immediate native escape.

This is useful Chromium browser-integration coverage, but it is not an iPhone.
The macOS iOS Simulator runs Mobile Safari/WebKit and is the required behavioral
check for root scrolling, sticky behavior and toolbar changes. It still uses the
Mac's CPU, GPU, memory and network, so final decode-speed and memory-pressure
confidence needs a physical iPhone or cloud real-device pass.

### Current broad-suite debt

The 2026-07-31 Chromium run completed with 59 passed, 4 failed, 1 flaky and the
3 isolated motion tests skipped. The remaining failures predate the motion
controller and are stale assertions:

- the closed-menu accessibility test expects `#mobile-navigation` to remain in
  the DOM while the current header does not render it closed;
- the focus test looks for an old header CTA role/name;
- the floating-control geometry test expects a 20px WhatsApp inset while the
  current control is 30px from that edge;
- the anchor-navigation test looks for an old `הליווי` header link;
- the lectures navigation click passed on retry and remains flaky.

Keep this list honest when those tests are updated. Do not call the full suite
green while any of them remains.

## Next production-server limitation

The harness deliberately uses `next dev`. `next start` still cannot serve this
locale shape on Next 16.2.7: next-intl's rewrite becomes a self-referential 307.
Production is unaffected because it is a static export and
`scripts/flatten-locale-export.mjs` hoists `out/he/*` to the root.

Do not retry the two known harmful workarounds:

- changing `localePrefix` from `"as-needed"` to `"never"` creates the loop in
  development too;
- renaming `src/middleware.ts` to `proxy.ts` also creates the development loop.

The structural alternative remains dropping the `[locale]` segment and loading
Hebrew messages directly under `src/app/`; see
[02-site-structure.md](02-site-structure.md).

## Manual verification

```bash
pnpm dev            # http://localhost:3006
```

Check the funnel end to end on desktop and a phone viewport, the lead dialog, a
submission landing on `/thank-you`, and the RTL layout. For the process motion,
also test slow and hard flicks in both directions, stopping between step
boundaries, two- and three-finger movement, pinch zoom, toolbar
expansion/collapse, rotation, refresh from the middle, a cold cache, a failed
video request and background/foreground in the iOS Simulator. A physical
iPhone or real-device service remains the final performance check.
