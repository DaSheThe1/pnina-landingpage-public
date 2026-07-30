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
    <footer className="relative overflow-hidden border-t border-foreground/[0.08] bg-background pb-16 md:pb-12">
      {/* ── THE FOOTER'S "WARM LIFT" IS GONE, AND THAT IS THE FIX (2026-07-30) ──
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

          The footer does not need it any more. It has a `border-t` hairline, and
          it now has Daniel's photograph behind it, which is a better warm lift
          than a blurred brown blob was ever going to be. Do not put it back: if
          the footer ever needs separating again, separate it with the hairline or
          with space, not with tone under 14px type. */}
      <div className="relative mx-auto w-full max-w-6xl px-6">
        {/* CTA strip */}
        <div className="flex flex-col items-start justify-between gap-6 border-b border-foreground/[0.06] py-12 md:flex-row md:items-center">
          <div>
            {/* Not a heading: this CTA repeats on every page and would add a
                duplicate h2 to every document outline. */}
            <p className="text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
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
                ink only. */}
            <p className="mt-2 max-w-xl text-sm font-medium leading-normal text-foreground-soft">
              {t("ctaText")}
            </p>
          </div>
          <LeadButton
            variant="brand"
            className="h-11 shrink-0 rounded-lg px-5"
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
              className="flex min-h-11 w-fit items-center gap-2.5 text-base font-semibold tracking-tight text-foreground"
            >
              <BrandMark size={28} />
              {siteConfig.name}
            </Link>
            <p className="mt-4 max-w-sm font-medium leading-normal text-foreground-soft">
              {t("blurb", { founder: founderDisplayName() })}
            </p>
            {/* `gap-1` with `min-h-11` on each row, not `gap-3` with a 32px
                row: these are the footer's real contact actions and a 32px
                target is under the 44px touch minimum. The icon tile stays
                32px — only the tap area grows, so nothing looks different. */}
            <div className="mt-6 flex flex-col gap-1">
              <a
                href={`mailto:${siteConfig.email}`}
                className="group flex min-h-11 w-fit items-center gap-2.5 font-medium text-brand-accent transition-colors hover:text-brand-hover"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand-accent transition-colors group-hover:bg-brand/15">
                  <Mail className="h-4 w-4" />
                </span>
                <span dir="ltr">{siteConfig.email}</span>
              </a>
              <a
                href={`tel:${siteConfig.phoneE164}`}
                className="group flex min-h-11 w-fit items-center gap-2.5 font-medium text-brand-accent transition-colors hover:text-brand-hover"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand-accent transition-colors group-hover:bg-brand/15">
                  <Phone className="h-4 w-4" />
                </span>
                <span dir="ltr">{siteConfig.phone}</span>
              </a>
              {/* WhatsApp's brand green (#25d366, and the lighter #34d36f this
                  used) is 1.8:1 on the cream canvas — invisible to anyone with
                  low vision, and a straight AA failure on link text. The tile
                  behind the glyph still carries the brand colour; the type is
                  `--whatsapp-ink`, which clears 4.5:1 in BOTH schemes (a
                  darkened green on paper, a lightened one on the dark canvas)
                  and still reads as WhatsApp. */}
              {/* `font-medium` only — the ink stays `--whatsapp-ink` rather than
                  moving up the brown ladder with the rest of the footer. It is a
                  brand colour doing a legibility job (see the note above) and
                  darkening it toward brown would cost the recognition it is for. */}
              <WhatsAppLink className="group flex min-h-11 w-fit items-center gap-2.5 font-medium text-whatsapp-ink transition-colors hover:text-whatsapp-ink-hover">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#25d366]/12 text-whatsapp-ink transition-colors group-hover:bg-[#25d366]/20">
                  <WhatsAppIcon className="h-4 w-4" />
                </span>
                {t("whatsapp")}
              </WhatsAppLink>
              {siteConfig.profiles.instagram ? (
                <a
                  href={siteConfig.profiles.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex min-h-11 w-fit items-center gap-2.5 font-medium text-brand-accent transition-colors hover:text-brand-hover"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand-accent transition-colors group-hover:bg-brand/15">
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
          <nav aria-label={t("footerNav")} className="flex flex-col gap-1">
            <p className="mb-2 font-semibold text-xs uppercase tracking-wider text-foreground-soft">
              {t("pages")}
            </p>
            {footerNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-11 w-fit items-center font-medium text-foreground-soft transition-colors hover:text-foreground"
              >
                {tNav(item.key)}
              </Link>
            ))}
          </nav>

          <nav aria-label={t("legalNav")} className="flex flex-col gap-1">
            <p className="mb-2 font-semibold text-xs uppercase tracking-wider text-foreground-soft">
              {t("legal")}
            </p>
            {legalNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-11 w-fit items-center font-medium text-foreground-soft transition-colors hover:text-foreground"
              >
                {tNav(item.key)}
              </Link>
            ))}
            <CookieSettingsButton
              enabled={Boolean(publicEnv.ga4MeasurementId)}
              label={t("cookieSettings")}
              className="w-fit font-medium text-foreground-soft transition-colors hover:text-foreground"
            />
          </nav>
        </div>

        <div className="flex flex-col items-start justify-between gap-3 border-t border-foreground/[0.06] py-7 text-xs font-medium text-muted-foreground sm:flex-row sm:items-center">
          <p>{t("rights", { year, brand: siteConfig.name })}</p>
          <p>{t("tagline")}</p>
        </div>
      </div>
    </footer>
  );
}
