/**
 * Server-only admin client. Uses the SERVICE ROLE key and therefore BYPASSES
 * Row-Level Security — it can read/write any org's data.
 *
 * ✋ NEVER import this in the browser. It is intended exclusively for
 *    trusted server runtime (API route handlers, server actions, cron).
 */
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/config";
import { assertEnv } from "@/lib/config";

export function createAdminClient() {
  assertEnv();
  if (!env.supabase.serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured on the server.");
  }
  return createClient(env.supabase.url, env.supabase.serviceRoleKey, {
    auth: { persist: false },
  });
}
