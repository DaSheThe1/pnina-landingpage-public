"use client";

import { useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, PhoneCall } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { isValidPhone, type LeadSource } from "@/lib/contact-schema";
import { trackEvent } from "@/lib/analytics";
import { siteConfig } from "@/config/site";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

// Minimal lead-capture form: name, phone, and ONE optional free-text field, so
// there is the least possible friction between reading the page and her getting
// a number to call back.
//
// The optional field carries Pnina's own question — "מה הכי היית רוצה שיקרה
// בעקבות השיחה שלנו?" — about what the visitor wants to HAPPEN, not about what
// happened to her. It must stay optional (no validation, no error state, no
// nagging copy), it must stay alone, and nothing about it is ever tracked. Read
// the header of src/lib/contact-schema.ts before changing any of that.
//
// `showQuestion` hides that one field, and ONLY that field. It exists for the
// lecture-booking audience (Daniel, 2026-07-29): her question is addressed to a
// woman weighing up personal accompaniment, and asking an HR lead booking a talk
// what she would most want to happen after their conversation reads as a
// mismatched form. Hiding it is purely a rendering choice — `question` is
// optional in `contactSchema` and in worker/src/contact.js, and an absent field
// has always been valid, so nothing on the server side changes. The hidden
// variant simply never puts `question` in the payload.

type Values = {
  name: string;
  phone: string;
  question: string;
};

/** Only the two fields that can fail validation. `question` never can. */
type RequiredField = "name" | "phone";

// The fields on this form are the entire point of the site, so their boundary
// and focus state use `--input` and `--ring` — the two tokens measured to clear
// WCAG 1.4.11's 3:1 against the page canvas, a white card AND the elevated lead
// dialog. The `border-foreground/12` they replaced resolved to about 1.3:1 in
// dark mode, i.e. no visible field edge at all. See the `--input` note in
// globals.css before touching these.
const fieldBase =
  "h-12 w-full rounded-lg border bg-foreground/[0.03] px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-subtle-foreground hover:border-foreground/45 focus:ring-3 focus:ring-ring/25";

function borderFor(error?: string) {
  return error
    ? "border-destructive/60 focus:border-destructive/60"
    : "border-input focus:border-ring";
}

