/**
 * Conversation messages.
 *  GET  -> list messages ascending (for chat history).
 *  POST -> a human agent sends a reply (switches the conv to Human Mode, stores,
 *          and forwards it to Messenger via the Send API).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession, jsonError } from "@/lib/auth";
import { json } from "@/lib/api";
import { getPageConnection } from "@/lib/meta-connections";
import { sendMessengerText, sendMessengerAttachment } from "@/lib/meta-send";
import { postSystemEvent } from "@/lib/messaging-send";
import { setConversationMode } from "@/lib/messaging";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);
  const { id } = await params;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: true });
  if (error) return jsonError(error.message, 500);
  return json({ data });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);
  const { id } = await params;
  const supabase = createAdminClient();

  const exists = await supabase.from("conversations").select("customer_id").eq("id", id).eq("org_id", session.orgId).maybeSingle();
  if (!exists.data) return jsonError("Conversation not found", 404);

  const body = await request.json().catch(() => ({}));
  const { text, attachments } = body as { text?: string; attachments?: { type: string; url: string }[] };

  // A human sending a message == taking over the conversation (Human Mode).
  await setConversationMode(id, session.orgId, false);

  const inserted = await supabase
    .from("messages")
    .insert({
      conversation_id: id,
      org_id: session.orgId,
      sender_role: "human",
      message_type: text ? "text" : "image",
      content: text ?? null,
      metadata: { attachments: attachments ?? [] },
      status: "sending",
      sent_by_me: true,
    })
    .select("*")
    .single<Message>();

  // Resolve customer PSID + page token to deliver to Messenger.
  const { data: conv } = await supabase.from("conversations").select("customer_id").eq("id", id).single();
  const customerId = conv?.customer_id;
  const customer = customerId && (await supabase.from("customers").select("psid").eq("id", customerId).maybeSingle()).data;
  const connection = await getPageConnection(session.orgId);
  let delivered = false;
  let mid = "";
  if (connection && customer?.psid) {
    try {
      if (text && text.trim()) {
        const res = await sendMessengerText(connection.page_id, connection.page_access_token, customer.psid, text, "Human agent");
        mid = res.message_id;
      }
      if (attachments?.length) {
        for (const a of attachments) await sendMessengerAttachment(connection.page_id, connection.page_access_token, customer.psid, a.type as any, a.url);
      }
      delivered = true;
      await supabase.from("messages").update({ status: "sent", mid, sent_by_me: true }).eq("id", inserted.id);
    } catch (e: any) {
      console.error("[messages] send failed:", e?.message || e);
      await supabase.from("messages").update({ status: "failed", metadata: { error: e?.message || String(e) } }).eq("id", inserted.id);
    }
  }
  // Best-effort realtime presence handled by client subscription.
  return json({ data: inserted, delivered });
}

type Message = {
  id: string;
  conversation_id: string;
  org_id: string;
  sender_role: string;
  message_type: string;
  content: string | null;
  status: string;
  [k: string]: unknown;
};
