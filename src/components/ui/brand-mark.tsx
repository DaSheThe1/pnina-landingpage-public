import Image from "next/image";

import { siteConfig } from "@/config/site";
import { hasMedia, media } from "@/content/media";
import { cn } from "@/lib/utils";

/**
 * The logo lockup used in the header and footer.
 *
 * Renders the real logo when one exists (`media.logo`), otherwise a monogram
 * badge in the display serif. The monogram is a finished design, not a
 * stand-in — a small private practice with no logo is completely normal, so
 * this is safe to ship as-is.
 */
export function BrandMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  if (hasMedia(media.logo)) {
    return (
      <Image
        src={media.logo.src}
        // Deliberately empty. Both call sites (header and footer) render
        // siteConfig.name as text immediately beside this mark, so a real alt
        // makes a screen reader announce "פנינה פאף פנינה פאף" on every page.
        // The registry keeps its alt text for anywhere the logo stands alone.
        alt=""
        width={size}
        height={size}
        priority
        // The ring keeps a photographic mark from bleeding into the header
        // background at 32px; without it the crop edge just dissolves.
        className={cn(
          "rounded-full object-cover ring-1 ring-brand/30",
          className
        )}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-brand/30 bg-brand-wash font-display text-brand-accent",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.52 }}
    >
      {siteConfig.monogram}
    </span>
  );
}
