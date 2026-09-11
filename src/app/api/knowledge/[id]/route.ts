/**
 * Knowledge Base document status + reprocess.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession, jsonError } from "@/lib/auth";
import { json } from "@/lib/api";
import { processKbDocument } from "@/lib/knowledge";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);
  if (session.profile.role !== "owner" && session.profile.role !== "admin")
    return jsonError("Only owners/admins can modify documents.", 403);

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { enabled, status } = body;
  const supabase = createAdminClient();

  if (typeof enabled === "boolean") {
    const { error } = await supabase.from("kb_documents").update({ enabled }).eq("id", id).eq("org_id", session.orgId);
    if (error) return jsonError(error.message, 500);
  }

  if (status === "reprocess") {
    const { error } = await supabase.from("kb_documents").update({ status: "processing" }).eq("id", id).eq("org_id", session.orgId);
    if (error) return jsonError(error.message, 500);
    // Trigger background processing (non-blocking).
    void processKbDocument(id);
  }

  const { data, error } = await supabase.from("kb_documents").select("*").eq("id", id).eq("org_id", session.orgId).single();
  if (error) return jsonError(error.message, 500);
  return json({ data });
}
