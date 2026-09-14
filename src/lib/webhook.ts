/**
 * Messenger webhook handling: GET verification + POST processing.
 *
 * - GET: answers the `hub.challenge` only when the verify token matches.
 * - POST: verifies the X-Hub-Signature-256 HMAC, parses Messaging events,
 *   upserts the customer, finds/creates the conversation, stores the inbound
 *   message (idempotent via Messenger `mid`), then schedules AI processing.
 */
import { verifyHubChallenge, verifyWebhookSignature } from "@/lib/meta";
import { getMessengerProfile } from "@/lib/meta-profile";
import { getPageConnectionByPageId } from "@/lib/meta-connections";
import { receiveCustomerMessage } from "@/lib/inbox";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/config";
import { createNotification } from "@/lib/notifications";
import type { IncomingEvent, AttachmentInfo } from "@/lib/messaging";

export function verifyWebhookGet(req: Request): Response {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && verifyHubChallenge(env.meta.webhookVerifyToken, token)) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function handleMessengerPost(rawBody: string, signature: string | undefined): Promise<{ ok: boolean; received: number; error?: string }> {
  if (!verifyWebhookSignature(signature, Buffer.from(rawBody))) {
    return { ok: false, received: 0, error: "Invalid X-Hub-Signature-256" };
  }
  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return { ok: false, received: 0, error: "Invalid JSON" };
  }
  if (body.object !== "page") return { ok: false, received: 0, error: "Not a page event" };

    const seen = new Set<string>();
  for (const entry of body.entry || []) {
    const pageId = entry.id;
    console.log("[webhook-debug] raw parsed body entry.id:", pageId);
    console.log("[webhook-debug] processing entry.id:", pageId);
    const orgId = await resolveOrgByPage(pageId);
    console.log("[webhook-debug] resolveOrgByPage(pageId) result:", { pageId, orgId });
    if (!orgId) continue; // Page not connected in this deployment
    for (const ev of entry.messaging || []) {
      const key = `${pageId}:${ev?.sender?.id ?? "?"}:${ev?.message?.mid ?? ev?.timestamp}`;
      if (seen.has(key)) continue;
      seen.add(key);
      void handleMessagingEvent(orgId, pageId, ev);
    }
  }
  return { ok: true, received: body.entry?.length ?? 0 };
}

async function resolveOrgByPage(pageId: string): Promise<string | null> {
  const { data, error } = await createAdminClient()
    .from("meta_connections")
    .select("org_id")
    .eq("page_id", pageId)
    .eq("connected", true)
    .maybeSingle<{ org_id: string }>();
  if (error || !data) return null;
  return data.org_id;
}

async function handleMessagingEvent(orgId: string, pageId: string, ev: any): Promise<void> {
  try {
    console.log("[webhook-debug] handleMessagingEvent sender id:", ev.sender?.id);
    console.log("[webhook-debug] handleMessagingEvent message text:", ev.message?.text ?? null);

    // Skip outbound echoes except to mark delivery status.
        if (ev.message?.is_echo) {
      await markEchoDelivered(ev.message?.mid, orgId);
      return;
    }
    if (!ev.message) return;

        const psid = ev.sender?.id;

    // Enrich customer profile (best effort) using the page token.
    const connection = await getPageConnectionByPageId(pageId);
    let customerName: string | undefined;
    let customerLocale: string | undefined;
    if (connection?.page_access_token) {
      try {
        const profile = await getMessengerProfile(connection.page_access_token, psid);
        customerName = profile.first_name && profile.last_name ? `${profile.first_name} ${profile.last_name}` : undefined;
        customerLocale = profile.locale ?? undefined;
      } catch {
        /* profile lookup is best-effort */
      }
    }

        const incoming: IncomingEvent = {
      orgId, pageId, psid,
      customerName, customerLocale,
      text: ev.message?.text ?? null,
      attachments: (ev.message?.attachments || []).map(mapAttachment),
      mid: ev.message?.mid ?? null, timestamp: ev.timestamp,
    };

    console.log("[webhook-debug] handleMessagingEvent receiveCustomerMessage called:", true);
    const result = await receiveCustomerMessage(orgId, pageId, incoming);
    console.log("[webhook-debug] handleMessagingEvent receiveCustomerMessage returned:", result);

    // Notify agents of a new conversation (only when it's the first message).
    const conv = result && (await findConv(result.conversation_id));
    if (conv && conv.unread_count <= 1) {
      const { customers } = await resolveCustomer(orgId, conv.customer_id);
      void createNotification(
        orgId,
        "new_conversation",
        "New conversation",
        `${customers?.name ?? "A customer"} messaged on Messenger.`,
        { conversation_id: conv.id, customer_id: conv.customer_id }
      );
    }
  } catch (e: any) {
    console.error("[webhook] handleMessagingEvent failed:", e?.message || e);
  }
}

function mapAttachment(raw: any): AttachmentInfo {
  const type = (raw?.type ?? "file") as string;
  const map: Record<string, AttachmentInfo["type"]> = { image: "image", video: "video", audio: "audio", file: "file", attach: "file" };
  return {
    type: map[type] ?? "file",
    url: raw?.payload?.url ?? "",
    mime_type: raw?.mime_type ?? raw?.content_type ?? null,
    file_name: raw?.name ?? null,
  };
}

async function markEchoDelivered(mid: string | undefined, orgId: string) {
  if (!mid) return;
  const supabase = createAdminClient();
  // Mirror Messenger send/read receipts back to our stored outbound message.
  await supabase.from("messages").update({ status: "delivered" }).eq("mid", mid).eq("org_id", orgId);
}

async function findConv(id: string) {
  const { data, error } = await createAdminClient()
    .from("conversations")
    .select("id,customer_id,unread_count,status")
    .eq("id", id)
    .maybeSingle<{ id: string; customer_id: string; unread_count: number; status: string }>();
  if (error || !data) return null;
  return data;
}

async function resolveCustomer(orgId: string, customerId: string) {
  const { data: customers } = await createAdminClient()
    .from("customers")
    .select("name")
    .eq("id", customerId)
    .eq("org_id", orgId)
    .maybeSingle<{ name: string }>();
  return { customers };
}
