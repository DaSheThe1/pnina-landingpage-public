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
      onClick={() =>
        window.scrollTo({
          top: 0,
          behavior: shouldReduceMotion ? "auto" : "smooth",
        })
      }
      className={cn(
        // `end-6`, not `right-6`. This is an RTL document, so `right` is the
        // INLINE-START edge — which is exactly where FloatingWhatsApp lives,
        // and the two buttons sat on top of each other. Logical properties
        // everywhere on this site.
        //
        // Hidden on phones: on a small screen it crowds the WhatsApp button and
        // the bottom of the form. (The comment that used to be here blamed "the
        // calculator's sticky result bar" — there is no calculator on this
        // site; it came from the template this was scaffolded from.)
        "back-to-top-control fixed z-50 hidden h-11 w-11 items-center justify-center rounded-full border border-foreground/15 bg-surface-2/90 text-foreground-soft shadow-card backdrop-blur transition-all duration-300 hover:border-brand/40 hover:text-foreground md:flex",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
