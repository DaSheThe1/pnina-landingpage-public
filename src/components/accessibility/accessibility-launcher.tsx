"use client";

import { useState, type ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import {
  Accessibility,
  AlignJustify,
  Contrast,
  FileText,
  Link as LinkIcon,
  Mail,
  Minus,
  Pause,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";

import {
  textScaleSteps,
  useAccessibilityPreferences,
  type TextScale,
} from "@/components/accessibility/accessibility-provider";
import { siteConfig } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

function PreferenceButton({
  active,
  description,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  description: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  const t = useTranslations("accessibility");

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex min-h-11 w-full items-start gap-2 rounded-lg border p-2.5 text-start outline-none transition-colors sm:min-h-14 sm:gap-3 sm:rounded-xl sm:p-3",
        "focus-visible:border-brand-accent focus-visible:ring-3 focus-visible:ring-brand-accent/30",
        active
          ? "border-brand-accent/55 bg-brand/15"
          : "border-foreground/12 bg-foreground/[0.025] hover:border-foreground/25 hover:bg-foreground/[0.055]"
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md sm:mt-0.5 sm:size-8 sm:rounded-lg",
          active
            ? "bg-brand-deep text-brand-ink"
            : "bg-foreground/[0.06] text-brand-accent"
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium leading-tight text-foreground sm:text-base">
            {label}
          </span>
          <span className="hidden shrink-0 font-mono text-xs uppercase tracking-wider text-subtle-foreground sm:inline">
            {active ? t("enabled") : t("disabled")}
          </span>
        </span>
        <span className="mt-1 hidden text-xs leading-normal text-muted-foreground sm:block">
          {description}
        </span>
      </span>
    </button>
  );
}

function TextSizeControl({
  value,
  onChange,
}: {
  value: TextScale;
  onChange: (value: TextScale) => void;
}) {
  const t = useTranslations("accessibility");
  const currentIndex = textScaleSteps.indexOf(value);
  const canDecrease = currentIndex > 0;
  const canIncrease = currentIndex < textScaleSteps.length - 1;

  return (
    <div className="rounded-lg border border-foreground/12 bg-foreground/[0.025] p-2.5 sm:rounded-xl sm:p-3">
      <div>
        <p
          id="accessibility-text-size-label"
          className="text-sm font-medium leading-tight text-foreground sm:text-base"
        >
          {t("textSize")}
        </p>
        <p
          id="accessibility-text-size-description"
          className="mt-1 hidden text-xs leading-normal text-muted-foreground sm:block"
        >
          {t("textSizeDescription")}
        </p>
      </div>

      <div
        role="group"
        aria-labelledby="accessibility-text-size-label"
        aria-describedby="accessibility-text-size-description"
        className="mt-2 grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-1.5 sm:mt-3 sm:grid-cols-[2.75rem_1fr_2.75rem] sm:gap-2"
      >
        <button
          type="button"
          aria-label={t("decreaseTextSize")}
          disabled={!canDecrease}
          onClick={() => {
            if (canDecrease) onChange(textScaleSteps[currentIndex - 1]);
          }}
          className="flex size-10 items-center justify-center rounded-lg border border-foreground/15 text-foreground outline-none transition-colors hover:border-foreground/30 hover:bg-foreground/[0.06] focus-visible:border-brand-accent focus-visible:ring-3 focus-visible:ring-brand-accent/30 disabled:cursor-not-allowed disabled:opacity-35 sm:size-11"
        >
          <Minus aria-hidden className="size-4" />
        </button>
        <output
          aria-live="polite"
          aria-atomic="true"
          className="text-center font-mono text-xs font-medium tabular-nums text-brand-accent sm:text-sm"
        >
          {t("textSizeValue", { value })}
        </output>
        <button
          type="button"
          aria-label={t("increaseTextSize")}
          disabled={!canIncrease}
          onClick={() => {
            if (canIncrease) onChange(textScaleSteps[currentIndex + 1]);
          }}
          className="flex size-10 items-center justify-center rounded-lg border border-foreground/15 text-foreground outline-none transition-colors hover:border-foreground/30 hover:bg-foreground/[0.06] focus-visible:border-brand-accent focus-visible:ring-3 focus-visible:ring-brand-accent/30 disabled:cursor-not-allowed disabled:opacity-35 sm:size-11"
        >
          <Plus aria-hidden className="size-4" />
        </button>
      </div>
    </div>
  );
}

function OptionGroup({
  children,
  compactColumns = true,
  label,
}: {
  children: ReactNode;
  compactColumns?: boolean;
  label: string;
}) {
  return (
    <section>
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-accent sm:mb-2">
        {label}
      </h3>
      <div
        className={cn(
          "grid gap-2",
          compactColumns && "accessibility-compact-grid grid-cols-2"
        )}
      >
        {children}
      </div>
    </section>
  );
}

export function AccessibilityLauncher() {
  const t = useTranslations("accessibility");
  const [open, setOpen] = useState(false);
  const {
    textScale,
    enhancedContrast,
    comfortableSpacing,
    reduceMotion,
    emphasizeLinks,
    setTextScale,
    setEnhancedContrast,
    setComfortableSpacing,
    setReduceMotion,
    setEmphasizeLinks,
    reset,
  } = useAccessibilityPreferences();
  const reportHref = `mailto:${siteConfig.email}?subject=${encodeURIComponent(
    t("reportSubject")
  )}`;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {/* ── IT HAS TO BE FINDABLE AGAINST THE PHOTOGRAPH (2026-07-30) ──
          Daniel, testing the live site: *"the WhatsApp icon and the
          accessibility one on the phone won't always show... sometimes one of
          them is showing, sometimes none."*
          For the WhatsApp button that was a real bug (it hid itself — see
          floating-whatsapp.tsx). For THIS button it was not: it has no
          visibility logic at all and never unmounts, which was confirmed by
          measuring it at every route, scroll position and viewport — always
          `opacity: 1`, always on screen. What varied was the sand BEHIND it.
          It was `bg-surface-2` (cream) with a `/40` hairline border, designed
          when the canvas was flat cream and the veil was still on. On the
          full-strength photograph a cream disc with a 40%-opacity ring is
          camouflage, and it appears and disappears as the sand's tone changes
          under it — exactly the symptom he described.
          So: the opaque card surface (white on paper, the dark card colour on
          dark) and a real 2px bronze ring, which is the same answer the About /
          thank-you cards got in this pass — a solid surface is what reads on
          this background. Deliberately NOT as loud as the filled green FAB: it
          must be findable, not compete with the page's one conversion action. */}
      <Dialog.Trigger
        aria-label={t("launcher")}
        className="accessibility-launcher fixed z-[70] flex size-14 items-center justify-center rounded-full border-2 border-brand-accent/60 bg-surface-1 text-brand-accent shadow-card outline-none transition-colors hover:border-brand-accent hover:bg-surface-2 hover:text-brand-hover focus-visible:border-brand-accent focus-visible:ring-3 focus-visible:ring-brand-accent/35"
      >
        <Accessibility aria-hidden className="size-6" />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[129] bg-black/55 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-[130] flex items-end justify-center overflow-y-auto p-2 sm:items-center sm:p-6">
          {/* `accessibility-dialog` is the hook for the counter-zoom in
              globals.css: the panel is the one thing on the site that must NOT
              grow when the text-size control it contains is pressed. Read the
              note there before changing any size on this popup — the `w-full`
              and the two `max-h` values are corrected by name. */}
          <Dialog.Popup className="accessibility-dialog relative max-h-[62dvh] w-full max-w-md overflow-x-hidden overflow-y-auto rounded-2xl border border-brand/15 bg-surface-1 p-4 shadow-card outline-none transition-all duration-200 data-[ending-style]:translate-y-2 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-2 data-[starting-style]:opacity-0 sm:my-auto sm:max-h-[calc(100dvh-3rem)] sm:max-w-xl sm:border-brand/25 sm:p-6">
            <Dialog.Close
              aria-label={t("close")}
              className="absolute end-2.5 top-2.5 flex size-10 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:ring-3 focus-visible:ring-brand-accent/35 sm:end-3 sm:top-3 sm:size-11 sm:rounded-xl"
            >
              <X aria-hidden className="size-5" />
            </Dialog.Close>

            <div className="pe-11 sm:pe-12">
              <Dialog.Title className="text-lg font-medium tracking-tight text-foreground sm:text-xl">
                {t("title")}
              </Dialog.Title>
              <Dialog.Description className="mt-2 hidden text-sm leading-normal text-muted-foreground sm:block">
                {t("description")}
              </Dialog.Description>
            </div>

            <div className="mt-4 space-y-4 sm:mt-5 sm:space-y-5">
              <OptionGroup label={t("displayOptions")}>
                <TextSizeControl value={textScale} onChange={setTextScale} />
                <PreferenceButton
                  active={enhancedContrast}
                  description={t("enhancedContrastDescription")}
                  icon={<Contrast className="size-4" />}
                  label={t("enhancedContrast")}
                  onClick={() => setEnhancedContrast(!enhancedContrast)}
                />
              </OptionGroup>

              <OptionGroup label={t("readingOptions")}>
                <PreferenceButton
                  active={comfortableSpacing}
                  description={t("comfortableSpacingDescription")}
                  icon={<AlignJustify className="size-4" />}
                  label={t("comfortableSpacing")}
                  onClick={() => setComfortableSpacing(!comfortableSpacing)}
                />
                <PreferenceButton
                  active={emphasizeLinks}
                  description={t("emphasizeLinksDescription")}
                  icon={<LinkIcon className="size-4" />}
                  label={t("emphasizeLinks")}
                  onClick={() => setEmphasizeLinks(!emphasizeLinks)}
                />
              </OptionGroup>

              <OptionGroup compactColumns={false} label={t("motionOptions")}>
                <PreferenceButton
                  active={reduceMotion}
                  description={t("reduceMotionDescription")}
                  icon={<Pause className="size-4" />}
                  label={t("reduceMotion")}
                  onClick={() => setReduceMotion(!reduceMotion)}
                />
              </OptionGroup>
            </div>

            <p className="mt-5 hidden rounded-xl border border-foreground/10 bg-foreground/[0.025] p-3 text-xs leading-normal text-muted-foreground sm:block">
              {t("zoomGuidance")}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5">
              <Link
                href="/accessibility"
                data-a11y-no-underline
                onClick={() => setOpen(false)}
                className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-foreground/15 px-2 text-center text-xs font-medium text-foreground-soft outline-none transition-colors hover:border-foreground/25 hover:bg-foreground/[0.05] hover:text-foreground focus-visible:border-brand-accent focus-visible:ring-3 focus-visible:ring-brand-accent/35 sm:min-h-11 sm:gap-2 sm:px-3 sm:text-sm"
              >
                {t("statement")}
                <FileText aria-hidden className="size-4" />
              </Link>
              <a
                href={reportHref}
                data-a11y-no-underline
                onClick={() => setOpen(false)}
                className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-foreground/15 px-2 text-center text-xs font-medium text-foreground-soft outline-none transition-colors hover:border-foreground/25 hover:bg-foreground/[0.05] hover:text-foreground focus-visible:border-brand-accent focus-visible:ring-3 focus-visible:ring-brand-accent/35 sm:min-h-11 sm:gap-2 sm:px-3 sm:text-sm"
              >
                <Mail aria-hidden className="size-4" />
                {t("reportIssue")}
              </a>
            </div>

            <button
              type="button"
              onClick={reset}
              className="mt-2 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg text-xs text-muted-foreground outline-none transition-colors hover:bg-foreground/[0.04] hover:text-foreground focus-visible:ring-3 focus-visible:ring-brand-accent/35 sm:mt-3 sm:min-h-11 sm:text-sm"
            >
              <RotateCcw aria-hidden className="size-4" />
              {t("reset")}
            </button>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
