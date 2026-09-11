/**
 * Knowledge Base documents (list + delete).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession, jsonError } from "@/lib/auth";
import { json } from "@/lib/api";
import { env } from "@/lib/config";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);
  const url = new URL(request.url);
  const enabled = url.searchParams.get("enabled");
  const status = url.searchParams.get("status");

  const supabase = createAdminClient();
  let query = supabase
    .from("kb_documents")
    .select("*")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false });
  if (enabled === "true") query = query.eq("enabled", true);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return jsonError(error.message, 500);

  // Sign storage paths so the UI can display/list documents without exposing keys.
  const signed = await Promise.all(
    (data ?? []).map(async (doc) => {
      let downloadUrl = null;
      try {
        const { data: urlData } = await supabase.storage
          .from(env.supabase.storageBucket)
          .createSignedUrl(doc.storage_path, 60 * 60 * 24 * 7, { download: true });
        downloadUrl = urlData?.signedUrl ?? null;
      } catch {}
      return { ...doc, download_url: downloadUrl };
    })
  );
  return json({ data: signed });
}

export async function DELETE(request: Request) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);
  if (session.profile.role !== "owner" && session.profile.role !== "admin")
    return jsonError("Only owners/admins can delete documents.", 403);

  const { id } = await request.json().catch(() => ({}));
  if (!id) return jsonError("id is required", 400);

  const supabase = createAdminClient();
  const { data: existing, error: findErr } = await supabase
    .from("kb_documents")
    .select("storage_path, chunk_count")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (findErr || !existing) return jsonError("Document not found", 404);

  // Delete file from storage.
  try {
    await supabase.storage.from(env.supabase.storageBucket).remove([existing.storage_path]);
  } catch (e) {
    console.warn("[kb] storage delete failed:", e);
  }
  // Delete chunks + document.
    await supabase.from("kb_chunks").delete().eq("document_id", id);
  const { error } = await supabase.from("kb_documents").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) return jsonError(error.message, 500);
  return json({ ok: true });
}
