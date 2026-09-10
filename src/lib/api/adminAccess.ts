/**
 * Admin authorization, split from the HTTP layer so it is testable without
 * `next/headers`.
 *
 * Mirrors the `public.is_admin()` SQL function used by every RLS policy:
 * an active `profiles` row with `role = 'admin'` and no `deleted_at`.
 * Keep the two definitions in sync.
 */

export type AdminProfile = {
  role: string | null;
  deleted_at: string | null;
};

/** The subset of the Supabase user that route handlers actually read. */
export type AdminUser = {
  id: string;
  email?: string | null;
};

export type AdminAccess = {
  user: AdminUser | null;
  isAdmin: boolean;
};

/** Pure role check. Anything unexpected is not an admin. */
export function isAdminProfile(
  profile: AdminProfile | null | undefined,
): boolean {
  if (!profile) return false;
  if (profile.deleted_at) return false;
  return profile.role === "admin";
}

/**
 * The slice of a Supabase client this module needs.
 *
 * Uses `PromiseLike` rather than `Promise` because PostgREST builders are
 * thenable but are not Promises. Callers holding a fully-typed
 * `SupabaseClient<Database>` should cast — its `from()` is keyed to the literal
 * table union, which does not structurally satisfy a `string` parameter, and
 * resolving the generics here trips TS2589.
 */
export type ProfileQueryClient = {
  auth: {
    getUser: () => PromiseLike<{ data: { user: AdminUser | null } }>;
  };
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => {
        maybeSingle: () => PromiseLike<{
          data: AdminProfile | null;
          error: unknown;
        }>;
      };
    };
  };
};

/**
 * Resolves the caller's identity and whether they are an admin.
 *
 * Fails closed: a missing profile, an unexpected role, or a failed lookup all
 * yield `isAdmin: false`. `user` is still returned when authenticated so
 * callers can distinguish 401 (not signed in) from 403 (signed in, not admin).
 */
export async function resolveAdminAccess(
  supabase: ProfileQueryClient,
): Promise<AdminAccess> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, isAdmin: false };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, deleted_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return { user, isAdmin: false };
  return { user, isAdmin: isAdminProfile(profile) };
}
