# Media and the CDN

## The rule

Every image and video is declared in **`src/content/media.ts`**. Nothing else in
the codebase should reference a media path directly. A slot with `src: null`
renders a designed placeholder — a monogram panel for portraits, a branded poster
frame for videos — so a missing asset never produces a broken image or a 404.

That last part is deliberate: components only mount a `<video>` element when a
source actually exists. Pointing one at a file that isn't there makes every
visitor's browser issue a failing request on every page load.

## Images

Drop files in `public/`, then register them:

```ts
aboutPortrait: {
  src: "/images/portrait-about.webp",
  alt: "פנינה יושבת בחדר הטיפולים",   // real Hebrew alt text, always
  note: "…",
},
```

- Drop the **source** file in `public/images/` at whatever size you have. The
  build makes the small ones — see "Responsive images" below. Register the
  source path (`/images/foo.jpg`), never a generated variant.
- Portraits: 4:3 or square. The frames crop with `object-cover`, top-anchored.
- Alt text is required even on placeholders. This site publishes an accessibility
  statement; the alt text has to make it true.
- Testimonial screenshots go in `public/testimonials/` and are governed by
  [04-testimonials-policy.md](04-testimonials-policy.md).

## Responsive images (the static export has no image optimizer)

Production is `output: "export"`. There is no server, so Next's image optimizer
never runs and nothing is resized or converted at request time. The scaffold's
answer was `images: { unoptimized: true }`, which quietly means *every* `<Image>`
ships its full-resolution source — an 854 px JPEG into a 300 px frame, on a site
whose visitors are overwhelmingly on phones.

Three pieces replace it, and none of them are visible from a component:

| Piece | Job |
| --- | --- |
| `scripts/optimize-images.mjs` | Builds a WebP ladder into `public/images/optimized/` and writes `src/lib/image-manifest.generated.ts`. |
| `src/lib/image-loader.ts` | Custom `next/image` loader. Maps a requested width onto the nearest built variant. |
| `next.config.ts` → `images` | Points Next at the loader and pins `deviceSizes`/`imageSizes` to the same ladder. |

Components keep writing `<Image src="/images/pnina-about.jpg" …>`. Next calls
the loader once per width and assembles the `srcSet` itself.

```
public/images/pnina-about.jpg          ← the source, committed, referenced in media.ts
public/images/optimized/pnina-about-320.webp
public/images/optimized/pnina-about-480.webp   ← generated, committed
public/images/optimized/pnina-about-640.webp
public/images/optimized/pnina-about-854.webp
```

Rules worth knowing before touching it:

- **The variants are committed**, and the script runs in `prebuild`, in
  `build:static` and as its own step in the deploy workflow. It is idempotent —
  a variant newer than its source is skipped — so all three are cheap no-ops.
  Run it by hand with `pnpm optimize:images` after adding or replacing an image.
- **Orphans are swept.** Remove a source and its variants disappear on the next
  run. That matters for a testimonial screenshot: a stale variant must never
  outlive the redaction it was derived from.
- **An unknown path is served as authored.** No manifest entry → the loader
  returns `src` untouched. That is why an R2 URL discovered at runtime, or the
  `process-*.jpg` set (deliberately skipped — they are being replaced), still
  render. The cost is a `srcSet` of identical URLs for those four images, ~1 KB
  of HTML on the homepage, which goes away with them.
- **Screenshots get a higher WebP quality than photographs** (88 vs 80). The
  sentence in the bubble *is* the testimonial, and chroma smearing eats small
  text first.
- **Never re-encode a testimonial screenshot from `private-media/originals/`.**
  The script reads `public/`, which is the redacted copy. See
  [04-testimonials-policy.md](04-testimonials-policy.md).

## Videos — Cloudflare R2

The three clips stream from a Cloudflare R2 bucket (`pnina-website`). There is
**one** env var, the bucket's public base URL:

```
NEXT_PUBLIC_MEDIA_BASE_URL=https://media.<domain>
```

Each clip's filename inside the bucket lives in code, next to the slot it fills:

```ts
// src/content/media.ts
hero:  { src: "/video/pnina-hero.mp4",  remote: "first-video.mp4", … }
about: { src: "/video/pnina-about.mp4", remote: "aboutpage.mp4",   … }
```

`videoSrc(key)` resolves them, in this order:

1. the clip's `NEXT_PUBLIC_*_VIDEO_URL` override, if set (rarely needed);
2. `NEXT_PUBLIC_MEDIA_BASE_URL` + `remote` — the production path;
3. the bundled `public/` file — dev;
4. `null` → the component renders its poster panel and mounts no `<video>`.

