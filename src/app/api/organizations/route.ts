/**
 * Organization and profile metadata for the settings shell.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession, jsonError } from "@/lib/auth";
import { json } from "@/lib/api";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);

  const supabase = createAdminClient();
  const orgPromise = supabase.from("organizations").select("*").eq("id", session.orgId).single();
  const profilePromise = supabase.from("profiles").select("*").eq("id", session.user.id).single();

  const [orgRes, profileRes] = await Promise.all([orgPromise, profilePromise]);
  if (orgRes.error) return jsonError(orgRes.error.message, 500);
  if (profileRes.error) return jsonError(profileRes.error.message, 500);

  return json({ data: { organization: orgRes.data, profile: profileRes.data } });
}

export async function PATCH(request: Request) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);
  if (session.profile.role !== "owner" && session.profile.role !== "admin")
    return jsonError("Only owners/admins can modify organization settings.", 403);

  const body = await request.json().catch(() => ({}));
  const supabase = createAdminClient();

  const updates: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
  if (typeof body.plan === "string" && body.plan.trim()) updates.plan = body.plan.trim();

  const profileUpdates: Record<string, unknown> = {};
  if (typeof body.full_name === "string") profileUpdates.full_name = body.full_name.trim();
  if (typeof body.email === "string") profileUpdates.email = body.email.trim();

  const orgPromise = Object.keys(updates).length
    ? supabase.from("organizations").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", session.orgId).select("*").single()
    : Promise.resolve({ data: null, error: null });

  const profilePromise = Object.keys(profileUpdates).length
    ? supabase.from("profiles").update({ ...profileUpdates, updated_at: new Date().toISOString() }).eq("id", session.user.id).select("*").single()
    : Promise.resolve({ data: null, error: null });

  const [orgRes, profileRes] = await Promise.all([orgPromise, profilePromise]);
  if (orgRes.error) return jsonError(orgRes.error.message, 500);
  if (profileRes.error) return jsonError(profileRes.error.message, 500);

  return json({ ok: true, data: { organization: orgRes.data, profile: profileRes.data } });
}
