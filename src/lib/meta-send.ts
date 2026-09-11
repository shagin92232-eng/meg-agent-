/**
 * Meta Messenger "Send API" helpers (text + attachments).
 * Split from `meta.ts` to keep import graph small.
 */
import { graphRequest, MetaError, type GraphApiResponse } from "@/lib/meta";

export type SendAttachmentType = "image" | "video" | "file" | "audio";

export interface SendTextResult {
  recipient_id: string;
  message_id: string;
}

export async function sendMessengerText(
  pageId: string,
  pageToken: string,
  psid: string,
  text: string,
  metadata = "Messenger AI Agent"
): Promise<SendTextResult> {
  if (text.length > 2000) {
    // Messenger hard limit is 2000 chars per message; split into multiple sends.
    const chunks = chunkText(text, 2000);
    const results = await Promise.all(chunks.map((c) => sendMessengerText(pageId, pageToken, psid, c, metadata)));
    return results[results.length - 1];
  }
  return graphRequest<SendTextResult>(`${pageId}/messages`, pageToken, {
    method: "POST",
    body: {
      messaging_product: "page",
      recipient: { id: psid },
      message: { text, metadata },
    },
  });
}

export async function sendMessengerAttachment(
  pageId: string,
  pageToken: string,
  psid: string,
  attachmentType: SendAttachmentType,
  url: string,
  isReusable = true
): Promise<SendTextResult> {
  return graphRequest<SendTextResult>(`${pageId}/messages`, pageToken, {
    method: "POST",
    body: {
      messaging_product: "page",
      recipient: { id: psid },
      message: { attachment: { type: attachmentType, payload: { url, is_reusable: isReusable } } },
    },
  });
}

export { MetaError, type GraphApiResponse };

function chunkText(text: string, size: number): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size;
  }
  return chunks;
}
