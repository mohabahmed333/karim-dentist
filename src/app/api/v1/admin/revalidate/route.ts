import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/api/requireAdmin";

const KNOWN_TAGS = new Set(["portfolio", "clinic-hours"]);

/**
 * Called from admin save handlers (which run in the browser — there's no
 * Server Action to revalidate from directly, see
 * src/services/admin/revalidate.ts) to purge the ISR cache that
 * getCachedPortfolioData()/getCachedClinicHours() populate. The 15-minute
 * revalidate floor on those caches is the safety net if this is ever
 * missed; this route is what makes an edit appear immediately instead of
 * up to 15 minutes later.
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const tags = Array.isArray(body?.tags) ? body.tags : [];
  const valid = tags.filter(
    (tag: unknown): tag is string => typeof tag === "string" && KNOWN_TAGS.has(tag),
  );

  for (const tag of valid) {
    revalidateTag(tag, "max");
  }

  return NextResponse.json({ revalidated: true, tags: valid });
}
