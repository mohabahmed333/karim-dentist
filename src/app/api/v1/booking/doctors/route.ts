import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listBookableDoctorsForService } from "@/services/service_doctors/queries";

/**
 * Every bookable doctor eligible for a service, soonest-available first.
 * Public, unauthenticated, read-only — safe without route-level auth or
 * rate limiting because list_bookable_doctors_for_service is itself the
 * security boundary (SECURITY DEFINER, projects only safe profile columns;
 * this route can't be used to read anything else off `profiles`).
 *
 * `service_id` omitted, blank, or not a real uuid (e.g. the public form's
 * "consultation" sentinel, which carries no row) all mean the same thing
 * as `p_service_id = NULL` in the RPC: every bookable doctor is eligible.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawServiceId = searchParams.get("service_id");
  const serviceId =
    rawServiceId && /^[0-9a-f-]{36}$/i.test(rawServiceId) ? rawServiceId : null;

  const supabase = await createClient();
  try {
    const doctors = await listBookableDoctorsForService(supabase, { serviceId });
    return NextResponse.json({ doctors });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load doctors";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
