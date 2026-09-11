/**
 * Messaging send + system events: post a system event, persist & deliver an AI
 * reply to Messenger. Depends on `messaging.ts` for conversation state updates.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMessengerText, sendMessengerAttachment } from "@/lib/meta-send";
import { updateConversationAfterMessage } from "@/lib/messaging";
import type { Message } from "@/types";

export interface ReplyAttachment {
  type: "image" | "file" | "video" | "audio";
  url: string;
}

/** Append a system/status event to a conversation. */
export async function postSystemEvent(conversationId: string, orgId: string, content: string, type: "system_event" | "order_status" = "system_event") {
  await createAdminClient()
    .from("messages")
    .insert({ conversation_id: conversationId, org_id: orgId, sender_role: "system", message_type: type, content, status: "sent" });
  await updateConversationAfterMessage(conversationId, orgId, { sender: "system", preview: content });
}

/** Persist the AI reply and deliver it to Messenger. */
export async function postAiReply(
  conversationId: string,
  orgId: string,
  text: string,
  pageId: string,
  pageToken: string,
  psid: string,
  attachments?: ReplyAttachment[]
) {
  const supabase = createAdminClient();

  const { data: msg, error: insErr } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      org_id: orgId,
      sender_role: "ai",
      message_type: "text",
      content: text,
      metadata: {},
      status: "sending",
    })
    .select("*")
    .single<Message>();
  if (insErr) throw insErr;

  let messageId = "";
  try {
    if (text.trim()) {
      const res = await sendMessengerText(pageId, pageToken, psid, text);
      messageId = res.message_id;
    }
    if (attachments?.length) {
      for (const att of attachments) {
        await sendMessengerAttachment(pageId, pageToken, psid, att.type, att.url, true);
      }
    }
  } catch (e: any) {
    console.error("[messaging] Send API failed:", e?.message || e);
    await supabase.from("messages").update({ status: "failed", metadata: { error: e?.message || String(e) } }).eq("id", msg.id);
    return { message: msg, delivered: false };
  }

  await supabase.from("messages").update({ status: "sent", mid: messageId, sent_by_me: true }).eq("id", msg.id);
  await updateConversationAfterMessage(conversationId, orgId, { sender: "ai", preview: text });
  return { message: msg, delivered: true };
}
