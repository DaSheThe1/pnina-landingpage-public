"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

// Persistent floating WhatsApp button. Pinned to the inline-start bottom corner
// so it never overlaps BackToTop, which sits at the inline END (`end-6`). That
// was only true of BackToTop from v0.6.0 — it used the physical `right-6`, and
// in an RTL document "right" IS the inline start, so for the first release the
// two buttons shared a corner on desktop.
//
// Opens WhatsApp with a ready-to-send Hebrew message, the single
// highest-converting action on mobile.
export function FloatingWhatsApp() {
  const t = useTranslations("whatsapp");
  // This component lives in the layout and therefore does NOT remount on an
  // in-app navigation, so the effect below re-runs per route: the page with a
  // video may be the one you navigate TO.
  const pathname = usePathname();
  // It steps aside while a video's own controls are on screen — see below. The
  // state stores WHICH route it is hidden on rather than a bare boolean, so a
  // navigation un-hides it for free: the stored path stops matching, and the
  // component never has to reset itself from inside an effect.
  const [hiddenOn, setHiddenOn] = useState<string | null>(null);
  const hidden = hiddenOn === pathname;

  useEffect(() => {
    // ── IT MUST NOT SIT ON A VIDEO'S STOP BUTTON ──
    // Measured at 390x844 on the home page: the hero clip's pause control lands
    // at 782-818px down the viewport and this button covers 768-824px, on top
    // of it. WCAG 2.2.2 needs a way to stop moving content, and a way to stop
    // it that is under a fixed WhatsApp button is not one.
    //
    // Raising the button does not fix it, because the collision depends on
    // where the video happens to be as you scroll — at some scroll position it
    // always finds it. So the button yields instead: while any element that
    // declares `data-fab-avoid` is in the viewport, it fades out. On the home
    // page that is the hero clip, which carries the page's own CTAs anyway; the
    // moment it scrolls away the button is back.
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-fab-avoid]")
    );
    if (targets.length === 0) return;
    if (typeof IntersectionObserver === "undefined") return;

    const showing = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) showing.add(entry.target);
          else showing.delete(entry.target);
        }
        setHiddenOn(showing.size > 0 ? pathname : null);
      },
      // A slice off the bottom: the button only ever collides with something in
      // the lower part of the screen, and hiding it because a video is peeking
      // in at the very top would be an overreaction.
      { rootMargin: "-25% 0px 0px 0px" }
    );
    for (const el of targets) observer.observe(el);
    return () => observer.disconnect();
  }, [pathname]);

  return (
    // The button is fixed-positioned and rendered outside the header/main/footer
    // landmarks, which left it as orphaned content a screen-reader user browsing
    // by landmark would skip entirely. `complementary` gives it a home without
    // moving it in the DOM; the label names the landmark so it is findable.
    // `inert` while it is faded out, so a keyboard user cannot tab to a button
    // that is not on screen and a screen reader does not announce it.
    <div
      role="complementary"
      aria-label={t("landmark")}
      inert={hidden || undefined}
    >
      <WhatsAppLink
        noUnderline
        // Positioning comes from `.floating-whatsapp-control` (globals.css):
        // it keeps this button and the accessibility launcher on one balanced
        // row and lifts both while the cookie notice is visible.
        //
        // The show/hide is a plain toggle, deliberately without a fade: every
        // transition on this page is starved while the sand floor is running,
        // so a 300ms fade resolves in one to four seconds and the button is
        // simply missing for that long. Same finding, and the same answer, as
        // the header backdrop — the argument is written out there.
        className={cn(
          "floating-whatsapp-control group fixed z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_8px_30px_-6px_rgba(37,211,102,0.6)] transition-transform duration-300 hover:scale-110",
          hidden && "pointer-events-none opacity-0"
        )}
      >
        {/* A STATIC halo. It was `animate-ping` — an endless attention pulse in
            the corner of every page, which is exactly the mechanic rule 4 in
            CLAUDE.md forbids and exactly why the same class was stripped off
            the price (see marketing-sections.tsx). A ring that is simply there
            separates the button from the page just as well and never once asks
            for attention. */}
        <span
          aria-hidden
          className="absolute -inset-1 rounded-full bg-[#25d366]/25 transition-colors duration-300 group-hover:bg-[#25d366]/40"
        />
        <WhatsAppIcon className="relative h-7 w-7" />
      </WhatsAppLink>
    </div>
  );
}
