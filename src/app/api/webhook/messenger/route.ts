/**
 * Messenger webhook endpoint (public, Meta-facing).
 *  GET  -> respond to the hub.challenge during webhook setup.
 *  POST  -> verify X-Hub-Signature-256, parse Messaging events, store & dispatch.
 *
 * Deployed behind HTTPS in production. The callback URL is configured in the
 * Meta App Dashboard under " Webhooks > App > Callback URL".
 */
import { verifyWebhookGet, handleMessengerPost } from "@/lib/webhook";

export async function GET(request: Request) {
  return verifyWebhookGet(request);
}

export async function POST(request: Request) {
  const signature = request.headers.get("X-Hub-Signature-256");
  const raw = await request.text();
  const result = await handleMessengerPost(raw, signature);
  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : 400,
    headers: { "Content-Type": "application/json" },
  });
}
