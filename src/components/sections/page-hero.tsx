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
    // `overflow-clip`, NOT `overflow-hidden`. The 52rem aurora below is wider
    // than a phone and does need clipping, but `hidden` makes an element a
    // SCROLL CONTAINER and `animation-timeline: view()` (globals.css §1)
    // resolves against the nearest one rather than the viewport — so while this
    // said `hidden`, the last reveal of EVERY page that uses this hero froze
    // half-faded and never came in (the description on /about, /contact,
    // /privacy, /terms and /accessibility, the button row on /lectures, all
    // between 0.55 and 0.69 opacity). `clip` clips the identical box and is not
    // a scroll container. Same trap, same fix, as in testimonials.tsx.
    //
    // `bg-background` is the paper veil (globals.css, the note beside the token):
    // every content band on the site paints it so that type has something to sit
    // on over the sand photograph. This header used to be bare, which was fine
    // while the sand was a whisper and is not fine now that it is a full-strength
    // floor — the muted description below sat straight on the photograph AND under
    // this section's own gold aurora, and measured 3.69:1 that way. With the veil
    // the audit puts the same line at 5.09:1 on /privacy at 390 (it was 4.65:1
    // before any of this). The HOME hero is the one band that stays bare,
    // deliberately: its copy is `--foreground` (12.3:1) and it is the one place the
    // photograph gets the whole screen.
    <section className="relative overflow-clip bg-background">
      {/* Soft centered hairline instead of a hard full-width rule. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-foreground/[0.08] to-transparent"
      />
      <div
        aria-hidden
        className="aurora-page pointer-events-none absolute -top-40 left-1/2 h-[34rem] w-[52rem] -translate-x-1/2 animate-aurora rounded-full blur-[90px]"
      />
      <div className="relative mx-auto w-full max-w-6xl px-6 pb-14 pt-8 lg:pb-16 lg:pt-12">
        <Reveal>
          <Eyebrow>{eyebrow}</Eyebrow>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-6 max-w-3xl text-[4.05rem] leading-[1.09] text-balance sm:text-[5.32rem]">
            {title}
          </h1>
        </Reveal>
        {description ? (
          <Reveal delay={160}>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {description}
            </p>
          </Reveal>
        ) : null}
        {children ? <Reveal delay={240}>{children}</Reveal> : null}
      </div>
    </section>
  );
}
