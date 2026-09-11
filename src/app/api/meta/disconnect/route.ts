/**
 * Disconnect a connected Facebook Page (owner only).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession, jsonError } from "@/lib/auth";
import { json } from "@/lib/api";

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);
  if (session.profile.role !== "owner") return jsonError("Only owners can disconnect Meta.", 403);

  const { page_id } = await request.json().catch(() => ({}));
  if (!page_id) return jsonError("page_id is required", 400);

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("meta_connections")
    .update({ connected: false, page_access_token: null })
    .eq("org_id", session.orgId)
    .eq("page_id", page_id);
  if (error) return jsonError(error.message, 500);
  return json({ ok: true });
}
