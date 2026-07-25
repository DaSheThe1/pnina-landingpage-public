"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, PhoneCall } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { isValidPhone, type LeadSource } from "@/lib/contact-schema";
import { trackEvent } from "@/lib/analytics";
import { siteConfig } from "@/config/site";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

// Minimal lead-capture form: name + phone only, so there is the least possible
// friction between reading the page and her getting a number to call back.
//
// Do NOT add a "what would you like to talk about" field. See the note at the
// top of src/lib/contact-schema.ts — we never ask this audience to type
// anything about what happened to them into a web form.

type Values = {
  name: string;
  phone: string;
};

const fieldBase =
  "h-12 w-full rounded-lg border bg-foreground/[0.03] px-3.5 text-sm text-foreground outline-none transition-colors placeholder:text-subtle-foreground hover:border-foreground/22 focus:ring-3 focus:ring-brand-accent/20";

function borderFor(error?: string) {
  return error
    ? "border-destructive/40 focus:border-destructive/40"
    : "border-foreground/12 focus:border-brand-accent/60";
}

export function ContactForm({ source = "landing" }: { source?: LeadSource }) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("contactForm");
  const tFields = useTranslations("contactForm.fields");
  const tErrors = useTranslations("contactForm.errors");

  const [values, setValues] = useState<Values>({ name: "", phone: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState("");

  const set = (key: keyof Values, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  function validate() {
    const e: Partial<Record<keyof Values, string>> = {};
    if (values.name.trim().length < 2) e.name = tErrors("name");
    if (!isValidPhone(values.phone)) e.phone = tErrors("phone");
    return e;
  }

  async function submitForm() {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
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
      <div className="mb-6">
        <h2 className="text-lg tracking-tight text-foreground">
          {t("simpleTitle")}
        </h2>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
          {t("simpleLead")}
        </p>
      </div>

      <div className="space-y-5">
        <Field label={tFields("name.label")} error={errors.name}>
          <input
            className={cn(fieldBase, borderFor(errors.name))}
            placeholder={tFields("name.placeholder")}
            autoComplete="name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>
        <Field label={tFields("phone.label")} error={errors.phone}>
          <input
            type="tel"
            inputMode="tel"
            className={cn(fieldBase, borderFor(errors.phone))}
            placeholder={tFields("phone.placeholder")}
            autoComplete="tel"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </Field>
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
          "mt-7 h-12 w-full rounded-lg text-[15px]"
        )}
      >
        {isSubmitting ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            {t("sending")}
          </>
        ) : (
          <>
            <PhoneCall data-icon="inline-start" />
            {t("simpleSubmit")}
          </>
        )}
      </button>

      <p className="mt-3 text-center text-xs text-subtle-foreground">
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
    <div className="animate-in fade-in zoom-in-95 py-10 text-center duration-500">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-primary-foreground glow-brand">
        <CheckCircle2 className="h-8 w-8" />
      </div>
      <h3 className="mt-6 text-2xl font-medium tracking-tight">{t("title")}</h3>
      <p className="mx-auto mt-3 max-w-sm leading-7 text-muted-foreground">
        {t("text")}
      </p>
      <span className="mx-auto mt-6 block h-5 w-5 animate-spin rounded-full border-2 border-foreground/22 border-t-brand-soft" />
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* The label WRAPS the control. It used to sit beside it with neither an
          htmlFor/id pair nor a wrap, which means it was not the input's label
          at all: a screen reader announced "edit text, blank" with no idea what
          the field wanted, and clicking the word did not focus the box. */}
      <label className="block">
        <span className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground-soft">
          {label}
        </span>
        {children}
      </label>
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
