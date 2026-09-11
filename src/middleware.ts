/**
 * Next.js middleware — enforces authentication for protected routes.
 *
 * Public paths: /login, /api/auth/*, /api/webhook/messenger, /api/dev/*,
 * static assets. Everything else requires a valid Supabase session; on failure
 * the user is redirected to /login. Session refresh is handled here so the
 * cookie is kept in sync.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/config";

const PUBLIC_PREFIXES = ["/login", "/api/auth/", "/api/webhook/messenger", "/api/dev/", "/_next/", "/favicon.ico", "/api/health"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p) || pathname === p)) return NextResponse.next();

  const response = NextResponse.next();
  const supabase = createClient(env.supabase.url, env.supabase.anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) =>
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