export function ContactForm({
  source = "landing",
  showQuestion = true,
  showIntro = true,
  compact = false,
}: {
  source?: LeadSource;
  /** Renders Pnina's optional question. `false` only for lecture bookings. */
  showQuestion?: boolean;
  /** Renders the heading + lead sentence above the fields. `false` inside the
   *  lead popup, which carries its own dialog title and description. */
  showIntro?: boolean;
  /**
   * Tightens the layout so the whole form fits above the fold in the hero.
   *
   * ── WHY THIS EXISTS, AND WHAT IT IS NOT ALLOWED TO DO ──
   * Pnina asked (2026-08-02, via Daniel) for the headline, a sub-headline, the
   * video AND this form to be visible on a phone WITHOUT SCROLLING. At 390×844
   * that is about 680px of content under the 64px header, and the form at its
   * normal spacing does not fit inside what is left.
   *
   * So `compact` does exactly three things, all of them spacing:
   *   • name and phone share one row instead of stacking (saves ~58px);
   *   • the gaps between fields close up;
   *   • her question box starts at two rows instead of three (~14px).
   *
   * It does NOT remove a field, shorten a label, turn a label into a
   * placeholder, or touch validation. AGENTS.md rule 1 governs this form: her
   * question stays present, optional and in her wording, and both real labels
   * stay visible — this audience includes screen-reader users, and
   * placeholder-only labelling would be a real accessibility regression traded
   * for 44px. If the fold ever needs more room than this, take it from the
   * headline or the video, not from here.
   */
  compact?: boolean;
}) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("contactForm");
  const tFields = useTranslations("contactForm.fields");
  const tErrors = useTranslations("contactForm.errors");

  const [values, setValues] = useState<Values>({
    name: "",
    phone: "",
    question: "",
  });
  const [errors, setErrors] = useState<Partial<Record<RequiredField, string>>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState("");
  const fieldId = useId();
  const nameId = `${fieldId}-name`;
  const nameErrorId = `${fieldId}-name-error`;
  const phoneId = `${fieldId}-phone`;
  const phoneErrorId = `${fieldId}-phone-error`;
  // Pnina's optional question. It has no validation and therefore no error to
  // point at, but `Field` still needs both ids so the label is really the
  // textarea's label rather than a paragraph that happens to sit above it.
  const questionId = `${fieldId}-question`;
  const questionErrorId = `${fieldId}-question-error`;
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof Values, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key !== "question" && errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  // `question` is deliberately absent here. It can never block a submit.
  function validate() {
    const e: Partial<Record<RequiredField, string>> = {};
    if (values.name.trim().length < 2) e.name = tErrors("name");
    if (!isValidPhone(values.phone)) e.phone = tErrors("phone");
    return e;
  }

  async function submitForm() {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      (e.name ? nameRef : phoneRef).current?.focus();
      return;
    }

    setIsSubmitting(true);
    setServerError("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          phone: values.phone.trim(),
          // Omitted entirely when she left it blank — and unconditionally when
          // the field was never rendered — so a lead that skipped it is
          // indistinguishable from one sent before the field existed.
          ...(showQuestion && values.question.trim()
            ? { question: values.question.trim() }
            : {}),
          source,
          language: locale,
          company: "",
        }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !result.ok) {
        setServerError(
          result.error ?? t("serverError", { email: siteConfig.email })
        );
        setIsSubmitting(false);
        return;
      }
      // Funnel: a successful lead. No identifying fields — just the event.
      trackEvent("lead_submitted");
      // Hand off to the dedicated thank-you page (video + next steps). Keep the
      // submitting/redirecting state on until the navigation lands so the form
      // never flashes back to an interactive state.
      setDone(true);
      router.push("/thank-you");
    } catch {
      setServerError(t("serverError", { email: siteConfig.email }));
      setIsSubmitting(false);
    }
  }

  if (done) return <RedirectingCard />;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submitForm();
      }}
      noValidate
    >
      {showIntro ? (
        <div className="mb-6">
          <h2 className="text-[2.2rem] text-foreground">
            {t("simpleTitle")}
          </h2>
          {/* The default lead sentence advertises the open field ("יש גם שדה
              פתוח"), so the variant that hides that field needs its own line —
              otherwise the dialog points at a box that is not on screen. The
              replacement stays neutral in how it addresses the reader: the rest
              of this dialog speaks to a woman in the feminine singular, and one
              plural sentence dropped into the middle of it would read as a
              different person talking. */}
          <p className="mt-1.5 text-sm leading-normal text-muted-foreground">
            {showQuestion ? t("simpleLead") : t("simpleLeadNoQuestion")}
          </p>
        </div>
      ) : null}

      <div className={compact ? "space-y-3" : "space-y-5"}>
        {/* Compact puts the two required fields side by side. `min-w-0` on the
            grid children is load-bearing: a grid item's default `min-width:auto`
            is its content's intrinsic width, and the phone placeholder
            ("050-0000000") is wide enough to push the row past 390px and give
            the whole page a horizontal scrollbar. */}
        <div
          className={cn(
            compact && "grid grid-cols-2 gap-3 [&>*]:min-w-0",
            !compact && "space-y-5"
          )}
        >
          <Field
            id={nameId}
            errorId={nameErrorId}
            label={tFields("name.label")}
            error={errors.name}
          >
            <input
              ref={nameRef}
              id={nameId}
              required
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? nameErrorId : undefined}
              className={cn(fieldBase, borderFor(errors.name))}
              placeholder={tFields("name.placeholder")}
              autoComplete="name"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>
          <Field
            id={phoneId}
            errorId={phoneErrorId}
            label={tFields("phone.label")}
            error={errors.phone}
          >
            <input
              ref={phoneRef}
              id={phoneId}
              type="tel"
              inputMode="tel"
              required
              aria-invalid={errors.phone ? true : undefined}
              aria-describedby={errors.phone ? phoneErrorId : undefined}
              className={cn(fieldBase, borderFor(errors.phone))}
              placeholder={tFields("phone.placeholder")}
              autoComplete="tel"
              value={values.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>
        </div>
        {/* Her question, and the only free-text box on the site. It carries no
            placeholder on purpose: an example answer in grey would read as an
            instruction about how much to write. Empty is a perfectly good
            answer, and the visible "(לא חובה)" says so.

            Not rendered for lecture bookings — see the `showQuestion` note in
            the header of this file. */}
        {showQuestion ? (
          <Field
            id={questionId}
            errorId={questionErrorId}
            label={tFields("question.label")}
            hint={tFields("question.optional")}
          >
            <textarea
              id={questionId}
              rows={compact ? 2 : 3}
              maxLength={300}
              className={cn(
                fieldBase,
                borderFor(),
                "h-auto resize-y py-2.5 leading-normal",
                compact ? "min-h-14" : "min-h-24"
              )}
              value={values.question}
              onChange={(e) => set("question", e.target.value)}
            />
          </Field>
        ) : null}
      </div>

      {serverError ? (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {serverError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          buttonVariants({ variant: "brand" }),
          "h-12 w-full rounded-lg text-base",
          compact ? "mt-3.5" : "mt-7"
        )}
      >
        {isSubmitting ? (
          <>
            <span
              aria-hidden
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            />
            {t("sending")}
          </>
        ) : (
          <>
            <PhoneCall data-icon="inline-start" />
            {t("simpleSubmit")}
          </>
        )}
      </button>

      {/* The one thing allowed below the fold in the compact hero: it is
          reassurance about what happens to her details AFTER she sends them, so
          it does not have to be read before the button is pressed. Still
          rendered, still in the DOM, still announced in order. */}
      <p
        className={cn(
          "text-center text-xs text-subtle-foreground",
          compact ? "mt-2.5" : "mt-3"
        )}
      >
        {t("simpleNote")}
      </p>
    </form>
  );
}

