"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Menu, X } from "lucide-react";

import { LeadButton } from "@/components/lead/lead-button";
import { BrandMark } from "@/components/ui/brand-mark";
import { InstagramIcon } from "@/components/ui/instagram-icon";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { mainNavigation } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const t = useTranslations("header");
  const tNav = useTranslations("nav");
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      {/* ── THE HEADER HAS NO BACKGROUND OF ITS OWN. (2026-07-30, Daniel) ──
          There used to be a cream `bg-canvas/80 backdrop-blur-xl` sheet on its
          own layer here, toggled on at `scrollY > 8`. Two rounds of work went
          into making that toggle behave — the fade was dropped because any
          transition on this page is starved while the sand floor and the
          reveals are live — and the answer, reading the live site, was that the
          sheet should not exist:

            *"The header will keep it in a different color, the entire header
            line, and not the background color. I think we might want to leave
            it the background color."*

          He is right. The page background is a photograph of sand; a cream bar
          laid over the top of it is a second, flatter colour drawn as a band
          across the whole width, and the moment it switches on it announces
          itself. The header is now transparent at every scroll position, over
          whatever the page has behind it, separated by the hairline below and
          nothing else.

          Three things went with the sheet, and all three are wins: the scroll
          listener and its state (a re-render of the whole header on a scroll
          threshold), the `backdrop-blur-xl` (a full-width blur repainted on a
          sticky element every frame — part of why the header stuttered on a
          phone), and the toggle that was making it visibly change.

          Do NOT put a veil back "for contrast" over the sand. Daniel, same
          review: *"if something is not really seen, I will tell you myself."*
          The mobile menu panel below is a different case and IS opaque — see
          the note on it. */}
      <div
        aria-hidden
        // All that is left of that layer: the hairline. It keeps its own
        // element rather than riding on the row below, because the row is
        // capped at `max-w-6xl` and the rule has to reach both edges of the
        // viewport. `h-16`, not `inset-0` — the mobile menu is part of this
        // same <header>, and a layer spanning the whole element would draw its
        // rule across the middle of the open menu.
        className="pointer-events-none absolute inset-x-0 top-0 h-16 border-b border-foreground/[0.08]"
      />

      <div className="relative mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-6">
        {/* ── The inline-START cluster: wordmark, then the two social icons ──
            The icons used to live beside the CTA at the inline end. Daniel,
            2026-07-30: "I wanted to add the CTA on mobile as well on the
            header. You can move the Instagram and the WhatsApp maybe more to
            the right." In this RTL document the right IS the inline start, so
            they moved here, next to the wordmark, and the whole inline-end
            corner now belongs to the CTA. Below `sm` they are not in the bar at
            all — see the note on the CTA below. */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <Link
            href="/"
            data-a11y-no-underline
            // `font-bold`, not `font-semibold`: Daniel, 2026-07-30, found the type
            // at the top of the page thin. This one is safe to simply bolden
            // because the wordmark is set in the BODY face (Assistant), which
            // loads a REAL 700 in the locale layout — nothing here is synthesised.
            // It is a plain `font-bold` for that reason and needs none of the
            // weight machinery the display headings carry.
            //
            // `min-h-11`: it is a link in a bar full of 44px targets and it is
            // the one every visitor hits by accident on the way to the CTA.
            className="group flex min-h-11 items-center gap-2.5 text-base font-bold tracking-tight text-foreground"
          >
            <BrandMark
              size={32}
              className="transition-transform group-hover:scale-105"
            />
            <span className="a11y-compact-header-item">{siteConfig.name}</span>
          </Link>

          {/* 44px while a thumb is the pointer, 36px from `lg` where the nav
              appears and the pointer is a mouse. */}
          <div className="hidden items-center gap-2 sm:flex">
            {siteConfig.profiles.instagram ? (
              <a
                href={siteConfig.profiles.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("instagram")}
                data-a11y-no-underline
                className="a11y-compact-header-item inline-flex h-11 w-11 items-center justify-center rounded-lg border border-foreground/12 bg-foreground/[0.03] text-foreground-soft transition-colors hover:border-brand/40 hover:text-brand-accent lg:h-9 lg:w-9"
              >
                <InstagramIcon className="h-4.5 w-4.5" />
              </a>
            ) : null}
            <WhatsAppLink
              label={t("whatsapp")}
              noUnderline
              className="a11y-compact-header-item inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[#25d366]/30 bg-[#25d366]/10 text-whatsapp-ink transition-colors hover:border-[#25d366]/50 hover:bg-[#25d366]/15 lg:h-9 lg:w-9"
            >
              <WhatsAppIcon className="h-4.5 w-4.5" />
            </WhatsAppLink>
          </div>
        </div>

        <nav
          aria-label={t("mainNav")}
          // lg, not md: the centred nav is absolutely positioned, so it does not
          // push the logo or the action buttons — it slides under them. At 768px
          // the last item and the Instagram icon overlap outright. Below lg the
          // mobile menu takes over, which is the right control on a tablet.
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex"
        >
          {mainNavigation.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tNav(item.key)}
              </Link>
            );
          })}
        </nav>

        {/* ── The inline-END cluster: the CTA, then the menu ── */}
        <div className="flex items-center gap-2">
          {/* ON A PHONE TOO (Daniel, 2026-07-30). It carried
              `hidden … sm:inline-flex`, so below 640px the bar had no CTA at
              all and the page ran for two stretches of roughly 7,000px with
              nothing to tap. It is the same button at every width, just tighter
              below `sm`: `px-3` and no arrow, which is what makes it fit beside
              the wordmark and the menu at 360px without wrapping. The label is
              unchanged — this is her one promise and it does not get abbreviated
              for a narrow screen. */}
          <LeadButton
            variant="brand"
            className="h-11 rounded-lg px-3 sm:h-10 sm:px-4 [&_svg]:hidden sm:[&_svg]:block"
          >
            {t("cta")}
            <ArrowRight data-icon="inline-end" />
          </LeadButton>
          <button
            type="button"
            aria-label={t("toggleMenu")}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-foreground/12 bg-foreground/[0.03] text-foreground-soft transition-colors hover:bg-foreground/[0.08] lg:hidden"
          >
            {open ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu: SOLID, and that is the one exception ──
          The bar above is transparent over the page background now (see the
          note at the top). This panel is not, and must not be: it is a stack of
          nav links laid over whatever section of the page happens to be under
          the header when she opens it — the hero video on `/`, a photograph, a
          card — and translucency there is not a style, it is text over noise.

          `bg-canvas`, flat, at full opacity. It was `bg-canvas/95
          backdrop-blur-xl`, which is 95% of the way to this anyway; the last 5%
          bought nothing and the blur it needed to stay readable is the same
          full-width GPU layer that came off the bar. */}
      <div
        className={cn(
          "overflow-hidden border-t border-foreground/[0.06] bg-canvas transition-[max-height,opacity] duration-300 lg:hidden",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav
          aria-label={t("mobileNav")}
          className="mx-auto flex max-w-6xl flex-col gap-1 px-6 py-4"
        >
          {mainNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                // `min-h-11`: a 38px row is under the 44px touch minimum, and
                // this menu exists only for touch.
                "flex min-h-11 items-center rounded-lg px-3 py-2.5 text-sm transition-colors",
                pathname === item.href
                  ? "bg-foreground/[0.05] text-foreground"
                  : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground"
              )}
            >
              {tNav(item.key)}
            </Link>
          ))}
          <LeadButton
            variant="brand"
            className="mt-2 h-11 rounded-lg px-4"
            onClick={() => setOpen(false)}
          >
            {t("cta")}
            <ArrowRight data-icon="inline-end" />
          </LeadButton>
          <div className="flex gap-2">
            <WhatsAppLink
              onClick={() => setOpen(false)}
              noUnderline
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-[#25d366]/30 bg-[#25d366]/10 px-4 text-sm font-medium text-whatsapp-ink transition-colors hover:bg-[#25d366]/15"
            >
              <WhatsAppIcon className="h-4.5 w-4.5" />
              {t("whatsapp")}
            </WhatsAppLink>
            {siteConfig.profiles.instagram ? (
              <a
                href={siteConfig.profiles.instagram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                data-a11y-no-underline
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-foreground/12 bg-foreground/[0.03] px-4 text-sm font-medium text-foreground-soft transition-colors hover:border-brand/40 hover:text-brand-accent"
              >
                <InstagramIcon className="h-4.5 w-4.5" />
                {t("instagram")}
              </a>
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  );
}
