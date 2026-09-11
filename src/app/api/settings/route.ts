/**
 * Application settings (system prompt, AI config, etc.).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession, jsonError } from "@/lib/auth";
import { json } from "@/lib/api";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("settings")
    .select("key,value")
    .eq("org_id", session.orgId);
  if (error) return jsonError(error.message, 500);

  const settings: Record<string, any> = {};
  for (const row of data || []) {
    settings[row.key] = row.value;
  }
  return json({ data: settings });
}

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);
  if (session.profile.role !== "owner" && session.profile.role !== "admin")
    return jsonError("Only owners/admins can modify settings.", 403);

  const body = await request.json().catch(() => ({}));
  const supabase = createAdminClient();

  // Save each setting individually
  const settingsToSave: { org_id: string; key: string; value: Record<string, unknown> }[] = [];
  for (const [key, value] of Object.entries(body)) {
    settingsToSave.push({
      org_id: session.orgId,
      key,
      value: value as Record<string, unknown>,
    });
  }

  const { error } = await supabase.from("settings").upsert(settingsToSave, { onConflict: "org_id,key" });
  if (error) return jsonError(error.message, 500);
  return json({ ok: true });
}
