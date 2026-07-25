"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
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
  const isOpen = openedOn !== null && openedOn === pathname;

  const open = useCallback(
    (nextSource: LeadSource = "landing") => {
      setSource(nextSource);
      setOpenedOn(pathname);
      // Funnel: the popup was opened (intent), distinct from a submitted lead.
      trackEvent("lead_dialog_opened");
    },
    [pathname]
  );
  const close = useCallback(() => setOpenedOn(null), []);

  // Lock body scroll + close on Escape while the popup is open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close]);

  return (
    <LeadDialogContext.Provider value={{ isOpen, open, close }}>
      {children}
      <LeadDialog isOpen={isOpen} onClose={close} source={source} />
    </LeadDialogContext.Provider>
  );
}

function LeadDialog({
  isOpen,
  onClose,
  source,
}: {
  isOpen: boolean;
  onClose: () => void;
  source: LeadSource;
}) {
  const t = useTranslations("leadDialog");

  // `isOpen` only becomes true from a user click on the client, so this never
  // runs `createPortal` during SSR — no separate "mounted" gate is needed.
  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4"
    >
      {/* Backdrop — solid dark, NO backdrop-blur. A backdrop-filter re-rasterises
          every frame while the panel above it animates; on phones that produced
          visible tearing/ghosting (a detached, blurred copy of the panel mid-
          animation). A flat translucent black fades in cleanly on any GPU. */}
      {/* Click-to-dismiss, but NOT a labelled button. It used to be one, sharing
          its accessible name with the real close button in the corner — so a
          screen reader announced two identical "סגירה" buttons, and the first
          one in the DOM was a full-viewport target whose centre is covered by
          the panel. Escape and the corner button cover every keyboard and AT
          path, so this layer is presentational. */}
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 animate-in fade-in cursor-default bg-black/75 duration-200"
      />

      {/* Panel — a single gentle fade + short rise. The earlier compound
          fade+zoom+slide stacked three transforms that stuttered on mobile;
          one small translate reads as a clean entrance and composites cheaply. */}
      <div className="ring-shine glow-brand relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-2 overflow-hidden rounded-2xl border border-brand/25 bg-surface-1 p-6 shadow-card duration-200 sm:p-8 sm:slide-in-from-bottom-0">
        <button
          type="button"
          aria-label={t("close")}
          onClick={onClose}
          className="absolute end-3.5 top-3.5 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        <ContactForm source={source} />
      </div>
    </div>,
    document.body
  );
}
