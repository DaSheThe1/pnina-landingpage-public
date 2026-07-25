import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

// Locale-aware navigation helpers. Use these everywhere instead of the bare
// next/link + next/navigation so links and programmatic pushes keep the active
// locale prefix (Hebrew unprefixed, English under /en).
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
