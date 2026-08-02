"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Dialog } from "@base-ui/react/dialog";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

import { ContactForm } from "@/components/sections/contact-form";
import type { LeadSource } from "@/lib/contact-schema";
import { trackEvent } from "@/lib/analytics";

// A single, app-wide lead-capture popup. The provider is mounted once in the
// locale layout; any CTA can open it via `useLeadDialog().open()` (or the
// `LeadButton` convenience component). It reuses the exact same name+phone
// `ContactForm` as the /contact page, so there is one lead flow → /api/contact
// → /thank-you, just surfaced as a popup for the lowest-friction conversion.

type LeadDialogContextValue = {
  isOpen: boolean;
  /** `source` tags the lead with the CTA that opened the dialog. */
  open: (source?: LeadSource) => void;
  close: () => void;
};

const LeadDialogContext = createContext<LeadDialogContextValue | null>(null);

export function useLeadDialog() {
  const ctx = useContext(LeadDialogContext);
  if (!ctx) {
    throw new Error("useLeadDialog must be used within <LeadDialogProvider>");
  }
  return ctx;
}

export function LeadDialogProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // We store the pathname the popup was opened on and DERIVE `isOpen` from it
  // rather than syncing with an effect. The instant the route changes — most
  // importantly after a successful submit hands off to /thank-you — `isOpen`
  // becomes false on its own, so the overlay never lingers over the next page.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const [source, setSource] = useState<LeadSource>("landing");
  const openerRef = useRef<HTMLElement | null>(null);
  const isOpen = openedOn !== null && openedOn === pathname;

  const open = useCallback(
    (nextSource: LeadSource = "landing") => {
      if (document.activeElement instanceof HTMLElement) {
        openerRef.current = document.activeElement;
      }
      setSource(nextSource);
      setOpenedOn(pathname);
      // Funnel: the popup was opened (intent), distinct from a submitted lead.
      trackEvent("lead_dialog_opened");
    },
    [pathname]
  );
  const close = useCallback(() => setOpenedOn(null), []);

  // No hand-rolled Escape handler or body-scroll lock here any more: the Base
  // UI `Dialog` below owns both, and with them the focus trap and the return of
  // focus to whichever button opened the popup — the reason the accessibility
  // round replaced the hand-built portal.
  //
  // The sideways jump a scroll lock causes on classic-scrollbar platforms is
  // still solved once, for the whole site, by `scrollbar-gutter: stable` on
  // `html` (see the long note in globals.css). Read that note before adding a
  // `padding-right` anywhere: it would move the document but not the fixed
  // header or the floating WhatsApp button, which is a worse version of the
  // same bug.
  return (
    <LeadDialogContext.Provider value={{ isOpen, open, close }}>
      {children}
      <LeadDialog
        isOpen={isOpen}
        onClose={close}
        openerRef={openerRef}
        source={source}
      />
    </LeadDialogContext.Provider>
  );
}

function LeadDialog({
  isOpen,
  onClose,
  openerRef,
  source,
}: {
  isOpen: boolean;
  onClose: () => void;
  openerRef: RefObject<HTMLElement | null>;
  source: LeadSource;
}) {
  const t = useTranslations("leadDialog");

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <Dialog.Portal>
        {/* A flat backdrop avoids the mobile GPU tearing caused by a full-screen
            backdrop-filter while the panel enters. */}
        <Dialog.Backdrop className="fixed inset-0 z-[119] bg-black/75 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto p-3 sm:p-4">
          <Dialog.Popup
            finalFocus={openerRef}
            className="ring-shine glow-brand relative my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-brand/25 bg-surface-1 p-6 shadow-card outline-none transition-all duration-200 data-[ending-style]:translate-y-2 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-2 data-[starting-style]:opacity-0 sm:max-h-[calc(100dvh-2rem)] sm:p-8"
          >
            <Dialog.Close
              aria-label={t("close")}
              className="absolute end-2.5 top-2.5 flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:ring-3 focus-visible:ring-brand-accent/35"
            >
              <X aria-hidden className="h-5 w-5" />
            </Dialog.Close>

            <div className="mb-6 pe-12">
              <Dialog.Title className="text-[2.2rem] text-foreground">
                {t("title")}
              </Dialog.Title>
              {/* The default sentence advertises Pnina's optional open field,
                  so the lecture variant — which hides that field — needs its
                  own. Same rule as `simpleLead` / `simpleLeadNoQuestion` in the
                  form itself: never point at a box that is not on screen. */}
              <Dialog.Description className="mt-1.5 text-sm leading-normal text-muted-foreground">
                {source === "lectures"
                  ? t("descriptionNoQuestion")
                  : t("description")}
              </Dialog.Description>
            </div>

            {/* One exception to "the same form everywhere": a lecture booking
                does not get Pnina's optional question. It asks a woman what she
                would most want to happen after their conversation — the wrong
                thing to put in front of a school counsellor booking a speaker
                (Daniel, 2026-07-29). Derived from `source` rather than passed in
                separately so there is no way for a lecture CTA to open the wrong
                variant; the field itself, and the schema, are unchanged.
                `showIntro={false}`: the dialog's own title and description above
                say the same thing, and two headings would be read out twice. */}
            <ContactForm
              source={source}
              showQuestion={source !== "lectures"}
              showIntro={false}
            />
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
