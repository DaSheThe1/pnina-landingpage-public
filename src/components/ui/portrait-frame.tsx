import Image from "next/image";
import { ImageIcon } from "lucide-react";

import { siteConfig } from "@/config/site";
import { hasMedia, type ImageSlot } from "@/content/media";
import { cn } from "@/lib/utils";

/**
 * A photo frame that degrades to a quiet branded panel when the photo has not
 * been supplied yet.
 *
 * The placeholder deliberately says nothing about missing content — it ships to
 * real visitors if a photo never arrives, so it reads as a soft monogram plate
 * rather than a "TODO" box. The `note` on each slot in `src/content/media.ts`
 * is where the "what we asked for" information lives.
 */
export function PortraitFrame({
  slot,
  className,
  sizes = "(min-width: 1024px) 45vw, 90vw",
  priority = false,
  objectPosition = "object-top",
}: {
  slot: ImageSlot;
  className?: string;
  sizes?: string;
  priority?: boolean;
  objectPosition?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-foreground/[0.08] bg-surface-1 shadow-card",
        className
      )}
    >
      {hasMedia(slot) ? (
        <Image
          src={slot.src}
          alt={slot.alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn("object-cover", objectPosition)}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-surface-2 via-brand-wash to-surface-1">
          <span
            aria-hidden
            className="flex h-14 w-14 items-center justify-center rounded-full border border-brand/25 bg-surface-1/70 font-display text-[2.48rem] text-brand-accent"
          >
            {siteConfig.monogram}
          </span>
          <ImageIcon aria-hidden className="h-4 w-4 text-subtle-foreground" />
        </div>
      )}
    </div>
  );
}
