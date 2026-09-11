/**
 * Meta OAuth callback (Facebook Login redirect back to the app).
 *  1. Verify the CSRF `state` matches the cookie set in /api/meta/connect.
 *  2. Exchange the authorization `code` for a user access token.
 *  3. List Pages, pick the first manageable Page, fetch its page token.
 *  4. Store the encrypted page access token (server-only) in meta_connections.
 *  5. Subscribe the Page to the Messenger webhooks.
 *  6. Redirect back to /settings with a status flag.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { exchangeCodeForToken, getUserPages, subscribePageToWebhooks } from "@/lib/meta";
import { getServerSession, jsonError } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptToken } from "@/lib/crypto";
import { env } from "@/lib/config";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const stateParam = request.nextUrl.searchParams.get("state") || "";
  const savedState = request.cookies.get("meta_oauth_state")?.value;
  const returnToCookie = request.cookies.get("meta_oauth_return")?.value || "/settings";

  if (!code) return new Response("Missing code", { status: 400 });
  const stateParts = stateParam.split("|");
  const statePart = stateParts[0];
  const returnTo = decodeURIComponent(stateParts[1] || returnToCookie);
  if (!savedState || statePart !== savedState) return new Response("Invalid OAuth state (CSRF)", { status: 403 });

  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);

  try {
    const token = await exchangeCodeForToken(code);
    const pages = await getUserPages(token.access_token);
    const page = pages.find((p) => p.access_token) || pages[0];
    if (!page) return new Response("No manageable Facebook Page found.", { status: 400 });

    const supabase = createAdminClient();
    const encryptedPage = encryptToken(page.access_token);
    const encryptedUser = encryptToken(token.access_token);
    const { error: upErr } = await supabase.from("meta_connections").upsert({
      org_id: session.orgId,
      page_id: page.id,
      page_name: page.name,
      page_category: page.category,
      page_access_token: encryptedPage,
      user_access_token: encryptedUser,
      user_id: undefined,
      app_id: env.meta.appId,
      facebook_app_id: env.meta.appId,
      connected: true,
      webhook_verified: false,
      synced_at: new Date().toISOString(),
    });
    if (upErr) throw new Error(`Saving connection failed: ${upErr.message}`);

    // Subscribe the Page to webhook fields (best effort — real webhook is created in the app dashboard).
    let webhookOk = false;
    try {
      await subscribePageToWebhooks(page.id, page.access_token);
      await supabase.from("meta_connections").update({ webhook_verified: true }).eq("org_id", session.orgId).eq("page_id", page.id);
      webhookOk = true;
    } catch (e: any) {
      console.warn("[meta/callback] webhook subscribe failed:", e?.message || e);
    }

    void createNotification(session.orgId, "meta_connected", "Facebook Page connected", `Page "${page.name}" connected. Webhook: ${webhookOk ? "subscribed" : "pending manual setup"}.`);

    const res = NextResponse.redirect(new URL(returnTo, env.app.url));
    res.cookies.delete("meta_oauth_state");
    res.cookies.delete("meta_oauth_return");
    return res;
  } catch (e: any) {
    return new Response(`OAuth failed: ${e?.message || e}`, { status: 500 });
  }
}

async function createNotification(orgId: string, type: any, title: string, message: string) {
  const { createNotification: cn } = await import("@/lib/notifications");
  void cn(orgId, type, title, message);
}
