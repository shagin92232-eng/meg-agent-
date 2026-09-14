/**
 * Orders (list + update status).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession, jsonError } from "@/lib/auth";
import { json } from "@/lib/api";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const customer_id = url.searchParams.get("customer_id");
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 100);

  const supabase = createAdminClient();
  let query = supabase
    .from("orders")
    .select("*, customers(name)")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (status) query = query.eq("status", status);
  if (customer_id) query = query.eq("customer_id", customer_id);

  const { data, error } = await query;
  if (error) return jsonError(error.message, 500);
  return json({ data });
}

export async function PATCH(request: Request) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);
  if (session.profile.role !== "owner" && session.profile.role !== "admin" && session.profile.role !== "support")
    return jsonError("Only owners/admins/support can update orders.", 403);

  const body = await request.json().catch(() => ({}));
  const { id, status, notes } = body;
  if (!id) return jsonError("id is required", 400);

  const supabase = createAdminClient();
  const updates: Record<string, unknown> = {};
  if (status !== undefined) updates.status = status;
  if (notes !== undefined) updates.notes = notes;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase.from("orders").update(updates).eq("id", id).eq("org_id", session.orgId).select("*").single();
  if (error) return jsonError(error.message, 500);
  return json({ data });
}

