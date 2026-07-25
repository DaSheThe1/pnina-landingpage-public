import { NextResponse } from "next/server";

import { APP_VERSION } from "@/lib/version";

// Lightweight liveness probe for nginx, Docker healthchecks, and uptime
// monitoring. No dependencies, no secrets — just confirms the server is up.
// `version` lets you verify which release is actually running after a deploy.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ ok: true, status: "healthy", version: APP_VERSION });
}
