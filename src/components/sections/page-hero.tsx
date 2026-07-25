import type { ReactNode } from "react";

import { Eyebrow } from "@/components/sections/marketing-sections";
import { Reveal } from "@/components/ui/reveal";

export function PageHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden">
      {/* Soft centered hairline instead of a hard full-width rule. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-foreground/[0.08] to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[34rem] w-[52rem] -translate-x-1/2 animate-aurora rounded-full bg-[radial-gradient(circle_at_center,rgba(194,74,133,0.4),transparent_60%)] blur-[90px]"
      />
      <div className="relative mx-auto w-full max-w-6xl px-6 pb-14 pt-8 lg:pb-16 lg:pt-12">
        <Reveal>
          <Eyebrow>{eyebrow}</Eyebrow>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-6 max-w-3xl text-4xl leading-[1.08] tracking-tight text-balance sm:text-5xl">
            {title}
          </h1>
        </Reveal>
        {description ? (
          <Reveal delay={160}>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
              {description}
            </p>
          </Reveal>
        ) : null}
        {children ? <Reveal delay={240}>{children}</Reveal> : null}
      </div>
    </section>
  );
}
