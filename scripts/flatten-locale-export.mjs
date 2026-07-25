// Flattens the single-locale static export so Hebrew is served at the root.
//
// The app uses next-intl with a `[locale]` segment, so `next build`
// (output: export) emits every page under `out/he/...`. At runtime the next-intl
// middleware would strip that `/he` prefix — but middleware does NOT run on a
// static host like GitHub Pages. Meanwhile the rendered links are all unprefixed
// (`/`, `/about/`) because the default locale is hidden (`localePrefix:
// "as-needed"`). Result without this step: every URL 404s on GitHub Pages.
//
// Since the site is Hebrew-only, we hoist the contents of `out/he/` up into
// `out/` so the files line up with the unprefixed links and Hebrew lives at the
// root. (When a second locale is added, the site would move to a host that runs
// the next-intl middleware, and this step would be dropped.)
import { readdirSync, renameSync, rmdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const outDir = join(process.cwd(), "out");
const localeDir = join(outDir, "he");

if (!existsSync(localeDir)) {
  console.error(
    "[flatten-locale-export] out/he not found — did the static export run? Skipping."
  );
  process.exit(0);
}

for (const entry of readdirSync(localeDir)) {
  const from = join(localeDir, entry);
  const to = join(outDir, entry);
  if (existsSync(to)) {
    // No expected collisions (root holds _next/, assets, 404.html; he/ holds the
    // pages), but fail loudly rather than silently clobber if that changes.
    throw new Error(
      `[flatten-locale-export] refusing to overwrite existing out/${entry}`
    );
  }
  renameSync(from, to);
}

rmdirSync(localeDir);
console.log("[flatten-locale-export] hoisted out/he/* to out/ (Hebrew at root)");
