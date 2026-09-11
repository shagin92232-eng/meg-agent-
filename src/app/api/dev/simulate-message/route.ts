/**
 * DEV-ONLY simulated inbound Messenger event. Lets you exercise the full
 * webhook -> AI-reply pipeline without a live Facebook connection.
 *
 * { psid, name, text?, attachment?, message_id? }
 *
 * Real webhook events arrive via /api/webhook/messenger. This exists purely
 * for local/dev testing of the dashboard + AI behavior.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession, jsonError } from "@/lib/auth";
import { json } from "@/lib/api";
import { env } from "@/lib/config";
import { receiveCustomerMessage } from "@/lib/inbox";
import type { IncomingEvent } from "@/lib/messaging";

export async function POST(request: Request) {
  if (!env.app.devMode) return jsonError("Simulation is disabled in production.", 403);
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);

  const body = await request.json().catch(() => ({}));
  const { psid, name, text, attachment, message_id } = body;
  if (!psid) return jsonError("psid is required", 400);

  const supabase = createAdminClient();
  const { data: conn } = await supabase
    .from("meta_connections")
    .select("page_id")
    .eq("org_id", session.orgId)
    .eq("connected", true)
    .maybeSingle();
  const pageId = conn?.page_id || "dev-page";

  const incoming: IncomingEvent = {
    message_id: message_id || `sim_${Date.now()}`,
    from: { id: psid, name: name ?? "Test Customer", psid },
    message: attachment ? { ...attachment, text: text ?? "" } : { text: text ?? "", ...(attachment ? { attachment } : {}) },
    timestamp: Date.now(),
  };

  const result = await receiveCustomerMessage(session.orgId, pageId, incoming);
  return json({ ok: true, conversation_id: result?.conversation_id });
}
