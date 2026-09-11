/**
 * Centralised, env-backed configuration.
 *
 * SECRET RULES:
 *  - Anything under NEXT_PUBLIC_* is embedded into the client bundle and MUST
 *    stay public (Supabase anon key, app flags).
 *  - The Supabase SERVICE_ROLE key, Meta app secret, and Gemini API key are
 *    read-only on the server and are never exposed to the browser.
 *  - The Gemini model/embedding model are configurable so the app can be
 *    updated to a new model without code changes.
 */

function str(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}
function num(key: string, fallback: number): number {
  const v = process.env[key];
  if (v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function bool(key: string, fallback = false): boolean {
  const v = process.env[key];
  if (v === undefined || v === "") return fallback;
  return v === "true" || v === "1";
}

export const env = {
  app: {
    name: str("NEXT_PUBLIC_APP_NAME", "Messenger AI Agent"),
    url: str("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
    devMode: bool("NEXT_PUBLIC_DEV_MODE", true),
  },
  supabase: {
    url: str("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: str("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    // service role key is intentionally NOT exposed via NEXT_PUBLIC_
    serviceRoleKey: str("SUPABASE_SERVICE_ROLE_KEY"),
  },
  gemini: {
    apiKey: str("GEMINI_API_KEY"),
    model: str("GEMINI_MODEL", "gemini-2.0-flash"),
    embeddingModel: str("GEMINI_EMBEDDING_MODEL", "text-embedding-004"),
    maxOutputTokens: num("GEMINI_MAX_OUTPUT_TOKENS", 2048),
    temperature: num("GEMINI_TEMPERATURE", 0.4),
  },
  meta: {
    appId: str("META_APP_ID"),
    appSecret: str("META_APP_SECRET"),
    redirectUri: str("META_REDIRECT_URI", "http://localhost:3000/api/meta/callback"),
    graphVersion: str("META_GRAPH_VERSION", "v18.0"), // configurable; v18.0 supports all messaging APIs
    webhookVerifyToken: str("META_WEBHOOK_VERIFY_TOKEN", "messenger-ai-agent-verify"),
  },
  auth: {
    signupInviteCode: str("SIGNUP_INVITE_CODE"), // empty => open signup (dev only)
  },
};

// Runtime guard used by server libs so misconfigured deployments fail loudly.
type RequiredEnv = { key: string; label: string; when?: boolean }[];
export function assertEnv() {
  if (typeof window !== "undefined") return; // client must never run this
  const required: RequiredEnv = [
    { key: "NEXT_PUBLIC_SUPABASE_URL", label: "Supabase URL" },
    { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", label: "Supabase anon key" },
    { key: "SUPABASE_SERVICE_ROLE_KEY", label: "Supabase service role key" },
  ];
  const missing = required.filter((r) => (r.when ?? true) && !process.env[r.key]).map((r) => r.label);
  if (missing.length) {
    throw new Error(`Missing required server env vars: ${missing.join(", ")}`);
  }
}
