import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { resolvePublicRewrite } from "@/lib/i18n/publicRewrite";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/showreel/demo")) {
    const headers = new Headers(request.headers);
    headers.set("x-showreel-demo", "1");
    return NextResponse.next({ request: { headers } });
  }

  // Public locale routing: "/" and every unprefixed public path resolve to
  // app/(site)/[locale="en"]/... internally. The browser URL never changes
  // — this is a rewrite, not a redirect — "/ar/*" already matches [locale]
  // directly and needs no rewrite. Must run, and return, before any
  // Supabase work below: the matcher now covers every public route, and
  // constructing the auth client on every homepage/case-study/featured hit
  // would be pure waste.
  const rewriteTarget = resolvePublicRewrite(path);
  if (rewriteTarget) {
    return NextResponse.rewrite(new URL(rewriteTarget, request.url));
  }

  // Nothing below this line applies outside /admin — skip the Supabase
  // client entirely for every other route the matcher now sees (api,
  // showreel, showreel2, the /en and /ar trees, static special files).
  if (!path.startsWith("/admin")) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    if (path !== "/admin/login") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLogin = path === "/admin/login";

  if (!isLogin && !user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (isLogin && user) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
