/**
 * Reusable inbox dispatcher. Accepts a normalised inbound event (from the real
 * Messenger webhook OR from the dev-simulation endpoint) and runs it through
 * the same pipeline: upsert customer -> find/create conversation -> store
 * message -> schedule AI processing.
 */
import { upsertCustomer, findOrCreateConversation, insertCustomerMessage } from "@/lib/messaging";
import { processConversationInbox } from "@/lib/agent-reply";
import { createNotification } from "@/lib/notifications";
import type { IncomingEvent } from "@/lib/messaging";

export async function receiveCustomerMessage(
  orgId: string,
  pageId: string,
  incoming: IncomingEvent
): Promise<{ conversation_id: string } | null> {
  const customer = await upsertCustomer(incoming);
  const conv = await findOrCreateConversation(orgId, pageId, customer.id);
  const inserted = await insertCustomerMessage(conv.id, orgId, incoming);

  if (inserted.length > 0 && (conv.unread_count ?? 0) <= 1) {
    void createNotification(
      orgId,
      "new_conversation",
      "New conversation",
      `${customer.name ?? "A customer"} sent a new message on Messenger.`,
      { conversation_id: conv.id, customer_id: customer.id }
    );
  }

  // Schedule AI processing (non-blocking). Idempotent via mid-dedup.
  void processConversationInbox(orgId, conv.id);
  return { conversation_id: conv.id };
}
