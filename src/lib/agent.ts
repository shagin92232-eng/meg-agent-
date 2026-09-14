/**
 * AI agent orchestration — settings + intent classification.
 * (Context building lives in `agent-context.ts`; reply orchestration in
 * `agent-reply.ts`.)
 */
import { createAdminClient } from "@/lib/supabase/admin";

export interface OrgSettings {
  ai_enabled: boolean;
  system_prompt: string;
  ai_mode_default: boolean;
  ai_temperature: number;
  ai_max_output_tokens: number;
  ai_top_p: number;
  ai_language: "auto" | "en" | "bn";
  ai_response_style: "concise" | "balanced" | "detailed";
  ai_response_length: "short" | "medium" | "long";
  ai_auto_transfer: boolean;
  ai_greeting: string;
  knowledge_top_k: number;
  knowledge_threshold: number;
}

export const DEFAULT_SETTINGS: OrgSettings = {
  ai_enabled: true,
  system_prompt:
    "You are the customer-support & sales AI assistant for our business. Respond politely and professionally. Answer ONLY from the provided Knowledge Base and product information — never invent prices, stock, delivery times, policies, or specs. If information is unavailable, say so clearly; for order/support issues, offer to connect them with a human agent. Handle product, pricing, stock, delivery, ordering, FAQs, returns, and sales. Respond in the customer's language (English or Bangla, natural phrasing). Keep answers concise but useful.",
  ai_mode_default: true,
  ai_temperature: 0.4,
  ai_max_output_tokens: 1024,
  ai_top_p: 0.9,
  ai_language: "auto",
  ai_response_style: "balanced",
  ai_response_length: "medium",
  ai_auto_transfer: true,
  ai_greeting: "Hello! I'm the AI assistant for this business. How can I help you today?",
  knowledge_top_k: 6,
  knowledge_threshold: 0.35,
};

// ── Settings ────────────────────────────────────────────────────────────────
export async function loadSettings(orgId: string): Promise<OrgSettings> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("settings")
    .select("key,value")
    .eq("org_id", orgId)
    .in("key", [
      "ai_enabled", "system_prompt", "ai_mode_default", "ai_temperature", "ai_max_output_tokens",
      "ai_top_p", "ai_language", "ai_response_style", "ai_response_length", "ai_auto_transfer",
      "ai_greeting", "knowledge_top_k", "knowledge_threshold",
    ]);
  if (error) throw error;
  const map: Record<string, any> = {};
  for (const row of data ?? []) {
    map[row.key] = row.value;
  }
  return { ...DEFAULT_SETTINGS, ...map } as OrgSettings;
}

export type Intent =
  | "product_question"
  | "order_question"
  | "price_question"
  | "stock_question"
  | "sales_inquiry"
  | "support_complaint"
  | "faq"
  | "general"
  | "needs_human";

export async function classifyIntent(message: string): Promise<{ intent: Intent; transfer_requested: boolean; confidence: number }> {
  const schema = {
    type: "object" as const,
    properties: {
      intent: { enum: ["product_question","order_question","price_question","stock_question","sales_inquiry","support_complaint","faq","general","needs_human"] },
      transfer_requested: { type: "boolean" as const },
      confidence: { type: "number" as const },
    },
    required: ["intent", "transfer_requested", "confidence"],
  };
  const sys = "Classify the customer's incoming message intent. Set transfer_requested=true only if a human is genuinely required (complaints, complex/escalation, legal, sensitive data). Be conservative.";
  try {
    const { geminiGenerateJson } = await import("@/lib/gemini");
    const { parsed } = await geminiGenerateJson<{ intent: Intent; transfer_requested: boolean; confidence: number }>(
      sys,
      [{ role: "user", parts: [{ text: message }] }],
      schema
    );
    return {
      intent: (parsed.intent as Intent) ?? "general",
      transfer_requested: !!parsed.transfer_requested,
      confidence: Number(parsed.confidence) ?? 0,
    };
  } catch {
    return { intent: "general", transfer_requested: false, confidence: 0 };
  }
}

/** Detect simple "I want to order/buy X" statements to flag order intent. */
export function detectOrderIntent(message: string): { order_intent: boolean; product_hint?: string } {
  const lower = (message || "").toLowerCase();
  const keywords = ["i want to order", "i'd like to buy", "can i buy", "place an order", "i need to order", "how to order", "buy this"];
  const order_intent = keywords.some((k) => lower.includes(k));
  let product_hint: string | undefined;
  const match = lower.match(/(?:order|buy|want)\s+(?:a\s+|an\s+)?(.+?)(?:\bplease\b|\.$|\?|$)/);
  if (match && match[1].trim().length > 0) product_hint = match[1].trim();
  return { order_intent, product_hint: product_hint && product_hint.length < 60 ? product_hint : undefined };
}
