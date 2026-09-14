/**
 * Application settings (system prompt, AI config, etc.).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession, jsonError } from "@/lib/auth";
import { json } from "@/lib/api";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

type SettingRow = { org_id: string; key: string; value: JsonValue };

function normalizeSettingValue(value: unknown, key: string): JsonValue {
  if (value === undefined) return null;

  if (key === "system_prompt" && typeof value !== "string") {
    throw new Error("system_prompt must be a string");
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeSettingValue(item, key));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, item]) => [k, normalizeSettingValue(item, key)])
    ) as JsonValue;
  }

  throw new Error(`Unsupported settings value for ${key}`);
}

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

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonError("Settings payload must be a JSON object", 400);
  }

  const supabase = createAdminClient();

  const settingsToSave: SettingRow[] = [];
  try {
    for (const [key, value] of Object.entries(body)) {
      if (!key || typeof key !== "string") continue;
      settingsToSave.push({
        org_id: session.orgId,
        key,
        value: normalizeSettingValue(value, key),
      });
    }
  } catch (e: any) {
    return jsonError(e?.message ?? "Invalid settings payload", 400);
  }

  const { error } = await supabase.from("settings").upsert(settingsToSave, { onConflict: "org_id,key" });
  if (error) return jsonError(error.message, 500);
  return json({ ok: true });
}
