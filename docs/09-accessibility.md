# Accessibility

The site uses native, testable accessibility features. The floating preferences
button is a convenience layer; it does not replace semantic markup, keyboard
support, testing, or human review.

The engineering baseline is Israel Standard SI 5568 Part 1 at the applicable AA
level, with WCAG 2.2 AA used as a stricter development and automated-test
baseline. This is not a certification or legal guarantee.

## Architecture

- `src/components/accessibility/accessibility-provider.tsx` owns five
  preferences: 100/115/130% text, enhanced contrast, comfortable spacing,
  reduced motion, and emphasized links. It validates a versioned
  `penina-accessibility` localStorage object and sends nothing to analytics or
  the server.
- `a11y-boot-script.ts` reads those preferences before first paint. It shares
  its storage key and version with the provider, and stamps **only a stored,
  explicit choice**. It does not consult the operating system's
  `prefers-reduced-motion` setting, so a visitor who has never opened the panel
  is stamped `data-a11y-reduce-motion="false"` and the site animates for her.
- `accessibility-launcher.tsx` uses the installed Base UI dialog primitive for
  focus containment, Escape, background inertness, and focus restoration.
- `skip-link.tsx` targets `#main-content`; `PageShell` supplies that focusable
  landmark on every route.
- `src/components/motion/use-reduced-motion.ts` reports the saved site choice,
  and nothing else. Imperative timers, rAF work, smooth scrolling, carousel
  progression, the pearl scrub and the hero clip all use that result;
  `prefersReducedMotion()` in `src/lib/eval-flags.ts` answers the same question
  outside the React tree, off the same `data-a11y-reduce-motion` attribute.

### The motion contract (2026-07-30)

Site motion plays for **every** visitor by default. The device's
`prefers-reduced-motion` signal is deliberately not read anywhere: it does not
suppress anything and does not seed anything. Daniel's decision, stated twice
that day: "Usually we want animations on by default. We don't want the clients
to override it by default using the browser thing," and, of the panel control,
that reduced motion "should be off by default".

The accommodation is the site's own **"הפחתת תנועה"** switch. It starts off for
everyone, it is stored per browser, it is applied before first paint by the boot
script, and turning it on gives the complete static rendering: reveals arrive
already visible, the process section stays as four static cards and downloads no
frames, the sand ripple and cursor layers never mount, and the hero clip pauses.
The accessibility statement in `messages/he.json` says exactly this; the copy and
the behaviour change together.

Save-Data and connection-aware gating for heavy assets is unaffected — that is
about bytes, not motion.
- `src/app/globals.css` contains the attribute-driven visual preferences. The
  high-contrast mode overrides tokens rather than filtering media, and Hebrew
  spacing never forces letter spacing.

## Underlying behavior

- The lead dialog and gallery lightbox use Base UI modal behavior.
- The closed mobile menu is `inert` and `aria-hidden`; Escape closes it and
  restores focus to the menu button.
- Form fields use native required state, `aria-invalid`, associated error
  descriptions, and first-invalid-field focus.
- WhatsApp and accessibility launchers are mirrored at the same 56px size and
  bottom baseline on opposite logical sides. Both move together above the
  cookie choice while it is visible; back-to-top is removed from that temporary
  stack. Safe-area bottom spacing is preserved.
- The preferences dialog is a compact bottom sheet on phones and a centered
  modal on larger screens. Paired cards retain the same padding, pinned
  line-height, and two-column geometry at ordinary phone widths. They reflow to
  one column only at 320px-class widths or at 130% text on a phone, where the
  rem-scaled stepper otherwise cannot fit without overlapping its neighbor.
- Semantic landmarks, one `<h1>` per route, Hebrew `lang`/RTL direction, image
  alternatives, and visible focus remain part of the baseline.

## Testing

`e2e/accessibility.spec.ts` runs `@axe-core/playwright` against representative
routes and covers skip focus, menu/modal keyboard behavior, form errors,
preference persistence/reset/migration, reduced carousel motion, fixed-control
alignment and overlap, pre-paint restoration, and 320px reflow at 130% text.

Automated tools cannot establish complete conformance. Record manual keyboard,
zoom, contrast, forced-colors, and assistive-technology checks separately and
name a screen reader only when it was actually used.

## Known owner inputs

- The public accessibility statement uses the real business email and phone.
- A separately named accessibility coordinator has not been supplied; reports
  currently go to Pnina.
- Verified physical accessibility arrangements for in-person meetings have not
  been supplied. The statement says so and directs visitors to ask for an
  appropriate arrangement instead of inventing details.
