import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Supabase redirects here after a password-reset (or any PKCE) email link is
 * clicked. Exchanging the code server-side is what lets the session cookie
 * be set for subsequent Server Component / proxy reads — the browser client
 * alone can't write that cookie.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/admin/reset-password";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  return NextResponse.redirect(
    new URL("/admin/forgot-password?error=invalid_link", url.origin),
  );
}
