"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Menu, X } from "lucide-react";

import { LeadButton } from "@/components/lead/lead-button";
import { BrandMark } from "@/components/ui/brand-mark";
import { InstagramIcon } from "@/components/ui/instagram-icon";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { mainNavigation } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const t = useTranslations("header");
  const tNav = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-300",
        scrolled
          ? "border-foreground/[0.08] bg-canvas/80 backdrop-blur-xl"
          : "border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-foreground"
        >
          <BrandMark
            size={32}
            className="transition-transform group-hover:scale-105"
          />
          {siteConfig.name}
        </Link>

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

        <div className="flex items-center gap-2">
          {siteConfig.profiles.instagram ? (
            <a
              href={siteConfig.profiles.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("instagram")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-foreground/12 bg-foreground/[0.03] text-foreground-soft transition-colors hover:border-brand/40 hover:text-brand-accent"
            >
              <InstagramIcon className="h-4.5 w-4.5" />
            </a>
          ) : null}
          <a
            href={siteConfig.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("whatsapp")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#25d366]/30 bg-[#25d366]/10 text-[#34d36f] transition-colors hover:border-[#25d366]/50 hover:bg-[#25d366]/15"
          >
            <WhatsAppIcon className="h-4.5 w-4.5" />
          </a>
          <LeadButton
            variant="brand"
            size="sm"
            className="hidden h-9 rounded-lg px-4 sm:inline-flex"
          >
            {t("cta")}
            <ArrowRight data-icon="inline-end" />
          </LeadButton>
          <button
            type="button"
            aria-label={t("toggleMenu")}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-foreground/12 bg-foreground/[0.03] text-foreground-soft transition-colors hover:bg-foreground/[0.08] lg:hidden"
          >
            {open ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-t border-foreground/[0.06] bg-canvas/95 backdrop-blur-xl transition-[max-height,opacity] duration-300 lg:hidden",
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
                "rounded-lg px-3 py-2.5 text-sm transition-colors",
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
            className="mt-2 h-10 rounded-lg px-4"
            onClick={() => setOpen(false)}
          >
            {t("cta")}
            <ArrowRight data-icon="inline-end" />
          </LeadButton>
          <div className="flex gap-2">
            <a
              href={siteConfig.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-[#25d366]/30 bg-[#25d366]/10 px-4 text-sm font-medium text-[#34d36f] transition-colors hover:bg-[#25d366]/15"
            >
              <WhatsAppIcon className="h-4.5 w-4.5" />
              {t("whatsapp")}
            </a>
            {siteConfig.profiles.instagram ? (
              <a
                href={siteConfig.profiles.instagram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-foreground/12 bg-foreground/[0.03] px-4 text-sm font-medium text-foreground-soft transition-colors hover:border-brand/40 hover:text-brand-accent"
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
