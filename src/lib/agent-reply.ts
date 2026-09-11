/**
 * AI reply orchestration core.
 *
 * When a customer message arrives and the conversation is in AI Mode with AI
 * enabled: build context → classify intent → retrieve top-K KB chunks +
 * products (RAG) → render image/file attachments as multimodal input → call
 * Gemini → honour `<<<NEEDS_HUMAN>>>` hand-offs → store + send reply.
 *
 * The prompt assembly lives in `agent-prompt.ts`.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { geminiGenerateText } from "@/lib/gemini";
import { loadSettings, type OrgSettings, classifyIntent, detectOrderIntent } from "@/lib/agent";
import { buildConversationContext } from "@/lib/agent-context";
import { searchKnowledge, searchProducts } from "@/lib/knowledge";
import { getPageConnection } from "@/lib/meta-connections";
import { postAiReply, postSystemEvent } from "@/lib/messaging-send";
import { buildUserContent } from "@/lib/agent-prompt";
import { createNotification } from "@/lib/notifications";
import type { GeminiUsage } from "@/lib/gemini";

const NEEDS_HUMAN_RE = /<<<NEEDS_HUMAN(?:\s*(.*?))?>>>/g;

export async function processConversationInbox(orgId: string, conversationId: string) {
  try {
    await generateAndSendReply(orgId, conversationId);
  } catch (e: any) {
    console.error("[agent] AI reply failed:", e?.message || e);
    void createNotification(orgId, "ai_error", "AI reply failed", e?.message || String(e));
  }
}

export async function buildSystemPrompt(s: OrgSettings): Promise<string> {
  return [
    s.system_prompt,
    "Knowledge grounding: Answer ONLY using the retrieved Knowledge Base snippets and product info. If a fact is missing, say it is unavailable — never invent prices, stock, delivery times, policies or specs.",
    `Style: ${s.ai_response_style}. Length: ${s.ai_response_length}. Temperature: ${s.ai_temperature}.`,
    "Language: reply in the customer's language. English or Bangla — Bangla must sound natural, not a literal translation.",
    "You may analyse images and extracted file text you receive. If a complaint, legal question, sensitive data, or anything requiring a human is raised, end your reply with <<<NEEDS_HUMAN:reason>>> on its own line.",
    `Max output tokens: ${s.ai_max_output_tokens}.`,
  ].join("\n\n");
}

export async function generateAndSendReply(
  orgId: string,
  conversationId: string
): Promise<{ text: string } | null> {
  const supabase = createAdminClient();
  const settings = await loadSettings(orgId);
  if (!settings.ai_enabled) return null;

  const ctx = await buildConversationContext(orgId, conversationId);
  if (!ctx.conversation || !ctx.conversation.ai_mode) return null; // Human Mode: do not auto-reply

  const customerRows = ctx.messages.filter((m) => m.sender_role === "customer");
  const latest = customerRows[customerRows.length - 1];
  if (!latest) return null;

  const query = latest.content || "";
  const intent = await classifyIntent(query);
  const orderIntent = detectOrderIntent(query);

  const [kb, products, connection] = await Promise.all([
    searchKnowledge(orgId, query, { topK: settings.knowledge_top_k, threshold: settings.knowledge_threshold }),
    searchProducts(orgId, query, { topK: 5, threshold: 0.3 }),
    getPageConnection(orgId),
  ]);

  const parts = await buildUserContent(ctx, latest, kb, products, intent, orderIntent, connection);
  const { text: reply, usage } = await geminiGenerateText(await buildSystemPrompt(settings), parts, {
    temperature: settings.ai_temperature,
    maxOutputTokens: settings.ai_max_output_tokens,
    topP: settings.ai_top_p,
  });

  let text = reply;
  let transfer = NEEDS_HUMAN_RE.test(text);
  if (transfer) text = text.replace(NEEDS_HUMAN_RE, "").trim();
  NEEDS_HUMAN_RE.lastIndex = 0;

  if (transfer || (intent.transfer_requested && settings.ai_auto_transfer)) {
    await supabase
      .from("conversations")
      .update({ ai_mode: false, human_handled: true, is_important: true, updated_at: new Date().toISOString() })
      .eq("id", conversationId)
      .eq("org_id", orgId);
    await postSystemEvent(conversationId, orgId, "AI handed this conversation off to a human agent.");
    void createNotification(orgId, "human_requested", "Human assistance requested", "AI flagged this conversation for a human agent.");
  }

  if (connection?.page_access_token && ctx.customer?.psid) {
    await postAiReply(conversationId, orgId, text, connection.page_id, connection.page_access_token, ctx.customer.psid);
  } else {
    await storeAiMessageOnly(conversationId, orgId, text);
  }
  if (usage) void logAiUsage(conversationId, usage);
  return { text };
}

async function storeAiMessageOnly(conversationId: string, orgId: string, text: string) {
  const { updateConversationAfterMessage } = await import("@/lib/messaging");
  const supabase = createAdminClient();
  await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, org_id: orgId, sender_role: "ai", message_type: "text", content: text, status: "sent" });
  await updateConversationAfterMessage(conversationId, orgId, { sender: "ai", preview: text });
}

async function logAiUsage(conversationId: string, usage: GeminiUsage) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("messages")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("sender_role", "ai")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (data?.id) await supabase.from("messages").update({ metadata: { usage } }).eq("id", data.id);
}
