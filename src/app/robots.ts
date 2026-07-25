import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

// Emit a static robots.txt at build time (required by `output: "export"` for the
// GitHub Pages build; a no-op for the standalone build since the content is fixed).
export const dynamic = "force-static";

// Stance on AI crawlers: this is a marketing site — visibility in AI answer
// engines and assistants is the goal, so search/citation crawlers are
// explicitly welcomed and training crawlers are not blocked.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ["OAI-SearchBot", "PerplexityBot", "ChatGPT-User"],
        allow: "/",
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: "/api/",
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
