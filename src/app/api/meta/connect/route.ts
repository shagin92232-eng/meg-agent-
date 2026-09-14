/**
 * Start the Meta (Facebook) OAuth flow.
 * Redirects the browser to the Facebook Login dialog with a signed `state`
 * (CSRF token) that encodes the post-connection return URL.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { buildFacebookLoginUrl } from "@/lib/meta";
import { getServerSession, jsonError } from "@/lib/auth";
import { uniqueId } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);

  const returnTo = request.nextUrl.searchParams.get("returnTo") || "/dashboard/settings";
  const state = uniqueId("meta");
  const loginUrl = buildFacebookLoginUrl(state, returnTo);

  const res = NextResponse.redirect(loginUrl);
  res.cookies.set("meta_oauth_state", state, { httpOnly: true, secure: true, maxAge: 300, path: "/" });
  res.cookies.set("meta_oauth_return", returnTo, { httpOnly: true, secure: true, maxAge: 300, path: "/" });
  return res;
}

