"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import * as mutations from "./mutations";
import type { Callout, CalloutUpdate } from "./mutations";

export async function updateCallout(
  id: string,
  payload: CalloutUpdate,
): Promise<Callout> {
  const auth = await requirePermission("callout.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.updateCallout(auth.supabase, id, payload);
}
