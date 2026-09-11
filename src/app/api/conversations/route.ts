/**
 * List conversations for the org (with paging + filters).
 * Query: ?status=&ai_mode=&unread=&q=
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession, jsonError } from "@/lib/auth";
import { json } from "@/lib/api";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);
  const supabase = createAdminClient();
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const aiMode = url.searchParams.get("ai_mode");
  const unread = url.searchParams.get("unread");
  const q = url.searchParams.get("q");
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 100);

  let query = supabase
    .from("conversations")
    .select("*, customers(id,name,profile_pic_url,psid,tags)", { count: "exact" })
    .eq("org_id", session.orgId)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (status) query = query.eq("status", status);
  if (aiMode === "true") query = query.eq("ai_mode", true);
  if (aiMode === "false") query = query.eq("ai_mode", false);
  if (unread === "true") query = query.gt("unread_count", 0);
  if (q) query = query.ilike("last_message_preview", `%${q}%`);

  const { data, count, error } = await query.limit(limit);
  if (error) return jsonError(error.message, 500);
  return json({ data, count });
}
