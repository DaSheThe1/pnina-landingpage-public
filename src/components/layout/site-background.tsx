"use client";

import { useEffect, useRef } from "react";

import { usePrefersReducedMotion } from "@/components/motion/use-reduced-motion";

/**
 * Site-wide flowing colour field. A single fixed layer that sits behind every
 * page (mounted once in the locale layout) so the home page, every subpage and
 * the thank-you page share one continuous, slowly drifting gradient.
 *
 * Two motions combine:
 *  - the blobs drift on their own slow CSS keyframe loops (`animate-drift-*`);
 *  - scrolling nudges the whole field — a gentle hue shift + parallax — driven
 *    by a single rAF-throttled scroll listener that writes `--bg-scroll`
 *    (0 → 1 down the page) which the CSS in `globals.css` reads.
 *
 * When the accessibility panel's motion switch is on we skip the scroll wiring
 * entirely and let the
 * global reduced-motion rule freeze the keyframes, leaving a calm static mesh.
 */
export function SiteBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // The accessibility panel's motion switch (and `?motion=force`), answered
    // in one place — see src/components/motion/use-reduced-motion.ts. The
    // device's own setting is deliberately not part of that answer.
    if (shouldReduceMotion) {
      el.style.setProperty("--bg-scroll", "0");
      return;
    }

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        // While the pearl scrub's stage is pinned it covers this entire layer
        // with an opaque canvas, and writing `--bg-scroll` here is what makes
        // the browser re-evaluate a full-viewport `saturate()` filter and a
        // parallax transform on a fixed layer, once per scroll frame, for a
        // picture nobody can see. The scrub stamps `data-scrub-pinned` on <html>
        // for exactly that stretch; globals.css §10a switches off the same
        // layer's filter and drift from the other side.
        //
        // Nothing pops on release. The value goes stale while pinned, and the
        // first scroll frame after unpinning writes the true one — into a
        // property whose consumers both carry a 900ms ease, over a section
        // 300vh tall, which is single-digit pixels of parallax spread across
        // most of a second.
        if (document.documentElement.hasAttribute("data-scrub-pinned")) return;
        const max =
          document.documentElement.scrollHeight - window.innerHeight;
        const frac = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        el.style.setProperty("--bg-scroll", frac.toFixed(4));
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [shouldReduceMotion]);

  return (
    <div ref={ref} aria-hidden className="site-bg">
      <div className="site-bg__inner">
        <span className="site-bg__blob site-bg__blob--1" />
        <span className="site-bg__blob site-bg__blob--2" />
        <span className="site-bg__blob site-bg__blob--3" />
        <span className="site-bg__blob site-bg__blob--4" />
        <span className="site-bg__blob site-bg__blob--5" />
      </div>
      {/* Gallery-lit depth: a cinematic vignette pools light on the centre, and
          an ultra-fine film grain removes the digital flatness of the wash. */}
      <div className="site-bg__vignette" />
      <div className="site-bg__noise" />
    </div>
  );
}
