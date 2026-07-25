"use client";

import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * A struck-through price in the offer funnel, made interactive: the crossing-out
 * is a hand-drawn-style X that "stamps" in when it scrolls into view, and the
 * price reveals an explanatory popover on hover (desktop) or tap (mobile) — so
 * the "this is not what you pay" story is spelled out on demand rather than
 * cluttering the card. Client-only; the X and price render fully without JS
 * (the stamp + popover are progressive enhancements).
 *
 * There is deliberately NO continuous "attention pulse" here. The template this
 * came from throbbed the struck price forever and forced that animation through
 * prefers-reduced-motion with !important. On this site a flashing discount reads
 * as pressure, which is the wrong register for the audience — see AGENTS.md.
 */
export function PriceCrossout({
  price,
  tip,
}: {
  price: string;
  tip: string;
}) {
  const [open, setOpen] = useState(false);
  const [stamp, setStamp] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const tipId = useId();

  // Play the stamp animation once the price is on screen.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setStamp(true);
          io.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Tap-to-open needs an explicit close on outside tap / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={wrapRef} className="group/price relative inline-block">
      <button
        type="button"
        aria-describedby={tipId}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex cursor-help items-center rounded-md px-1.5 text-3xl font-semibold tabular-nums text-foreground-soft/70 outline-none transition-transform duration-300 hover:-rotate-2 focus-visible:ring-2 focus-visible:ring-brand/50 sm:text-4xl"
      >
        {price}
        {/* Two strokes crossed corner-to-corner, drawn as a marker X. */}
        <svg
          aria-hidden
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className={cn(
            "pointer-events-none absolute inset-0 h-full w-full overflow-visible",
            stamp && "price-x-stamp"
          )}
        >
          <line
            x1="3"
            y1="14"
            x2="97"
            y2="86"
            stroke="var(--destructive)"
            strokeWidth="4"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1="97"
            y1="12"
            x2="4"
            y2="88"
            stroke="var(--destructive)"
            strokeWidth="4"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {/* Info affordance — signals the price is explained on tap/hover. */}
        <span
          aria-hidden
          className="absolute -top-1.5 end-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand-deep text-[9px] font-bold leading-none text-white shadow-[0_0_0_2px_var(--surface-1)]"
        >
          ?
        </span>
      </button>

      <span
        id={tipId}
        role="tooltip"
        className={cn(
          "absolute bottom-full left-1/2 z-30 mb-2.5 w-56 max-w-[15rem] -translate-x-1/2 rounded-xl border border-brand/25 bg-surface-2/95 px-3.5 py-2.5 text-center text-xs font-normal leading-5 text-foreground-soft shadow-card backdrop-blur-md transition-all duration-200",
          "pointer-events-none opacity-0 translate-y-1",
          "group-hover/price:pointer-events-auto group-hover/price:translate-y-0 group-hover/price:opacity-100 group-focus-within/price:translate-y-0 group-focus-within/price:opacity-100",
          open && "pointer-events-auto !translate-y-0 !opacity-100"
        )}
      >
        {tip}
        <span
          aria-hidden
          className="absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-e border-brand/25 bg-surface-2/95"
        />
      </span>
    </span>
  );
}
