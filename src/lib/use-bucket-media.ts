"use client";

import { useEffect, useState } from "react";

/**
 * Read a media collection out of the R2 bucket at runtime, so the site owner can
 * add a photo, a screenshot or a clip without a rebuild.
 *
 * ── THE CONVENTION ────────────────────────────────────────────────────────────
 * Files live in the bucket as:
 *
 *   sites/<site>/<collection>/published/<type>-<NN>.<ext>
 *   sites/<site>/<collection>/draft/…            ← never listed
 *
 * `<NN>` is the display order (`review-01` before `review-02`), and a video
 * pairs with `…-<NN>-poster.jpg`. Only `published/` is visible — that folder is
 * the human review step, and for testimonial screenshots it is the CONSENT
 * gate. Read docs/04-testimonials-policy.md before anything lands there.
 *
 * The listing is served by `GET /api/media?collection=…` on the site's own
 * Cloudflare Worker (worker/src/media.js), which holds the bucket binding. The
 * fetch is a RELATIVE path on purpose: same domain, so there is no CORS
 * preflight, no second hostname to keep alive, and nothing to reconfigure if
 * the domain changes.
 *
 * ── FAILURE IS A FIRST-CLASS STATE ────────────────────────────────────────────
 * Any failure — Worker not deployed, bucket binding missing, offline, malformed
 * JSON, empty collection — resolves to `items: null`, never to an empty array.
 * `null` means "we learned nothing", and every caller is expected to fall back
 * to the build-time registry in `src/content/media.ts`. An empty array would be
 * indistinguishable from "she deleted everything", and would blank a section of
 * the page because a Worker was briefly unreachable.
 *
 * ── REUSING THIS ELSEWHERE ────────────────────────────────────────────────────
 * Dependency-free and self-contained by design: copy this file and
 * worker/src/media.js into another repo, point the Worker's R2 binding at that
 * project's bucket, change `MEDIA_SITE_PREFIX` in its wrangler.toml, and the
 * same convention works with no other changes.
 */

export type BucketMediaItem = {
  /** Absolute public URL of the object in the bucket. */
  url: string;
  /** Filename inside `published/`, e.g. `review-02.jpg`. */
  name: string;
  /** The `NN` from the filename; sort key, ascending. */
  order: number;
};

export type BucketMediaState = {
  /** The listing, or `null` while loading and on ANY failure. */
  items: BucketMediaItem[] | null;
  loading: boolean;
  /** Set when the fetch resolved to something unusable. Diagnostic only —
   *  callers should branch on `items === null`, not on this. */
  error: string | null;
};

/** Collections the Worker will serve. Mirrors ALLOWED_COLLECTIONS there. */
export type BucketCollection = "reviews" | "gallery" | "videos" | "motion";

function isItem(value: unknown): value is BucketMediaItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.url === "string" &&
    typeof item.name === "string" &&
    typeof item.order === "number" &&
    // Only ever render an https URL. The Worker builds these itself, but this
    // hook is the last thing between a bucket listing and an <img src>.
    item.url.startsWith("https://")
  );
}

export function useBucketMedia(collection: BucketCollection): BucketMediaState {
  const [state, setState] = useState<BucketMediaState>({
    items: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Aborted on unmount so a slow Worker cannot set state on a dead component
    // (and so a navigation away actually cancels the request).
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(
          `/api/media?collection=${encodeURIComponent(collection)}`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          throw new Error(`media endpoint responded ${response.status}`);
        }

        const data: unknown = await response.json();
        if (!Array.isArray(data) || !data.every(isItem)) {
          throw new Error("media endpoint returned an unexpected shape");
        }

        // An empty collection is treated as "nothing to say", i.e. null, so the
        // caller keeps its build-time content instead of rendering a gap.
        setState({
          items: data.length > 0 ? (data as BucketMediaItem[]) : null,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({
          items: null,
          loading: false,
          error: error instanceof Error ? error.message : "unknown error",
        });
      }
    }

    void load();
    return () => controller.abort();
  }, [collection]);

  return state;
}
