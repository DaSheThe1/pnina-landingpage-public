"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Replays a gentle slide + fade enter animation on every route change. The App
 * Router keeps the layout mounted across navigations, so we force the page
 * subtree to re-mount by keying it on the pathname; the `.page-enter` class
 * (see globals.css) then plays once on mount. Under `prefers-reduced-motion`
 * the global reduced-motion rule neutralises the animation.
 *
 * The wrapper is a transparent flex column so the inner <main className="flex-1">
 * still grows to push the footer down (sticky-footer layout preserved).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter flex flex-1 flex-col">
      {children}
    </div>
  );
}
