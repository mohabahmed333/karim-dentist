import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { createServiceClient } from "@/lib/supabase/service";
import { listStaffProfiles } from "@/services/profiles";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    const service = createServiceClient();
    const staff = await listStaffProfiles(service);
    return NextResponse.json({ staff });
  } catch (error) {
    console.error("[whatsapp/conversations/staff]", error);
    return NextResponse.json({ error: "Load failed" }, { status: 500 });
  }
}
