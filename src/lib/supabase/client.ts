/**
 * Browser-side Supabase client. Uses the public anon key + browser storage.
 * Never touches the service_role key.
 */
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/config";

let browserClient: ReturnType<typeof createClient> | null = null;

export function createBrowserClient() {
  if (!browserClient) {
    browserClient = createClient(env.supabase.url, env.supabase.anonKey);
  }
  return browserClient;
}
