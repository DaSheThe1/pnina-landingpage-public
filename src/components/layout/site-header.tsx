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
    // `site-header` is the hook for one wide-screen CSS rule: the bar is hidden
    // while the pearl stage is pinned (globals.css §10b). On phones the stage
    // covers it through local stacking, so WebKit does not wait for a global
    // style change at either process boundary.
    <header className="site-header sticky top-0 z-50">
      {/* ── THE HEADER HAS ITS OWN BACKGROUND AGAIN, EXCEPT ON THE ANIMATION ──
          (2026-07-31, Daniel — reversing his own call of the day before.)

          The 2026-07-30 version had no sheet at all: the bar was transparent at
          every scroll position, over whatever the page had behind it, on the
          argument that a cream band over the sand photograph announces itself.
          One day on the built site answered that:

            *"I might have been mistaken to make it so the header won't have its
            own colored background because that way stuff there is unreadable
            when hovering. When scrolling down, stuff gets in the background. On
            the animation itself, the header can be without the background …
            But in all other sections the header should have a different color
            background so it will stand above all other text."*

          So the sheet is back, and it is SIMPLER than the one that was removed:

            • It is ALWAYS ON — at the top of the page, over the hero, over
              everything. There is no `scrollY > 8` listener and no state, so
              the header still does not re-render on scroll, and there is
              nothing that can visibly switch on halfway down the page. That
              listener was one of the three wins of removing the sheet and it
              does not come back with it.
            • It is SOLID `bg-canvas`, not a translucent veil. Without
              `backdrop-blur` — which also does not come back, because a
              full-width blur repainted on a sticky element every frame is part
              of why this bar stuttered on a phone — any transparency simply
              lets the sand's noise through under the nav type, which is the
              readability complaint above, not a fix for it.
            • It never animates. See the exception below.

          ── THE EXCEPTION: THE PEARL STAGE ──
          While the process scrub is pinned it fills the viewport with its own
          canvas, and there the WHOLE HEADER goes away — not just its
          background. Daniel asked first for the bar to be transparent over the
          animation and then, testing on a second Samsung, for the rest of it
          too: *"in the animation part probably hide header completely."* That
          is local on phones: the stage stacks above this bar and uncovers it at
          its own sticky boundary. Wide screens use the `data-scrub-pinned`
          attribute in globals.css §10b. Neither path transitions the bar:
          a starved fade reads as a rendering glitch, not as choreography.

          The mobile menu panel below is solid for its own reasons — see the
          note on it. */}
      <div
        aria-hidden
        // The sheet and the hairline are one element. It stays separate from
        // the row below because the row is capped at `max-w-6xl` and both have
        // to reach the edges of the viewport. `h-16`, not `inset-0` — the
        // mobile menu is part of this same <header>, and a layer spanning the
        // whole element would draw its rule across the middle of the open menu.
        className="pointer-events-none absolute inset-x-0 top-0 h-16 border-b border-foreground/[0.08] bg-canvas"
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
          {/* ── EVERY LINK IS FULL `--foreground`, ACTIVE OR NOT ──
              Daniel, 2026-07-31: *"the header itself is not dark enough."* The
              inactive links were `--muted-foreground`, one rung down, which is
              the right ladder for body copy and the wrong one for six words at
              the top of the page that have to read at a glance.
              So the colour stops carrying the active state and WEIGHT carries
              it instead — bold plus the same faint wash the mobile menu uses —
              which is the stronger signal anyway and leaves every link at the
              darkest ink the site has. Hover goes bronze, matching the two icon
              buttons beside them, so a pointer still gets an answer. */}
          {mainNavigation.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm text-foreground transition-colors",
                  active
                    ? "bg-foreground/[0.05] font-bold"
                    : "font-medium hover:text-brand-accent"
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
          // INSTANT toggle, no transition. The old `transition-[max-height,opacity]`
          // slide left the menu PERMANENTLY 1px tall: while the WebGL sand runs,
          // its CSS transitions never get a start time (verified live — both
          // stayed play-pending forever; hide the sand canvas and they complete
          // in 300ms). Third confirmed victim of sand-starved transitions, after
          // the header backdrop and the FAB fades. House pattern applies: state
          // changes near the sand flip instantly or not at all.
          "border-t border-foreground/[0.06] bg-canvas lg:hidden",
          open ? "block" : "hidden"
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
                // Same ink rule as the desktop nav above: full `--foreground`
                // on every row, weight and the wash for the active one.
                "flex min-h-11 items-center rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors",
                pathname === item.href
                  ? "bg-foreground/[0.05] font-bold"
                  : "font-medium hover:bg-foreground/[0.04]"
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
