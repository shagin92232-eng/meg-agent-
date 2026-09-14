/**
 * Browser-side Supabase client. Uses the public anon key + SSR cookie storage.
 * Never touches the service_role key.
 */
import { createBrowserClient as createSsrBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeSupabaseUrl } from "@/lib/config";

let browserClient: SupabaseClient<any, "public"> | null = null;

export function createBrowserClient(): SupabaseClient<any, "public"> {
  if (!browserClient) {
    const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

    if (!url) {
      throw new Error("supabaseUrl is required");
    }
    if (!anonKey) {
      throw new Error("supabaseAnonKey is required");
    }

    browserClient = createSsrBrowserClient(url, anonKey, {
      isSingleton: true,
    });
  }

  return browserClient;
}
