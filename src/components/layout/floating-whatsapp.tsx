"use client";

import { useTranslations } from "next-intl";

import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import { WhatsAppLink } from "@/components/ui/whatsapp-link";

// Persistent floating WhatsApp button. Pinned to the inline-start bottom corner
// so it never overlaps the inline-end BackToTop button. Opens WhatsApp with a
// ready-to-send Hebrew message, the single highest-converting action on mobile.
export function FloatingWhatsApp() {
  const t = useTranslations("whatsapp");

  return (
    // The button is fixed-positioned and rendered outside the header/main/footer
    // landmarks, which left it as orphaned content a screen-reader user browsing
    // by landmark would skip entirely. `complementary` gives it a home without
    // moving it in the DOM; the label names the landmark so it is findable.
    <div role="complementary" aria-label={t("landmark")}>
      <WhatsAppLink
        className="group fixed bottom-5 start-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_8px_30px_-6px_rgba(37,211,102,0.6)] transition-transform duration-300 hover:scale-110"
      >
        {/* Soft pulse ring */}
        <span
          aria-hidden
          className="absolute inset-0 animate-ping rounded-full bg-[#25d366] opacity-40 group-hover:opacity-60"
        />
        <WhatsAppIcon className="relative h-7 w-7" />
      </WhatsAppLink>
    </div>
  );
}
