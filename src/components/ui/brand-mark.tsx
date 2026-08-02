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
 *
 * HOW THE IMAGE IS FITTED IS THE REGISTRY'S CALL, not this component's:
 * `media.logo.shape` picks between the two, and defaults to the photograph
 * treatment. That is deliberate — the photographic shell cutout Pnina asked for
 * is expected at `public/brand/pearl-shell.png`, and when it lands the swap has
 * to be two fields in `src/content/media.ts` and nothing here. See the long note
 * on the `logo` slot in that file.
 */
export function BrandMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  if (hasMedia(media.logo)) {
    // Default is the photograph treatment, so an existing slot that says
    // nothing keeps behaving exactly as it did.
    const contain = media.logo.shape === "contain";
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
        // "circle": the ring keeps a photographic mark from bleeding into the
        // header background at 32px; without it the crop edge just dissolves.
        // "contain": the opposite is required. A transparent cutout draws its
        // own silhouette, so a circular crop would clip the dish and the ring
        // would trace a hairline around empty air. No crop, no rounding, no
        // ring, and `object-contain` so the whole shell fits the square box
        // whatever its aspect ratio turns out to be.
        className={cn(
          contain
            ? "object-contain"
            : "rounded-full object-cover ring-1 ring-brand/30",
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
