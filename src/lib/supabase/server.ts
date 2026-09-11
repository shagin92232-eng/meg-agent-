/**
 * Server-side Supabase client for Server Components / Route Handlers / Actions.
 *
 * Uses the anon key + cookie session. Honors Row-Level Security so it can be
 * used safely for user-scoped reads/writes. Cookies are read/written via
 * next/headers so the session is shared with the browser.
 */
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/lib/config";

export async function createServerClient() {
  const cookieStore = await cookies();
  return createClient(env.supabase.url, env.supabase.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (c) =>
        c.forEach(({ name, value, ...options }) =>
          cookieStore.set(name, value, options)
        ),
    },
  });
}

export type ServerClient = Awaited<ReturnType<typeof createServerClient>>;
