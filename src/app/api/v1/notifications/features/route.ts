import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/api/requirePermission";
import { createServiceClient } from "@/lib/supabase/service";
import {
  SWITCHABLE_FEATURES,
  loadFeatureSwitches,
  setFeatureSwitch,
} from "@/services/patient_notifications/featureSwitches";

export const runtime = "nodejs";

const patchSchema = z.object({
  feature: z.enum(SWITCHABLE_FEATURES),
  enabled: z.boolean(),
});

export async function GET() {
  const auth = await requirePermission("settings.view");
  if (auth.error) return auth.error;
  return NextResponse.json(
    { switches: await loadFeatureSwitches(createServiceClient()) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: Request) {
  const auth = await requirePermission("settings.edit");
  if (auth.error) return auth.error;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    // The enum is the guard: an unknown key would create a switch nothing reads.
    return NextResponse.json({ error: "Unknown feature" }, { status: 400 });
  }

  const service = createServiceClient();
  const ok = await setFeatureSwitch(service, parsed.data.feature, parsed.data.enabled);
  if (!ok) return NextResponse.json({ error: "Could not save" }, { status: 400 });
  return NextResponse.json({ switches: await loadFeatureSwitches(service) });
}
