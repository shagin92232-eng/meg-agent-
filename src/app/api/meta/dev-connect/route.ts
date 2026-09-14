/**
 * Dev-only manual Meta Page connection.
 * Allows pasting a Page Access Token + Page ID to test the full flow without a
 * fully reviewed Meta App. Gate: NEXT_PUBLIC_DEV_MODE=true + authenticated owner.
 *
 * PRODUCTION NOTE: disabled when dev mode is off. Real connections must use the
 * OAuth flow above.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession, jsonError } from "@/lib/auth";
import { encryptToken } from "@/lib/crypto";
import { createNotification } from "@/lib/notifications";
import { env } from "@/lib/config";

export async function POST(request: Request) {
  if (!env.app.devMode) return jsonError("Dev connection is disabled in production.", 403);
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);
  if (session.profile.role !== "owner") return jsonError("Only owners can connect Meta.", 403);

  const body = await request.json().catch(() => ({}));
  const { page_id, page_name, page_access_token } = body;
  if (!page_id || !page_access_token) return jsonError("page_id and page_access_token are required.", 400);

  const supabase = createAdminClient();
  const encrypted = encryptToken(page_access_token);
  const { error } = await supabase.from("meta_connections").upsert({
    org_id: session.orgId,
    page_id,
    page_name: page_name || null,
    page_access_token: encrypted,
    connected: true,
    webhook_verified: false,
    synced_at: new Date().toISOString(),
  }, { onConflict: "org_id,page_id" });
  if (error) return jsonError(`Connection failed: ${error.message}`, 500);

  void createNotification(session.orgId, "meta_connected", "Page connected (dev)", `Page ${page_name || page_id} connected in dev mode.`);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
}

