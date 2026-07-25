// Twitter/X reuses the Open Graph card image.
export { default, alt, size, contentType } from "./opengraph-image";

// Must be declared directly (route-segment config can't be re-exported). Renders
// once at build time — required by `output: "export"`, a no-op otherwise.
export const dynamic = "force-static";
