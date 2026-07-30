import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

// Emit a static sitemap.xml at build time (required by `output: "export"` for the
// GitHub Pages build; a no-op for the standalone build). lastModified resolves to
// the build date.
export const dynamic = "force-static";

// lastModified is the build date — content only changes when a new image is
// deployed, so each deploy is an accurate "last modified" for every page.
// Hebrew-only site served at the root (no locale prefix).
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const pages: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    // Back in the sitemap as of Phase 1: the page now carries her real lecture
    // ("שכבות של פנינה") instead of placeholder copy, so it is linked from the
    // nav and indexed again (docs/12, D5).
    { path: "/lectures", priority: 0.9 },
    { path: "/contact", priority: 0.8 },
    { path: "/about", priority: 0.7 },
    { path: "/privacy", priority: 0.2 },
    { path: "/terms", priority: 0.2 },
    { path: "/accessibility", priority: 0.2 },
  ];

  return pages.map(({ path, priority }) => ({
    url: `${siteConfig.url}${path}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority,
  }));
}
