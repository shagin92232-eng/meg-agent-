/**
 * Messaging persistence: customer upsert, conversation find/create, message
 * insert with mid-dedup, conversation state updates. Send-API dispatch lives in
 * `messaging-send.ts`.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import type { Customer, Conversation, Message } from "@/types";

export interface AttachmentInfo {
  type: "image" | "file" | "video" | "audio";
  url: string;
  mime_type?: string | null;
  file_name?: string | null;
  text_content?: string | null;
}

export interface IncomingEvent {
  orgId: string;
  pageId: string;
  psid: string;
  customerName?: string | null;
  customerLocale?: string | null;
  text?: string | null;
  attachments?: AttachmentInfo[];
  mid?: string;
  timestamp?: number;
}

/** Upsert a Messenger customer (idempotent). Returns the customer record. */
export async function upsertCustomer(ev: IncomingEvent): Promise<Customer> {
  const supabase = createAdminClient();
  const { data: existing, error: findErr } = await supabase
    .from("customers")
    .select("*")
    .eq("org_id", ev.orgId)
    .eq("page_id", ev.pageId)
    .eq("psid", ev.psid)
    .maybeSingle<Customer>();
  if (findErr) throw findErr;

  if (existing) {
    const { data, error } = await supabase
      .from("customers")
      .update({
        name: ev.customerName ?? existing.name,
        locale: ev.customerLocale ?? existing.locale,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .single<Customer>();
    if (error) throw error;
    return data!;
  }

  const { data, error } = await supabase
    .from("customers")
    .insert({
      org_id: ev.orgId,
      page_id: ev.pageId,
      psid: ev.psid,
      name: ev.customerName ?? null,
      locale: ev.customerLocale ?? null,
      last_seen_at: new Date().toISOString(),
    })
    .select("*")
    .single<Customer>();
  if (error) throw error;
  return data!;
}

/** Find the open conversation for a customer, or create one. */
export async function findOrCreateConversation(orgId: string, pageId: string, customerId: string): Promise<Conversation> {
  const supabase = createAdminClient();
  const { data: conv, error: findErr } = await supabase
    .from("conversations")
    .select("*, customers(*)")
    .eq("org_id", orgId)
    .eq("page_id", pageId)
    .eq("customer_id", customerId)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .maybeSingle<Conversation & { customers: Customer }>();
  if (findErr) throw findErr;
  if (conv) return conv;

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      org_id: orgId,
      page_id: pageId,
      customer_id: customerId,
      status: "open",
      ai_mode: true,
      unread_count: 0,
    })
    .select("*")
    .single<Conversation>();
  if (error) throw error;
  return data!;
}

/** Insert a customer message (dedup by Messenger mid). */
export async function insertCustomerMessage(conversationId: string, orgId: string, ev: IncomingEvent): Promise<Message[]> {
  const supabase = createAdminClient();
  if (ev.mid) {
    const { data: existing } = await supabase.from("messages").select("id").eq("conversation_id", conversationId).eq("mid", ev.mid).maybeSingle();
    if (existing) return [];
  }
  const hasAttachments = ev.attachments && ev.attachments.length;
  const attachment = hasAttachments ? ev.attachments?.[0] : undefined;
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      org_id: orgId,
      sender_role: "customer",
      message_type: hasAttachments ? "file" : "text",
      content: ev.text ?? null,
      mime_type: attachment?.mime_type ?? undefined,
      url: attachment?.url ?? undefined,
      metadata: { attachments: ev.attachments ?? [] },
      mid: ev.mid ?? null,
      status: "delivered",
    })
    .select("*");
  if (error) throw error;
  await updateConversationAfterMessage(conversationId, orgId, { sender: "customer", preview: ev.text ?? undefined });
  return data as Message[];
}

interface AfterMsgOpts {
  sender: "customer" | "ai" | "human" | "system";
  preview?: string;
  unreadDelta?: number;
}

export async function updateConversationAfterMessage(conversationId: string, orgId: string, opts: AfterMsgOpts) {
  const supabase = createAdminClient();
  const patch: Record<string, unknown> = {
    last_message_at: new Date().toISOString(),
    last_message_sender: opts.sender,
    updated_at: new Date().toISOString(),
  };
  if (opts.preview) patch.last_message_preview = opts.preview.length > 200 ? opts.preview.slice(0, 200) : opts.preview;
  if (opts.sender === "customer") {
    patch.unread_count = `unread_count + ${opts.unreadDelta ?? 1}`;
  }
  if (opts.sender === "ai") patch.ai_handled = true;
  if (opts.sender === "human") patch.human_handled = true;
  await supabase.from("conversations").update(patch).eq("id", conversationId).eq("org_id", orgId);
}

/** Update AI/human mode for a conversation (used by switches). */
export async function setConversationMode(conversationId: string, orgId: string, aiMode: boolean) {
  const supabase = createAdminClient();
  await supabase.from("conversations").update({ ai_mode: aiMode, updated_at: new Date().toISOString() }).eq("id", conversationId).eq("org_id", orgId);
}

export type { Customer, Conversation, Message };
