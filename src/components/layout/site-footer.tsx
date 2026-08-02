import { ArrowRight, Mail, Phone } from "lucide-react";
import { useTranslations } from "next-intl";

import { footerNavigation, legalNavigation } from "@/config/navigation";
import { founderDisplayName, siteConfig } from "@/config/site";
import { BrandMark } from "@/components/ui/brand-mark";
import { CookieSettingsButton } from "@/components/consent/minimal-cookie-consent";
import { LeadButton } from "@/components/lead/lead-button";
import { InstagramIcon } from "@/components/ui/instagram-icon";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { Link } from "@/i18n/navigation";
import { publicEnv } from "@/lib/env";

export function SiteFooter() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const year = new Date().getFullYear();

  return (
    // The bottom padding is a RESERVATION, not styling: FloatingWhatsApp is
    // fixed at the inline-start bottom corner (56px tall, 20px up) and the
    // accessibility launcher at the inline-end one, so without it the last
    // thing on every route — the copyright line on /privacy and /terms, the
    // footer nav on a phone — comes to rest underneath a button. 64px on a phone
    // clears the 76px the WhatsApp button occupies once the row's own py-7 is
    // counted; 48px does the same for the smaller desktop pair.
    <footer className="relative overflow-hidden bg-cta-fill pb-16 md:pb-12">
      {/* ── THE FOOTER IS HER DEEP OCEAN NOW (2026-08-03) ──
          Pnina's brand book anchors the footer and her logo card on the dark
          navy #264653. It was `bg-background`, i.e. the 40% paper veil over her
          sunset photograph, so the page simply ran out at the bottom; her book
          ends it on a colour.

          ── WHY `bg-cta-fill` AND NOT A HEX, AND NOT `bg-rose-deep` EITHER ──
          The navy is landing as `--rose-deep`, the accent family's deep end
          (see the accent note in globals.css `:root`), so the value here IS
          hers and there is no hostname-style second copy of it in this file.
          It is taken through `--cta-fill` — which is literally
          `var(--rose-deep)` — because that is the half of a PAIR: every accent
          and both schemes re-point `--cta-fill` and `--cta-ink` together and
          measure them against each other, and `?accent=amber` / `?accent=gold`
          re-point `--cta-ink` WITHOUT touching `--rose-deep`. Inking this
          surface off `--rose-deep` directly would therefore have shipped a
          near-black label on a sea-blue footer the first time Daniel opened the
          eval switcher. Through the pair it cannot happen: whatever the surface
          is, `--cta-ink` is the ink that was measured on it.

          So EVERY glyph below is `--cta-ink`, at 100% or 85% and nothing
          lighter. Measured (WCAG 2.x) on every fill the pair can resolve to,
          fill / ink, then the ratio at 100% and at 85%:

            shipped, light    #264653 / #fff8f5    9.60   7.46
            shipped, dark     #98cde1 / #081216   10.97   8.12
            enhanced contrast #b8e6f8 / #040e12   14.59  10.43
            ?accent=sea       #1e6876 / #fff8f5    6.07   4.88
            ?accent=peach     #a04731 / #fff8f5    5.81   4.68
            ?accent=pink      #8a1f58 / #fff8f5    8.27   6.38
            ?accent=amber     #6b4f3a / #fff8f2    7.12   5.69
            ?accent=gold      #f0c440 / #2f241c    9.12   6.42

          The floor across all of them is 4.68, so 85% is the LAST rung: there
          is deliberately no 70% tier in this footer. Hierarchy is carried by
          size and weight instead, which is the right way round on a dark
          surface anyway.

          ── AFTER DARK THE FOOTER IS NOT NAVY, AND THAT IS NOT A BUG HERE ──
          `--rose-deep` inverts to a lit sky-blue (#98cde1) in the dark scheme,
          because it is the site's CTA colour and a deep fill carrying near-white
          ink cannot also be a dark-scheme button. So a dark-scheme visitor gets
          a light footer with near-black type — legible (10.97:1), and coherent
          with the CTA it matches, but it is NOT her Deep Ocean. If she wants the
          navy after dark too, that is one value in globals.css (a dark-scheme
          fill that stays deep, with `--cta-ink` flipped back to near-white in
          the same commit) and it belongs to whoever owns that file, not here.

          ── WHAT THIS COSTS, HONESTLY ──
          Two things went. The links were `--brand-accent` bronze (1.39:1 on the
          navy) and the WhatsApp row was `--whatsapp-ink` green (1.55:1); both
          are now `--cta-ink`. WhatsApp keeps its recognition through the glyph
          and its green tile, not through green type. Its brand green does clear
          4.5:1 on #264653 (5.08) — but only 3.21 under `?accent=sea` and less
          on a light dark-scheme fill, so it is not usable as a token-safe value
          here.

          ── AND ONE THING THIS FILE CANNOT FIX ──
          `html[data-a11y-enhanced-contrast="true"] :focus-visible` in
          globals.css draws `outline: 3px solid var(--ring)`, and `--ring`
          follows `--brand-accent` (bronze), which measures 1.39:1 on the navy.
          Inside this footer that outline is invisible for exactly the visitor
          who asked for MORE contrast. It needs an answer in globals.css (an ink
          that follows the surface, e.g. `--cta-ink` under a footer scope); a
          utility class cannot outrank that selector without `!important`.

          ── THE FOOTER'S "WARM LIFT" IS GONE, AND THAT IS THE FIX (2026-07-30) ──
          There used to be a 120px-blurred `bg-brand/8` ellipse here, sitting at
          `top-0` and reaching about 310px down into the footer. `--brand` is a
          dark natural brown, so calling it a warm lift was always generous: it
          was a soft shadow, and what it fell on was the footer's nav columns and
          copyright line — `--subtle-foreground` at 12-14px, the smallest type on
          the whole site.

          It had already been cut once for this (14% → 8% in 0.12.1, when those
          links measured 4.2:1 at 390). The same argument retires it. Measured on
          the rendered footer at the 55% veil, against `--subtle-foreground`:

            no wash  5.29:1      wash 8%  4.74:1      wash 14%  4.36:1 ✗

          So the blob was spending 0.55 of a contrast ratio — more than half the
          margin the veil drop had to buy back — on the smallest type on the
          site, to do a job that is decorative.

          The footer does not need it any more, and as of the navy above it needs
          it even less: the surface IS the separation now, which is also why the
          `border-t` hairline that used to divide the footer from the page came
          off with it. Do not put the blob back: if the footer ever needs
          separating again, separate it with space, not with tone under 14px
          type. */}
      <div className="relative mx-auto w-full max-w-6xl px-6">
        {/* CTA strip */}
        <div className="flex flex-col items-start justify-between gap-6 border-b border-cta-ink/15 py-12 md:flex-row md:items-center">
          <div>
            {/* Not a heading: this CTA repeats on every page and would add a
                duplicate h2 to every document outline. */}
            <p className="text-2xl font-medium tracking-tight text-cta-ink sm:text-3xl">
              {t("ctaTitle")}
            </p>
            {/* ── THE FOOTER TYPE IS ONE RUNG DARKER AND ONE STEP HEAVIER
                (2026-07-30, launch night) ──
                Daniel, reading the live footer over the sand: *"all the footer
                text should be a little bit bolder and blacker so it will be
                easier to view."*
                This is the one region of the site with NO opaque card under it —
                every other block of small type now sits on a surface, but the
                footer sits straight on the photograph, which is exactly why it
                was the first thing he noticed. So every line here moved up the
                ink ladder (`--subtle-foreground` → `--muted-foreground` →
                `--foreground-soft`) and picked up `font-medium`/`font-semibold`.
                The type SIZES are untouched — the footer's scale was already
                argued out at the 44px-target rework above; this is weight and
                ink only.
                The ladder itself is gone as of the navy (there is no light end
                of the brown ink ladder), but the WEIGHT half of that request
                survives verbatim: every line down here is still `font-medium` or
                heavier, and the ink is now the top of a two-rung ladder instead
                of the middle of a five-rung one. */}
            <p className="mt-2 max-w-xl text-sm font-medium leading-normal text-cta-ink/85">
              {t("ctaText")}
            </p>
          </div>
          {/* ── THE ONE INVERTED BUTTON ON THE SITE ──
              `variant="brand"` fills with `--cta-fill`, which is now also this
              footer's surface, so the button would have been navy on navy. It
              is flipped instead: the fill takes `--cta-ink` and the label takes
              `--cta-fill`, which is the SAME measured pair read the other way
              round and therefore clears in every accent and both schemes
              (9.60:1 on her navy, 10.97:1 after dark, 6.07:1 under ?accent=sea).
              `.btn-cta`'s hairline and glow are left alone: `--cta-image` is
              `none` under every accent but gold, so nothing paints over the
              flipped fill.
              The focus ring is re-pointed for the same reason — the variant's
              `--ring` is bronze and measures 1.39:1 on this surface. It is a
              navy hairline against the light fill (9.60:1) inside a light glow
              against the navy (5.64:1 at 70%), so both edges of the indicator
              clear 3:1. */}
          <LeadButton
            variant="brand"
            className="h-11 shrink-0 rounded-lg bg-cta-ink px-5 text-cta-fill hover:bg-cta-ink/90 focus-visible:border-cta-fill focus-visible:ring-cta-ink/70"
          >
            {t("cta")}
            {/* ArrowRight, not ArrowUpRight. `data-icon="inline-end"` is
                mirrored under `[dir="rtl"]` in globals.css, which turns a
                horizontal arrow into a correct ← and a diagonal one into a ↖
                pointing back up the page. This is the same CTA as the header's
                and it now carries the same glyph. */}
            <ArrowRight data-icon="inline-end" />
          </LeadButton>
        </div>

        {/* ── Columns. TWO of them on a phone, three from `md` (2026-07-30) ──
            The two nav lists used to stack, so a phone got one column roughly
            900px long: the brand block, then every page link, then every legal
            link, then the cookies control, and the copyright line somewhere off
            the bottom. Daniel asked for the two lists side by side, and they fit
            easily — the longest label in either is two short words.

            `grid-cols-2` at the base with the brand block spanning both, then
            the existing `md:grid-cols-[1.4fr_0.8fr_0.8fr]` untouched from `md`
            up (with the span released so the three columns are three columns
            again). No `dir` work is needed: a CSS grid in an RTL document lays
            its columns out right to left on its own, so "pages" lands under the
            wordmark on the right and "legal" beside it on the left.

            The column gap is `gap-x-6`, not the row's `gap-10`: 40px of the
            390px viewport spent on a gutter between two lists of short links is
            padding nobody asked for. Row gap and the desktop gap are unchanged,
            and the rows themselves keep their `min-h-11` tap targets. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-14 text-sm md:grid-cols-[1.4fr_0.8fr_0.8fr] md:gap-10">
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              data-a11y-no-underline
              className="flex min-h-11 w-fit items-center gap-2.5 text-base font-semibold tracking-tight text-cta-ink"
            >
              <BrandMark size={28} />
              {siteConfig.name}
            </Link>
            <p className="mt-4 max-w-sm font-medium leading-normal text-cta-ink/85">
              {t("blurb", { founder: founderDisplayName() })}
            </p>
            {/* `gap-1` with `min-h-11` on each row, not `gap-3` with a 32px
                row: these are the footer's real contact actions and a 32px
                target is under the 44px touch minimum. The icon tile stays
                32px — only the tap area grows, so nothing looks different. */}
            {/* ── THE CONTACT ROWS LOST THEIR BRONZE (2026-08-03) ──
                They were `--brand-accent` on `--brand/10` tiles, which is the
                right pair on cream and measures 1.39:1 on the navy. Both the
                type and the tile are `--cta-ink` now (100% for the label,
                a 10% wash for the tile, 7.24:1 for the glyph on it at her navy
                and 4.90:1 at the tightest accent; the 20% hover wash
                bottoms out at 3.89:1, which is a 16px icon beside its own label
                and so is held to the 3:1 non-text floor). The tiles are the
                only place a hover still tints a surface; the labels answer a
                pointer with 85% → 100% instead, because there is nothing above
                `--cta-ink` to move to. */}
            <div className="mt-6 flex flex-col gap-1">
              <a
                href={`mailto:${siteConfig.email}`}
                className="group flex min-h-11 w-fit items-center gap-2.5 font-medium text-cta-ink/85 transition-colors hover:text-cta-ink"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cta-ink/10 text-cta-ink transition-colors group-hover:bg-cta-ink/20">
                  <Mail className="h-4 w-4" />
                </span>
                <span dir="ltr">{siteConfig.email}</span>
              </a>
              <a
                href={`tel:${siteConfig.phoneE164}`}
                className="group flex min-h-11 w-fit items-center gap-2.5 font-medium text-cta-ink/85 transition-colors hover:text-cta-ink"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cta-ink/10 text-cta-ink transition-colors group-hover:bg-cta-ink/20">
                  <Phone className="h-4 w-4" />
                </span>
                <span dir="ltr">{siteConfig.phone}</span>
              </a>
              {/* WhatsApp's brand green (#25d366) was never usable as type on
                  the cream canvas — 1.8:1 — so this row carried
                  `--whatsapp-ink`, a darkened green that cleared 4.5:1 in both
                  schemes and still read as WhatsApp.
                  On the navy that trick runs out: `--whatsapp-ink` is 1.55:1
                  there, and the un-darkened brand green, which DOES clear on
                  #264653 (5.08:1), fails under ?accent=sea
                  (3.21:1) and would fail again on any light dark-scheme fill.
                  There is no green that is safe across the pair, so the label is
                  `--cta-ink` like its neighbours and the recognition is carried
                  by the glyph and by the green tile behind it — which is exactly
                  where a brand colour belongs when it cannot be type. */}
              <WhatsAppLink className="group flex min-h-11 w-fit items-center gap-2.5 font-medium text-cta-ink/85 transition-colors hover:text-cta-ink">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#25d366]/20 text-cta-ink transition-colors group-hover:bg-[#25d366]/30">
                  <WhatsAppIcon className="h-4 w-4" />
                </span>
                {t("whatsapp")}
              </WhatsAppLink>
              {siteConfig.profiles.instagram ? (
                <a
                  href={siteConfig.profiles.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex min-h-11 w-fit items-center gap-2.5 font-medium text-cta-ink/85 transition-colors hover:text-cta-ink"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cta-ink/10 text-cta-ink transition-colors group-hover:bg-cta-ink/20">
                    <InstagramIcon className="h-4 w-4" />
                  </span>
                  {t("instagram")}
                </a>
              ) : null}
            </div>
          </div>

          {/* Same 44px rule as the contact rows above: the link rows measured
              24px at 390px. The height is padding, not type — the footer's
              type scale is unchanged. */}
          {/* ── HER BOOK'S FOOTER NAV IS FIVE ITEMS AND THREE OF THEM DO NOT
              EXIST (2026-08-03) ──
              The brand book prints "הרצאות | ליווי אישי | קורס דיגיטלי |
              קבוצות | קהילה". `הרצאות` is already here, under her own word, and
              `ליווי אישי` is what the whole home page is. `קורס דיגיטלי`,
              `קבוצות` and `קהילה` have no page, no price and no copy anywhere
              in this repo, so they are NOT in this list: a footer link is a
              promise that something is there, and three "בקרוב" stubs on a page
              read by women in distress is a claim we cannot keep. If she
              confirms they are real, they get built and then linked, in that
              order. The list itself is `footerNavigation` in
              src/config/navigation.ts, deliberately still the header's own list
              plus the FAQ — this column is site navigation, not her product
              list. */}
          <nav aria-label={t("footerNav")} className="flex flex-col gap-1">
            <p className="mb-2 font-semibold text-xs uppercase tracking-wider text-cta-ink/85">
              {t("pages")}
            </p>
            {footerNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-11 w-fit items-center font-medium text-cta-ink/85 transition-colors hover:text-cta-ink"
              >
                {tNav(item.key)}
              </Link>
            ))}
          </nav>

          <nav aria-label={t("legalNav")} className="flex flex-col gap-1">
            <p className="mb-2 font-semibold text-xs uppercase tracking-wider text-cta-ink/85">
              {t("legal")}
            </p>
            {legalNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-11 w-fit items-center font-medium text-cta-ink/85 transition-colors hover:text-cta-ink"
              >
                {tNav(item.key)}
              </Link>
            ))}
            <CookieSettingsButton
              enabled={Boolean(publicEnv.ga4MeasurementId)}
              label={t("cookieSettings")}
              className="w-fit font-medium text-cta-ink/85 transition-colors hover:text-cta-ink"
            />
          </nav>
        </div>

        {/* ── HER SIGN-OFF, WHERE THE TAGLINE USED TO BE ──
            The last line of her brand book is a two-line lockup: "שלך, פנינה."
            over "שכבה אחר שכבה." It replaces "ליווי אישי, בקצב שלך", which was
            ours and said less. It stays in this row rather than becoming a
            section of its own, because a sign-off belongs at the very bottom of
            the page and this IS the bottom of the page; and it stays two
            elements rather than one string with a `<br>`, so the break lands
            between her two lines at every width instead of wherever the column
            happens to run out.
            `items-end` on this row so the lockup's second line sits on the same
            baseline as the copyright, which is one line tall. */}
        <div className="flex flex-col items-start justify-between gap-3 border-t border-cta-ink/15 py-7 text-xs font-medium text-cta-ink/85 sm:flex-row sm:items-end">
          <p>{t("rights", { year, brand: siteConfig.name })}</p>
          <p className="leading-snug sm:text-end">
            <span className="block">{t("signoff")}</span>
            <span className="block text-cta-ink">{t("tagline")}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
