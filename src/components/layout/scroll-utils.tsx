"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUp } from "lucide-react";

import { usePrefersReducedMotion } from "@/components/motion/use-reduced-motion";
import { cn } from "@/lib/utils";

/** Thin gradient progress bar pinned to the very top of the viewport. */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-0.5 bg-transparent">
      <div
        className="h-full origin-left bg-gradient-to-r from-brand via-brand-accent to-brand-soft transition-[width] duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

/** Floating back-to-top button that appears after scrolling down. */
export function BackToTop() {
  const t = useTranslations("common");
  const [visible, setVisible] = useState(false);
  const shouldReduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      aria-label={t("backToTop")}
      onClick={() => {
        // The process uses root scroll snap while it fills the screen. Release
        // that snap before the owner's explicit skip route starts, otherwise
        // the browser can pull the smooth scroll back to the current station.
        window.dispatchEvent(new Event("pnina:scroll-bypass"));
        window.scrollTo({
          top: 0,
          behavior: shouldReduceMotion ? "auto" : "smooth",
        });
      }}
      className={cn(
        // Positioning comes from `.back-to-top-control` in globals.css, which
        // owns the whole fixed-control stack: WhatsApp at the bottom
        // inline-START, the accessibility launcher at the bottom inline-END,
        // and this button 140px up the inline-END edge, above the launcher.
        // Logical properties everywhere on this site — in an RTL document
        // `right` is the INLINE-START edge, so a physical `right-6` here would
        // put this button on top of the WhatsApp one, which is what v0.6.0
        // shipped.
        //
        // ── ON A PHONE TOO (2026-07-30, Daniel, testing the live site) ──
        // It was `hidden md:flex`. The stated reason was that it crowded the
        // WhatsApp button on a small screen, and that was true of the geometry
        // at the time; it is not true of the stack as it stands. The three
        // fixed controls now occupy three distinct boxes at 390px — WhatsApp
        // 20-76px up the inline-start edge, the launcher 20-76px up the
        // inline-end edge, this button 140-184px up the same inline-end edge,
        // a clear 64px above the launcher and nowhere near the other corner.
        // And a phone is where a 7,000px page most needs a way back to the top.
        // `.back-to-top-control` also drops it out of the stack entirely while
        // the cookie notice is up, which is when the corners are tightest.
        "back-to-top-control fixed z-50 flex h-11 w-11 items-center justify-center rounded-full border border-foreground/15 bg-surface-2/90 text-foreground-soft shadow-card backdrop-blur transition-all duration-300 hover:border-brand/40 hover:text-foreground",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
