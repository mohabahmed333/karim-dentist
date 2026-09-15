import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { createServiceClient } from "@/lib/supabase/service";

type ServerSupabase = Awaited<ReturnType<typeof createServerClient>>;
type ServiceSupabase = ReturnType<typeof createServiceClient>;

export type CreateAccountInput = {
  email: string;
  displayName: string;
  tempPassword: string;
  roleId: string;
  /** Set when the new account is a doctor — written to the same profiles row. */
  specialty?: string | null;
  bio?: string | null;
  calendar_color?: string | null;
};

/**
 * Creates the auth.users row (service-role only) and the matching profiles
 * row in one call. Must run server-side, never from a client component.
 */
export async function createAccount(
  service: ServiceSupabase,
  input: CreateAccountInput,
): Promise<{ id: string }> {
  const { data: created, error: createError } =
    await service.auth.admin.createUser({
      email: input.email,
      password: input.tempPassword,
      email_confirm: true,
      user_metadata: { full_name: input.displayName },
    });
  if (createError || !created.user) {
    throw createError ?? new Error("Failed to create auth user");
  }

  const { error: profileError } = await service.from("profiles").upsert({
    id: created.user.id,
    display_name: input.displayName,
    role_id: input.roleId,
    ...(input.specialty !== undefined ? { specialty: input.specialty } : {}),
    ...(input.bio !== undefined ? { bio: input.bio } : {}),
    ...(input.calendar_color !== undefined
      ? { calendar_color: input.calendar_color }
      : {}),
  });
  if (profileError) {
    await service.auth.admin.deleteUser(created.user.id);
    throw profileError;
  }

  return { id: created.user.id };
}

export async function updateAccountRole(
  supabase: ServerSupabase,
  profileId: string,
  roleId: string,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ role_id: roleId })
    .eq("id", profileId);
  if (error) throw error;
}

export async function deactivateAccount(
  supabase: ServerSupabase,
  profileId: string,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", profileId);
  if (error) throw error;
}

export async function reactivateAccount(
  supabase: ServerSupabase,
  profileId: string,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ deleted_at: null })
    .eq("id", profileId);
  if (error) throw error;
}
