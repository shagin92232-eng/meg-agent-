/**
 * Conversation detail.
 *  GET  -> conversation + customer + order + recent metadata.
 *  PATCH -> switch AI/Human mode for this conversation (with audit events).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession, jsonError } from "@/lib/auth";
import { json } from "@/lib/api";
import { postSystemEvent } from "@/lib/messaging-send";
import { setConversationMode } from "@/lib/messaging";
import { processConversationInbox } from "@/lib/agent-reply";
import { createNotification } from "@/lib/notifications";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: conv, error } = await supabase
    .from("conversations")
    .select("*, customers(*), orders(*)")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (error) return jsonError(error.message, 500);
  if (!conv) return jsonError("Not found", 404);
  return json({ data: conv });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);
  const { id } = await params;
  const supabase = createAdminClient();
  const exists = await supabase.from("conversations").select("id").eq("id", id).eq("org_id", session.orgId).maybeSingle();
  if (!exists.data) return jsonError("Not found", 404);

  const body = await request.json().catch(() => ({}));
  const aiMode: boolean | undefined = body.ai_mode;
  if (typeof aiMode !== "boolean") return jsonError("ai_mode boolean is required", 400);

  await setConversationMode(id, session.orgId, aiMode);
  if (aiMode) {
    await postSystemEvent(id, session.orgId, "Switched back to AI Mode. The AI will resume responding automatically.");
    void createNotification(session.orgId, "new_conversation", "AI Mode restored", "Agent switched this conversation back to AI Mode.");
    // Let the AI catch up on the latest customer message.
    void processConversationInbox(session.orgId, id);
  } else {
    await postSystemEvent(id, session.orgId, "Switched to Human Mode. The AI will no longer respond automatically.");
    void createNotification(session.orgId, "human_requested", "Human Mode enabled", "Agent took over this conversation.");
  }

  const { data } = await supabase.from("conversations").select("*").eq("id", id).single();
  return json({ data });
}