**Always call `videoSrc(key)`.** A component that reads `videos[key].src`
directly silently ships a 20 MB MP4 from the site origin even when the bucket is
configured.

`NEXT_PUBLIC_*` are inlined at **build time**, so production sets them in
`.github/workflows/deploy-pages.yml`, where the live value is
`https://media.trickticmedia.com`.

> To reproduce the production export locally, mirror what the workflow does:
> `rm -rf src/app/api` in a scratch copy first. `output: "export"` cannot compile
> the POST handler in `/api/contact` or the `force-dynamic` `/api/health`, which
> is why the workflow deletes them from its checkout — and why `pnpm build:static`
> fails if you run it against the real tree.

**Why a CDN and not `public/`.** A large MP4 served from the site origin stalls
mid-playback on a cold cache — R2 is a real media origin with proper range
request handling and edge caching. It also keeps the git repo (and the public
mirror's permanent history) free of hundred-megabyte binaries.

### Setting up the bucket

1. Create an R2 bucket in the client's Cloudflare account.
2. Give it a **public read URL**. Either connect a custom domain
   (`media.<domain>`, preferred: stable, cacheable, yours) or enable the
   development URL under Settings → Public Development URL
   (`https://pub-<id>.r2.dev`, rate-limited and not meant for production).
3. Upload the MP4s (H.264, AAC, faststart, sized for mobile).
4. Set `NEXT_PUBLIC_MEDIA_BASE_URL` in the deploy workflow.

> ⚠️ The address Cloudflare shows as the **S3 API** endpoint
> (`https://<account-id>.r2.cloudflarestorage.com/<bucket>`) is **not** a public
> URL. It requires SigV4-signed requests and answers a browser with 401, so a
> `<video>` pointed at it plays nothing and falls back to the poster panel.
> Public read access is a separate switch, and enabling it is what step 2 is.

## The three videos

All three are vertical 9:16 phone recordings, which is why every video frame on
the site is portrait. A landscape replacement will letterbox inside one.

**Hero** (`first-video.mp4`) — autoplays muted on loop, click to expand. Muted is
not a choice: browsers block autoplay with sound, so this clip's burnt-in
captions carry its message.

**Thank-you** (`first-video.mp4`, same clip for now) — a personal message on
`/thank-you`, played with sound on tap. Something filmed on a phone is genuinely
better here than something polished.

**About** (`aboutpage.mp4`) — the long spoken piece on `/about`, click-to-play
with sound. The biggest object on the site, and the one that most wants the CDN.
A re-encode (21.50 MB → 11.60 MB, loudness-normalised — the source was clipping)
is waiting in `private-media/cdn-upload/`; uploading it is Daniel's action and
the numbers are in the README there.

### Captions

`videos.<key>.captions` in `src/content/media.ts` takes a WebVTT path, or `null`.
`null` mounts no `<track>` at all — the same rule as `src`, because a track
pointing at a missing file makes every browser fetch and fail on load.

- **hero / thank-you** — `null` permanently. Their Hebrew captions are burnt into
  the picture, which is what lets the muted autoplay carry a message at all.
- **about** — `null` and **owed**. It is 2 min 11 s of speech with nothing burnt
  in. The transcript comes from Pnina (`docs/12` §C); drop the result at
  `public/video/pnina-about.vtt` and point `captions` at it. Do not draft it from
  the audio — a wrong word in her own account of her story is not a typo.

Note that the thank-you video has **no fallback to another clip**. The template
this came from substituted its demo reel when the personal video was missing.
That is wrong here: it is a personal message at the most vulnerable point in the
funnel, and showing a different video instead would be a small lie. No video is
better than the wrong video.

---

# The bucket media system — content she can update herself

Everything above is *build-time* media: a file lands in `public/`, someone
registers it in `media.ts`, someone rebuilds and republishes. That is the right
model for the handful of assets the design depends on, and the wrong model for
"I got another lovely message today".

So there is a second path, added in v0.11.0 (`docs/12` §B D8). Pnina drops a
file into the R2 bucket through the Cloudflare dashboard and the site picks it
up **within about five minutes, with no rebuild and no deploy**.

## Bucket layout

```
sites/pnina/reviews/published/review-01.jpg     ← live on the site
sites/pnina/reviews/published/review-02.jpg
sites/pnina/reviews/draft/review-03.jpg         ← invisible. Never listed.
sites/pnina/gallery/published/photo-01.jpg
sites/pnina/videos/published/video-01.mp4
sites/pnina/videos/published/video-01-poster.jpg
sites/pnina/motion/published/…
```

- `sites/<site>/` — one bucket can serve several of Daniel's sites. This site
  owns `sites/pnina`, set as `MEDIA_SITE_PREFIX` in `worker/wrangler.toml`.
- `<collection>` — one of exactly four: `reviews`, `gallery`, `videos`,
  `motion`. It is an allowlist in the Worker, not a free-text parameter.
- `published/` vs anything else — **only `published/` is ever listed.** A file
  anywhere else in the bucket is invisible to the site.
- `<type>-<NN>.<ext>` — `NN` is the display order. `review-01` renders before
  `review-02`. A file with no number sorts last rather than disappearing.
- A video pairs with a poster of the same stem: `video-03.mp4` +
  `video-03-poster.jpg`.
- Only files directly under `published/` are listed (`delimiter: "/"`), so a
  subfolder created by accident cannot silently publish its contents.

## `published/` is the consent gate

This is the part that is not a naming convention.

`scripts/publish-public.sh` has a hard leak gate, and it stops at the edge of
git — it can read every file in the repo and **nothing inside a bucket**. A
screenshot uploaded to R2 bypasses it entirely. The review step therefore moves
into the bucket itself: a file becomes public the moment a person moves it into
`published/`, and that act *is* the clearance.

For testimonial screenshots that clearance is governed by
[04-testimonials-policy.md](04-testimonials-policy.md), and it applies to bucket
uploads exactly as it applies to files committed to `public/images/` — the
sender's consent, and no visible handle, display name, profile photo, phone
number or timestamp that pins a person down. Upload to `draft/` first, look at
the image, then move it.

One consequence to know about: a file discovered at runtime has **no per-image
alt text** — there is nowhere for it to live. Bucket screenshots fall back to
the section's generic Hebrew label. A screenshot whose exact wording matters
belongs in `testimonialShots` in `src/content/media.ts`, where it gets real alt
text and a permanent record of why it is there.

## How it is wired

| Piece | File |
| --- | --- |
| Listing endpoint | `worker/src/media.js` — `GET /api/media?collection=…` |
| Worker dispatch | `worker/src/index.js` (also routes `/api/contact`) |
| Bucket binding + config | `worker/wrangler.toml` |
| Client hook | `src/lib/use-bucket-media.ts` |
| Reference consumer | `src/components/sections/testimonials.tsx` |

The endpoint returns `[{ url, name, order }]`, sorted, edge-cached for 300 s
(`s-maxage=300, max-age=60`), CORS-restricted to the site origin. `url` is an
absolute public-bucket URL, so the browser fetches the objects straight from R2
and never through the Worker.

The fetch is a **relative** `/api/media` — same domain as the site, so there is
no CORS preflight, no second hostname to keep alive, and nothing to change when
the domain does.

### Failure is a designed state, not an outage

`useBucketMedia` returns `items: null` for *every* unhappy path — still loading,
Worker not deployed, bucket binding missing, offline, malformed JSON, **and an
empty collection**. `null` means "we learned nothing", and every caller falls
back to the build-time registry in `src/content/media.ts`.

It deliberately never returns an empty array. An empty array is
indistinguishable from "she deleted everything", and would blank a section of
the page because a Worker was briefly unreachable.

So the worst case is the site looking exactly as it does today.

### What Daniel has to do once, to turn it on

1. In the R2 bucket, create `sites/pnina/reviews/published/` (uploading a file
   into that path creates it — R2 has no real folders).
2. In `worker/wrangler.toml`, replace `PLACEHOLDER_R2_BUCKET_NAME` with the real
   bucket name — the same bucket already published at `MEDIA_PUBLIC_BASE`.
3. `cd worker && npx wrangler deploy`.
4. Check `https://peninaphaff.com/api/media?collection=reviews` returns JSON.

Until step 2 and 3 happen the endpoint answers
`500 {"ok":false,"error":"R2 bucket binding MEDIA_BUCKET is not configured…"}`
and the site quietly uses its built-in content. That is safe to leave
indefinitely.

### Reusing this in another repo

Nothing in `worker/src/media.js` or `src/lib/use-bucket-media.ts` is specific to
this site. To reuse:

1. Copy both files.
2. Add an R2 binding named `MEDIA_BUCKET` in that project's `wrangler.toml`.
3. Set `MEDIA_SITE_PREFIX` (e.g. `sites/othersite`) and `MEDIA_PUBLIC_BASE`.
4. Bind the Worker to `<host>/api/media`.
5. Edit `ALLOWED_COLLECTIONS` if that project has different collections.

The hook has no dependencies beyond React, and the Worker has none at all.
