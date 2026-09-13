"use server";

import { createClient } from "@/lib/supabase/server";
import {
  updateProfileDetails,
  type ProfileDetailsInput,
} from "./mutations";

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
