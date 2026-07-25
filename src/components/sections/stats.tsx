"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { Reveal } from "@/components/ui/reveal";
import { hasStats, stats } from "@/content/stats";

function Counter({
  to,
  prefix = "",
  suffix = "",
}: {
  to: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const node = ref.current;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!node || to === 0 || reduce) {
      setValue(to);
      return;
    }

    let raf = 0;
    let started = false;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting || started) return;
        started = true;
        const duration = 1400;
        let start: number | null = null;

        const tick = (t: number) => {
          if (start === null) start = t;
          const progress = Math.min((t - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(Math.round(to * eased));
          if (progress < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.5 }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);

  return (
    <span ref={ref}>
      {prefix}
      {value}
      {suffix}
    </span>
  );
}

export function StatsSection() {
  const t = useTranslations("stats");
  const labels = t.raw("items") as string[];

  // Every number is still a placeholder zero — render nothing rather than a row
  // of "0+". See the warning in src/content/stats.ts.
  if (!hasStats) return null;

  return (
    <section className="border-y border-foreground/[0.06] bg-background px-6 py-12 sm:py-16">
      {/* Phones: compact 2×2 cards — a single stacked column reads terribly.
          sm+ keeps the original open, borderless row. */}
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 sm:gap-8 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Reveal key={i} delay={i * 90} className="h-full">
            <div className="flex h-full flex-col justify-center rounded-xl border border-foreground/[0.08] bg-foreground/[0.02] p-4 text-center sm:block sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:text-start">
              <p className="text-3xl font-semibold tracking-tight text-gradient sm:text-4xl lg:text-5xl">
                <Counter to={stat.to} prefix={stat.prefix} suffix={stat.suffix} />
              </p>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground sm:mt-2 sm:text-sm sm:leading-6">
                {labels[i]}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
