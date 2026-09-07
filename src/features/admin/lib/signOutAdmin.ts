export const ADMIN_LOGIN_PATH = "/admin/login";

type SignOutFn = () => Promise<{ error: { message: string } | null }>;

export async function signOutAdminSession(
  signOut: SignOutFn,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await signOut();
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
