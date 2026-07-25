// Lightweight in-memory, per-key rate limiter (fixed window).
//
// The site runs as a single Next.js container on the VPS, so a module-level Map
// is enough to stop someone scripting the contact endpoint — no Redis/Upstash
// needed at this scale. State is per-instance and resets on restart, which is
// an acceptable trade-off here. If the app is ever scaled to multiple
// instances, swap this for a shared store (Upstash/Redis).

type Window = { count: number; resetAt: number };

const store = new Map<string, Window>();

// Prune threshold: once the map grows past this, drop expired windows on the
// next call so a stream of unique IPs can't grow memory unbounded.
const PRUNE_AT = 5000;

function prune(now: number) {
  for (const [key, win] of store) {
    if (now >= win.resetAt) store.delete(key);
  }
}

export type RateLimitResult = { ok: boolean; retryAfterSeconds: number };

/**
 * Records a hit for `key` and reports whether it is allowed.
 * @param limit    max hits allowed per window
 * @param windowMs window length in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): RateLimitResult {
  if (store.size > PRUNE_AT) prune(now);

  const win = store.get(key);
  if (!win || now >= win.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  if (win.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((win.resetAt - now) / 1000) };
  }

  win.count += 1;
  return { ok: true, retryAfterSeconds: 0 };
}

/** Best-effort client IP from common proxy headers. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
