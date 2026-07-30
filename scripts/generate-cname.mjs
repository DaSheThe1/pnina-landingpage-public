#!/usr/bin/env node
/**
 * Writes `public/CNAME` from the domain in `src/config/site.ts`.
 *
 * GitHub Pages reads public/CNAME to decide which host it answers on, and every
 * canonical tag / og:url / sitemap entry comes from `siteConfig.url`. Those two
 * are the same fact, and for weeks they were two hand-maintained copies of it:
 * the CNAME said one host and the metadata said another, so the live site
 * advertised canonical URLs that returned 404.
 *
 * This runs as `prebuild` (so `pnpm build` and `pnpm build:static` both get it)
 * and rewrites the file whenever it disagrees with the config. There is nothing
 * to keep in sync by hand any more.
 *
 * It reads site.ts as TEXT rather than importing it: the file is TypeScript with
 * `@/` semantics, and a build step that needs a compiler to learn one string is
 * a build step that breaks.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sitePath = join(root, "src", "config", "site.ts");
const cnamePath = join(root, "public", "CNAME");

const source = readFileSync(sitePath, "utf8");
const match = source.match(/^const DOMAIN = "([^"]+)";/m);

if (!match) {
  console.error(
    "[generate-cname] Could not find `const DOMAIN = \"…\";` in src/config/site.ts.\n" +
      "The domain is the single source of truth for CNAME, canonicals and the sitemap —\n" +
      "if that declaration moved or was renamed, update this script in the same commit."
  );
  process.exit(1);
}

const domain = match[1].trim();
// A stray path, scheme or whitespace in CNAME makes Pages reject the custom
// domain silently, which is a very slow bug to find.
if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
  console.error(`[generate-cname] "${domain}" is not a bare hostname.`);
  process.exit(1);
}

const contents = `${domain}\n`;
let current = null;
try {
  current = readFileSync(cnamePath, "utf8");
} catch {
  // No CNAME yet — first run.
}

if (current === contents) {
  console.log(`[generate-cname] public/CNAME already ${domain}`);
} else {
  writeFileSync(cnamePath, contents, "utf8");
  console.log(`[generate-cname] wrote public/CNAME → ${domain}`);
}
