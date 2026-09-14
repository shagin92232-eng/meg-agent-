/**
 * Conversation context building.
 *
 * Keeps the AI context bounded:
 *   - Only the last SYSTEM_HISTORY_LIMIT messages are sent verbatim.
 *   - When history grows beyond SUMMARY_TRIGGER, the older tail is condensed
 *     into a one-paragraph summary stored on the conversation, so very long
 *     threads do not balloon token usage.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { geminiGenerateText } from "@/lib/gemini";
import type { Conversation, Customer, Order } from "@/types";

export type MessageRow = {
  id: string;
  sender_role: string;
  message_type: string;
  content?: string | null;
  text_content?: string | null;
  mime_type?: string | null;
  url?: string | null;
  file_name?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export const SYSTEM_HISTORY_LIMIT = 12;
export const SUMMARY_TRIGGER = 24;

export interface ConversationContext {
  conversation: (Conversation & { metadata: Record<string, unknown> }) | null;
  messages: MessageRow[];
  recent: MessageRow[];
  summary: string | null;
  customer: Customer | null;
  order: (Order & { order_items?: any[] }) | null;
}

export async function buildConversationContext(orgId: string, conversationId: string): Promise<ConversationContext> {
  const supabase = createAdminClient();

  const { data: conv, error } = await supabase
    .from("conversations")
    .select("id,customer_id,page_id,ai_mode,status,ai_handled,human_handled,order_id,metadata")
    .eq("id", conversationId)
    .eq("org_id", orgId)
    .single<Conversation & { metadata: Record<string, unknown> }>();

  if (!conv) {
    console.log("[agent-context-debug] conversationId:", conversationId);
    console.log("[agent-context-debug] orgId:", orgId);
    console.log("[agent-context-debug] error:", error);
  }

  const { data: messages } = await supabase
    .from("messages")
    .select("id,sender_role,message_type,content,text_content,mime_type,url,metadata,created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  let customer: Customer | null = null;
  let order: (Order & { order_items?: any[] }) | null = null;
  if (conv?.customer_id) {
    customer = (await supabase.from("customers").select("*").eq("id", conv.customer_id).single()).data ?? null;
  }
  if (conv?.order_id) {
    order = (await supabase.from("orders").select("*,order_items(*)").eq("id", conv.order_id).single()).data ?? null;
  }

  const rows: MessageRow[] = messages ?? [];
  let summary: string | null = conv?.metadata?.summary ? String(conv.metadata.summary) : null;

  if (rows.length > SUMMARY_TRIGGER && !summary) {
    summary = await summariseOldHistory(rows.slice(0, rows.length - SYSTEM_HISTORY_LIMIT));
    const meta = conv?.metadata ?? {};
    await supabase.from("conversations").update({ metadata: { ...meta, summary } }).eq("id", conversationId);
  }

  const recent = rows.slice(Math.max(0, rows.length - SYSTEM_HISTORY_LIMIT));
  return { conversation: conv ?? null, messages: rows, recent, summary, customer: customer ?? null, order: order ?? null };
}

export function formatHistory(recent: MessageRow[], summary: string | null, customer?: Customer | null): string {
  const lines: string[] = [];
  if (summary) lines.push(`CONVERSATION SUMMARY:\n${summary}\n`);
  for (const m of recent) {
    const role = m.sender_role === "customer" ? "Customer" : m.sender_role === "ai" ? "AI" : "Agent";
    let body = m.content || m.text_content || "";
    if (m.message_type === "image" && m.url) body = `[Image${m.text_content ? ": " + m.text_content : ""}]`;
    if (m.message_type === "file" && m.url) body = `[File: ${m.file_name || "attachment"}${m.text_content ? " — " + m.text_content : ""}]`;
    if (m.message_type === "system_event") body = `[${m.content || "event"}]`;
    lines.push(`${role}: ${body}`);
  }
  if (customer?.name) lines.push(`\nCUSTOMER PROFILE: name=${customer.name}, locale=${customer.locale || "n/a"}, tags=${(customer.tags || []).join(",") || "none"}.`);
  return lines.join("\n");
}

async function summariseOldHistory(oldRows: MessageRow[]): Promise<string> {
  const transcript = oldRows
    .map((m) => {
      const role = m.sender_role === "customer" ? "Customer" : "AI";
      const body = m.content || m.text_content || "";
      return `${role}: ${body}`;
    })
    .join("\n");
  const sys = "Summarise this customer service conversation in 4-6 lines. Preserve key facts: products discussed, orders, issues raised, decisions made, and overall intent.";
  const { text } = await geminiGenerateText(sys, [{ role: "user", parts: [{ text: transcript }] }], { temperature: 0.3, maxOutputTokens: 280 });
  return text;
}
