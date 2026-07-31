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
| `process-motion.spec.ts` | phone entry/state sequencing, repeated input, slow rAF, failed frames, exit and back-to-top |
| `smoke.spec.ts` | every route, headings, console, RTL, alt text, contact details and WhatsApp prefill |

The privacy assertions in `lead-form.spec.ts` and `contact-api.spec.ts` and the
real-contact assertion in `smoke.spec.ts` are load-bearing. Do not trim them.

### Motion suite

Run the phone process tests separately:

```bash
pnpm test:motion
```

That command compiles the app against a tiny local media origin owned by the
spec. It never reaches the live R2 bucket. The suite asserts:

- sequence detail stays deferred until the process approaches;
- hard touch and iOS Simulator wheel entry from above stop at step 1;
- the process stage remains sticky inside the native document rather than
  becoming a fixed overlay over a frozen body;
- one trusted phone flick moves one adjacent station;
- two- and three-finger vertical drags cannot buy a station;
- rapid repeated touch and wheel input is discarded during playback and never
  queued after settlement;
- fresh gestures traverse all four stations, reverse one station at a time and
  exit only after the endpoint act completes;
- fresh outward gestures leave natively from both endpoint stations;
- a missing touch-end lifecycle cannot poison the next native gesture;
- four rAF callbacks per second still finish an act in wall-clock time;
- failed intermediate frames cannot prevent the native boundary exit;
- the back-to-top control remains an immediate native escape.

This is useful Chromium browser-integration coverage, but it is not an iPhone.
The macOS iOS Simulator runs Mobile Safari/WebKit and is the required behavioral
check for root scrolling, snap behavior and toolbar changes. It still uses the
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
also test a hard flick, rapid repeated flicks during playback, reverse movement,
outward exit from both end stations, multi-touch, pinch zoom, toolbar
expansion/collapse, orientation change and background/foreground in the iOS
Simulator. A physical iPhone or real-device service remains the final
performance check.
