"use client";

import { useTranslations } from "next-intl";

import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";

// Persistent floating WhatsApp button. Pinned to the inline-start bottom corner
// so it never overlaps BackToTop, which sits at the inline END (`end-6`). That
// was only true of BackToTop from v0.6.0 — it used the physical `right-6`, and
// in an RTL document "right" IS the inline start, so for the first release the
// two buttons shared a corner on desktop.
//
// Opens WhatsApp with a ready-to-send Hebrew message, the single
// highest-converting action on mobile.
// ── THIS BUTTON NEVER HIDES. (2026-07-30, Daniel, testing the live site) ──
// It used to yield: an IntersectionObserver watched for any `[data-fab-avoid]`
// element (in practice the hero clip) entering the lower 75% of the viewport and
// toggled the button to `opacity-0` while one was there. The reason was real —
// the hero clip's pause control and this button shared the bottom-inline-start
// corner at 390px, and WCAG 2.2.2's "stop the motion" control must not sit under
// a fixed button.
//
// But the cure was worse. Daniel: *"the WhatsApp icon ... won't always show ...
// It's a little bit laggy ... on the top of the main page [it doesn't show and]
// I don't see a reason why it shouldn't."* He is right on both counts: the home
// page opens ON the hero clip, so the site's highest-converting action was
// absent exactly where a visitor first looks for it, and because the toggle was
// a hard opacity flip with no fade (deliberately, so it could not be starved by
// the sand animation) it popped in and out as the clip crossed the threshold —
// indistinguishable from a bug.
//
// The collision is now solved on the VIDEO's side instead: both of the hero
// clip's controls moved to the TOP edge of the frame, which this fixed bottom
// corner can never reach (hero-video.tsx, and message-video.tsx for the same
// reason). That is the right place for the fix — two controls moved once,
// rather than a whole button appearing and disappearing on every scroll.
//
// So: no observer, no state, no `inert`, no `data-fab-avoid` anywhere in the
// tree. If a new video or overlay ever collides with this corner, MOVE THAT
// CONTROL. Do not teach this button to hide again.
export function FloatingWhatsApp() {
  const t = useTranslations("whatsapp");

  return (
    // The button is fixed-positioned and rendered outside the header/main/footer
    // landmarks, which left it as orphaned content a screen-reader user browsing
    // by landmark would skip entirely. `complementary` gives it a home without
    // moving it in the DOM; the label names the landmark so it is findable.
    // There is no `inert` any more — it was tied to the hidden state, and the
    // button is never hidden now, so it is always tabbable and always announced.
    <div role="complementary" aria-label={t("landmark")}>
      <WhatsAppLink
        noUnderline
        // Positioning comes from `.floating-whatsapp-control` (globals.css):
        // it keeps this button and the accessibility launcher on one balanced
        // row and lifts both while the cookie notice is visible.
        className="floating-whatsapp-control group fixed z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_8px_30px_-6px_rgba(37,211,102,0.6)] transition-transform duration-300 hover:scale-110"
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
