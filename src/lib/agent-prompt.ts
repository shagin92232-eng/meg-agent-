/**
 * Prompt assembly for the AI reply.
 *
 * Builds the user-content for Gemini: conversation history (summarised),
 * retrieved KB chunks (top-K only), matching products, order context, and the
 * customer's latest message — plus image parts for any image attachments and
 * extracted text for file attachments.
 *
 * Token efficiency: only the top-K retrieved chunks are included (never the
 * whole document), and old messages are condensed into a rolling summary.
 */
import { formatHistory, type MessageRow } from "@/lib/agent-context";
import { imageFromUrl, type GeminiContentPart } from "@/lib/gemini";
import { fetchBuffer } from "@/lib/media";
import { extractFileText } from "@/lib/text-extract";
import { truncate } from "@/lib/utils";
import type { PageConnection } from "@/lib/meta-connections";

type KbHit = { content: string; heading?: string | null; similarity: number };
type ProductHit = { name: string; price?: number | null; currency?: string | null; description?: string | null; image_url?: string | null };
type Attachment = { type: string; url: string; mime_type?: string | null; file_name?: string | null };

interface ContextLike {
  recent: MessageRow[];
  summary: string | null;
  customer?: { name?: string | null; locale?: string | null; tags?: string[] } | null;
  order?: { order_number: string; status: string; total_amount: number; currency: string } | null;
}

export async function buildUserContent(
  ctx: ContextLike,
  latest: { content?: string | null; metadata: Record<string, unknown> },
  kb: KbHit[],
  products: ProductHit[],
  intent: { intent: string; confidence: number },
  orderIntent: { order_intent: boolean; product_hint?: string },
  connection: PageConnection | null
): Promise<GeminiContentPart[]> {
  const atts = (latest.metadata?.attachments as Attachment[] | undefined) ?? [];
  const token = connection?.page_access_token;

  // Extract text from file/video/audio attachments first (folded into the prompt).
  let fileText = "";
  for (const a of atts) {
    if ((a.type === "file" || a.type === "video" || a.type === "audio") && a.url) {
      try {
        const { buffer, mime } = await fetchBuffer(a.url, token);
        const { text: extracted, note } = await extractFileText({ mime_type: a.mime_type || mime || "", buffer, file_name: a.file_name || "attachment" });
        fileText += `\n\nEXTRACTED ATTACHMENT (${a.file_name || "file"}):\n${truncate(extracted || "", 2000)}`;
        if (!extracted) fileText += `\n[Could not read: ${note || "unsupported"}]`;
      } catch {
        fileText += `\n\n[Customer sent a ${a.type} attachment.]`;
      }
    }
  }

  let prompt = `CUSTOMER MESSAGE:\n${latest.content || "(no text message)"}\n\n`;
  prompt += `INTENT: ${intent.intent} (confidence ${Math.round(intent.confidence * 100)}%); order_intent=${orderIntent.order_intent}${orderIntent.product_hint ? `; product_hint=${orderIntent.product_hint}` : ""}\n\n`;
  prompt += `RELEVANT KNOWLEDGE BASE (${kb.length} chunks):\n` +
    (kb.length ? kb.map((c) => `- ${c.heading ? c.heading + ": " : ""}${truncate(c.content, 300)} (sim ${Math.round(c.similarity * 100)}%)`).join("\n") : "(none retrieved)") + "\n\n";
  prompt += `RELEVANT PRODUCTS (${products.length}):\n` +
    (products.length ? products.map((p) => `- ${p.name}${p.price != null ? ` | ${p.currency ?? "BDT"} ${p.price}` : ""}${p.description ? ` | ${truncate(p.description, 120)}` : ""}`).join("\n") : "(none)") + "\n\n";
  const orderInfo = ctx.order
    ? `ORDER #${ctx.order.order_number} | status=${ctx.order.status} | total=${ctx.order.total_amount} ${ctx.order.currency}`
    : "No active order in this conversation.";
  prompt += `ORDER INFO: ${orderInfo}\n\nCONVERSATION HISTORY:\n${formatHistory(ctx.recent, ctx.summary, ctx.customer)}`;
  prompt += fileText;

  const parts: GeminiContentPart[] = [{ text: prompt }];
  for (const a of atts) {
    if (a.type === "image" && a.url) {
      const part = await imageFromUrl(a.url);
      parts.push(part ?? { text: "[Customer sent an image.]" });
    }
  }
  return parts;
}
