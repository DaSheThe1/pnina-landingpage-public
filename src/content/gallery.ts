import { gallery, type ImageSlot } from "@/content/media";

/**
 * Photo gallery feed.
 *
 * Sourced from `src/content/media.ts` so there is exactly one file that lists
 * client media. Empty by default: the gallery section removes itself from the
 * page rather than rendering an empty shell, so the site reads as finished
 * whether or not photos ever arrive.
 *
 * TODO(client): decide whether a gallery belongs here at all. For an architect
 * it *is* the product; for a private practice it reads as filler unless the
 * photos are genuinely hers (a workshop, a lecture, her space).
 * See docs/03-open-decisions.md.
 */
export type GalleryImage = ImageSlot & { src: string; width: number; height: number };

export const galleryImages = gallery.filter(
  (image): image is GalleryImage =>
    typeof image.src === "string" && !!image.width && !!image.height
);

/** Sections gate on this rather than rendering an empty carousel. */
export const hasGallery = galleryImages.length > 0;
