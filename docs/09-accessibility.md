# Accessibility

## The obligation

Israeli regulations — תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות
לשירות), which point at the ת"י 5568 standard (itself based on WCAG 2.0 AA) —
require a business website serving the Israeli public to be accessible and to
**publish an accessibility statement** naming a route for reporting problems.

`/accessibility` exists for this. Its copy lives in `pages.accessibility` in
`messages/he.json`.

> ⚠️ **The statement currently contains PLACEHOLDERs and must not go live as-is.**
> An accessibility statement that overstates conformance is worse than none: it
> tells a disabled visitor that the problem is theirs. State only what has
> actually been verified, with the date it was verified and a real contact.

## What the build already does

- Semantic landmarks (`banner`, `main`, `contentinfo`, `navigation`) and a single
  `<h1>` per page.
- RTL throughout, with `lang="he"` and `dir="rtl"` set from the locale config.
- `prefers-reduced-motion` honoured with **no exceptions** — no `!important`
  escapes anywhere in `globals.css`. This matters more than usual here: an
  audience that may include people with trauma-related vestibular or anxiety
  symptoms is exactly who that media query exists for.
- Colour tokens split by role so text never lands on a failing contrast: `--brand`
  is decorative only, `--brand-accent` is the AA-safe rose for type. See the
  header of `src/app/globals.css`.
- The site follows the reader's **dark-mode preference** automatically
  (`prefers-color-scheme`), with no in-page toggle to find. The same role split
  holds in dark — every ink token was re-picked against the dark canvas and the
  measured ratios are listed in the DARK block at the bottom of `globals.css`;
  the AA floor is `--subtle-foreground` at 5.7:1. Reading a page like this one at
  night, on a phone, is a normal way to arrive here, so this is an accessibility
  feature and not a styling one.
- Alt text required on every image via the `media.ts` registry.
- Form fields have real `<label>`s, and errors are associated and announced.
- Focus-visible rings on all interactive elements.

## What still needs verifying before launch

- [ ] Keyboard-only pass: every CTA, the mobile menu, the lead dialog (focus trap
      and Escape), the testimonial carousel, the FAQ accordion.
- [ ] Screen-reader pass in Hebrew (NVDA or VoiceOver), checking heading order
      and that the dialog announces itself.
- [ ] Automated audit (axe / Lighthouse) on every route.
- [ ] Contrast re-check against the final palette, especially the rose on sand —
      **in both schemes**.
- [ ] Zoom to 200% without horizontal scrolling.
- [ ] Then write the real conformance level and date into
      `pages.accessibility.sections`, and name an accessibility contact.
- [ ] Add the physical-access details (§ "הסדרי נגישות בשירות") — is the meeting
      space accessible, is a remote session available.

The `smoke.spec.ts` e2e suite already asserts one `<h1>` per page and alt text on
every image, so the structural basics stay honest once the harness runs again
([11-testing.md](11-testing.md)).
