/**
 * Notification list + mark-as-read support.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession, jsonError } from "@/lib/auth";
import { json } from "@/lib/api";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);

  const url = new URL(request.url);
  const unread = url.searchParams.get("unread") === "true";
  const limit = Math.min(Number(url.searchParams.get("limit") || 20), 100);
  const supabase = createAdminClient();

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unread) query = query.eq("is_read", false);

  const { data, error } = await query;
  if (error) return jsonError(error.message, 500);

  return json({ data });
}

export async function PATCH(request: Request) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);

  const body = await request.json().catch(() => ({}));
  const supabase = createAdminClient();

  if (body.mark_all_read) {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("org_id", session.orgId).eq("is_read", false);
    if (error) return jsonError(error.message, 500);
    return json({ ok: true });
  }

  if (!body.id) return jsonError("id is required", 400);

  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", body.id).eq("org_id", session.orgId);
  if (error) return jsonError(error.message, 500);

  return json({ ok: true });
}
