/**
 * Manually trigger an AI reply for a conversation.
 * Useful for "Generate reply" buttons or regenerating a response.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession, jsonError } from "@/lib/auth";
import { json } from "@/lib/api";
import { processConversationInbox } from "@/lib/agent-reply";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);
  const { id } = await params;
  const supabase = createAdminClient();
  const exists = await supabase.from("conversations").select("id").eq("id", id).eq("org_id", session.orgId).maybeSingle();
  if (!exists.data) return jsonError("Conversation not found", 404);

  void processConversationInbox(session.orgId, id);
  return json({ ok: true });
}
