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
    // Its own audience (organisations booking a talk), so it gets full weight.
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
