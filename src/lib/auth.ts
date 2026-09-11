/**
 * Server-side session helper for App Router route handlers & Server Components.
 * Returns the authenticated user + their profile/org, or null when public.
 */
import { createServerClient } from "@/lib/supabase/server";
import type { Organization, Profile } from "@/types";

export interface ServerSession {
  user: { id: string; email?: string | null; [k: string]: unknown };
  profile: (Profile & { organizations: Organization });
  orgId: string;
}

export async function getServerSession(): Promise<ServerSession | null> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*, organizations!inner(id,name,plan)")
    .eq("id", user.id)
    .single();
  if (error || !profile) return null;
  return {
    user: { id: user.id, email: user.email },
    profile: profile as unknown as Profile & { organizations: Organization },
    orgId: profile.org_id,
  };
}

export async function requireSession(): Promise<ServerSession> {
  const s = await getServerSession();
  if (!s) {
    const err: any = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  return s;
}

export function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), { status, headers: { "Content-Type": "application/json" } });
}
