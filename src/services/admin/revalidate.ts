/**
 * Purges the public-site ISR cache after an admin save. Admin mutations
 * run in the browser (site_settings/services/faqs mutations all use
 * @/lib/supabase/client), so there's no Server Action to call
 * revalidateTag() from directly — this posts to a route handler that does
 * it instead.
 *
 * Fire-and-forget by design: a failed revalidation should never block or
 * fail the save the admin is actually waiting on. The 15-minute
 * revalidate floor on the underlying caches self-heals if this silently
 * fails (network blip, etc.).
 */
export function notifyRevalidate(tags: string[]): void {
  if (tags.length === 0) return;
  fetch("/api/v1/admin/revalidate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tags }),
    credentials: "same-origin",
  }).catch(() => {
    /* best-effort — the 15-minute revalidate floor self-heals */
  });
}
