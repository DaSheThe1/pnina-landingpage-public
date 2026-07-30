import { imageVariants } from "@/lib/image-manifest.generated";

/**
 * Custom `next/image` loader for the static export.
 *
 * The site ships as `output: "export"`, so Next's image optimizer never runs —
 * with the usual `images: { unoptimized: true }` every `<Image>` degrades to a
 * bare `<img src="…jpg">` at full source resolution, on a site whose audience
 * is largely on phones.
 *
 * This loader closes that gap without touching a single component: it swaps the
 * authored path for the nearest pre-built WebP from
 * `public/images/optimized/`, which `scripts/optimize-images.mjs` generates and
 * records in the manifest. Next does the rest — it calls this once per width in
 * `deviceSizes`/`imageSizes` and assembles the `srcSet` itself.
 *
 * A path with no manifest entry (anything served from the R2 bucket at runtime,
 * or any file the optimizer skips) is returned untouched, so an unknown image is
 * always served as authored rather than 404ing on a variant that was never
 * built. That fallback is the reason this is safe to enable globally.
 */
export default function imageLoader({
  src,
  width,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  const widths = imageVariants[src];
  if (!widths || widths.length === 0) return src;

  // Smallest variant that still covers the requested width; the top rung when
  // nothing does (the source's own resolution — there is nothing sharper).
  const chosen = widths.find((w) => w >= width) ?? widths[widths.length - 1];

  const stem = src.replace(/^\/images\//, "").replace(/\.[^.]+$/, "");
  return `/images/optimized/${stem}-${chosen}.webp`;
}
