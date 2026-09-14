"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePermissionOrSelf } from "@/lib/api/requirePermission";
import {
  updateProfileDetails,
  updateDoctorIdentity,
  type ProfileDetailsInput,
} from "./mutations";
import {
  doctorIdentityUpsertSchema,
  type DoctorIdentityUpsertValues,
} from "./schemas";

/**
 * Saves the signed-in user's own profile.
 *
 * No permission key: maintaining your own details isn't privileged, so every
 * role can do it (same rationale as the change-password page). The row id is
 * taken from the session rather than the caller, so this can only ever write
 * the current user's row no matter what the client sends.
 */
export async function updateMyProfile(input: ProfileDetailsInput): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await updateProfileDetails(supabase, user.id, input);
}

/**
 * Edit of a doctor's specialty/bio/calendar color from the settings/doctors
 * page — either an admin editing any doctor, or a doctor editing themselves.
 * Gated the same way as saveDoctorHours.
 */
export async function saveDoctorIdentity(
  doctorId: string,
  input: DoctorIdentityUpsertValues,
): Promise<void> {
  const auth = await requirePermissionOrSelf("settings.edit", doctorId);
  if (auth.error) throw new Error("Forbidden");

  const parsed = doctorIdentityUpsertSchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid input");

  await updateDoctorIdentity(auth.supabase, doctorId, parsed.data);
}