// Brief bridge state shown while we navigate to /thank-you. The thank-you page
// (video + next steps) is the real confirmation — this just covers the gap so
// the form never flashes back to an editable state after a successful send.
function RedirectingCard() {
  const t = useTranslations("contactForm.redirecting");
  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-in fade-in zoom-in-95 py-10 text-center duration-500"
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-primary-foreground glow-brand">
        <CheckCircle2 aria-hidden className="h-8 w-8" />
      </div>
      <h3 className="mt-6 text-2xl font-medium tracking-tight">{t("title")}</h3>
      <p className="mx-auto mt-3 max-w-sm leading-relaxed text-muted-foreground">
        {t("text")}
      </p>
      <span
        aria-hidden
        className="mx-auto mt-6 block h-5 w-5 animate-spin rounded-full border-2 border-foreground/22 border-t-brand-soft"
      />
    </div>
  );
}

function Field({
  id,
  errorId,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  errorId: string;
  label: string;
  /** Rendered quietly beside the label, e.g. "(לא חובה)". */
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* The label WRAPS the control. It used to sit beside it with neither an
          htmlFor/id pair nor a wrap, which means it was not the input's label
          at all: a screen reader announced "edit text, blank" with no idea what
          the field wanted, and clicking the word did not focus the box. */}
      <label htmlFor={id} className="block">
        <span className="mb-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-sm font-medium text-foreground-soft">
          {label}
          {hint ? (
            <span className="text-xs font-normal text-subtle-foreground">
              {hint}
            </span>
          ) : null}
        </span>
        {children}
      </label>
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 text-xs text-destructive"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
