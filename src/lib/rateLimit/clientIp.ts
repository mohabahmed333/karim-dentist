/**
 * Best-effort client IP for rate-limit bucketing, not a security boundary
 * on its own — headers can be spoofed by a direct caller, but Vercel's edge
 * overwrites x-forwarded-for with the real connecting IP before the app
 * ever sees it, so this is trustworthy in production.
 */
export function extractClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  return "unknown";
}
