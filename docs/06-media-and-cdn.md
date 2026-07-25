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

- Format: `.webp` (or `.jpg`), sized for mobile first. `pnpm optimize:images`
  runs `scripts/optimize-images.mjs` over `public/` to generate WebP.
- Portraits: 4:3 or square. The frames crop with `object-cover`, top-anchored.
- Alt text is required even on placeholders. This site publishes an accessibility
  statement; the alt text has to make it true.
- Testimonial screenshots go in `public/testimonials/` and are governed by
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
with sound. At ~21 MB it is the one clip that most wants the CDN.

Note that the thank-you video has **no fallback to another clip**. The template
this came from substituted its demo reel when the personal video was missing.
That is wrong here: it is a personal message at the most vulnerable point in the
funnel, and showing a different video instead would be a small lie. No video is
better than the wrong video.
