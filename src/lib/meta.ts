/**
 * Meta (Facebook) Messenger Platform integration — core Graph API, OAuth,
 * Page listing, webhook verification. Sending helpers are in `meta-send.ts`.
 *
 * Endpoints (Graph API v18.0, configurable via META_GRAPH_VERSION):
 *   - OAuth dialog + /oauth/access_token token exchange
 *   - /me/accounts (list Pages + Page access tokens)
 *   - /{page-id}/subscribed_apps (subscribe Page to webhook fields)
 *   - Webhook GET challenge + X-Hub-Signature-256 verification
 *
 * Security: tokens are passed only from server route handlers; the page access
 * token is stored encrypted in `meta_connections` (never sent to the client).
 */
import crypto from "node:crypto";
import { env } from "@/lib/config";

const BASE = `https://graph.facebook.com/${env.meta.graphVersion}`;
const OAUTH_BASE = "https://www.facebook.com";

export type GraphApiResponse<T = any> = T & { error?: { message: string; code: number; error_subcode?: number } };

export class MetaError extends Error {
  constructor(message: string, public code?: number, public body?: unknown) {
    super(message);
    this.name = "MetaError";
  }
}

export async function graphRequest<T = any>(
  path: string,
  accessToken: string,
  options: { method?: "GET" | "POST" | "DELETE"; query?: Record<string, string>; body?: Record<string, any> | string } = {}
): Promise<GraphApiResponse<T>> {
  const url = new URL(`${BASE}/${path}`);
  if (options.query) for (const [k, v] of Object.entries(options.query)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers: options.body !== undefined ? { "Content-Type": "application/json" } : {},
    body: options.body !== undefined ? (typeof options.body === "string" ? options.body : JSON.stringify(options.body)) : undefined,
  });

  const data = (await res.json().catch(() => ({}))) as GraphApiResponse<T>;
  if (!res.ok && data.error) throw new MetaError(`${data.error.message} (code ${data.error.code})`, data.error.code, data);
  return data as GraphApiResponse<T>;
}

// ── OAuth (Facebook Login) ──────────────────────────────────────────────────
export const META_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_metadata",
  "pages_messaging",
  "pages_manage_posts",
  "pages_read_user_content",
  "business_management",
].join(",");

export function buildFacebookLoginUrl(state: string, returnUrl = "/settings"): string {
  const u = new URL(`${OAUTH_BASE}/${env.meta.graphVersion}/dialog/oauth`);
  u.searchParams.set("client_id", env.meta.appId);
  u.searchParams.set("redirect_uri", env.meta.redirectUri);
  u.searchParams.set("scope", META_SCOPES);
  u.searchParams.set("state", `${state}|${encodeURIComponent(returnUrl)}`);
  u.searchParams.set("response_type", "code");
  return u.toString();
}

export async function exchangeCodeForToken(code: string): Promise<{ access_token: string; token_type: string; expires_in: number }> {
  const u = new URL(`${BASE}/oauth/access_token`);
  u.searchParams.set("client_id", env.meta.appId);
  u.searchParams.set("client_secret", env.meta.appSecret);
  u.searchParams.set("redirect_uri", env.meta.redirectUri);
  u.searchParams.set("code", code);
  const res = await fetch(u.toString(), { method: "POST" });
  const data = await res.json();
  if (data.error) throw new MetaError(data.error.message, undefined, data);
  return data;
}

export type PageInfo = {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  fan_count?: number;
  followers_count?: number;
  picture?: { data: { url: string } };
  instagram_business_account?: { id: string; username: string };
};

export async function getUserPages(userToken: string): Promise<PageInfo[]> {
  const data = await graphRequest<{ data: PageInfo[] }>("me/accounts", userToken, {
    query: { fields: "id,name,access_token,category,fan_count,followers_count,picture" },
  });
  return data.data ?? [];
}

export async function getPage(pageId: string, pageToken: string): Promise<PageInfo> {
  return graphRequest<PageInfo>(pageId, pageToken, { query: { fields: "id,name,category,fan_count,followers_count,picture" } });
}

export async function subscribePageToWebhooks(
  pageId: string,
  pageToken: string,
  fields: string[] = ["messages", "message_echo", "message_reads", "message_reactions"]
) {
  return graphRequest(pageId + "/subscribed_apps", pageToken, { method: "POST", body: { subscribed_fields: fields } });
}

// ── Webhook verification ────────────────────────────────────────────────────
export function verifyHubChallenge(verifyToken: string, provided: string | null): boolean {
  if (!provided) return false;
  return crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(verifyToken));
}

// X-Hub-Signature-256 (HMAC-SHA256 using the app secret).
export function verifyWebhookSignature(signature: string | undefined, rawBody: Buffer): boolean {
  if (!signature || !env.meta.appSecret) return false;
  const [algo, hash] = signature.split("=");
  if (algo !== "sha256" || !hash) return false;
  const expected = crypto.createHmac("sha256", env.meta.appSecret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}
