/**
 * Server-side Meta Page connection helpers.
 * Reads the stored (encrypted) page access token and exposes it to trusted
 * backend code only. The token is never sent to the browser.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken } from "@/lib/crypto";

export interface PageConnection {
  id: string;
  org_id: string;
  page_id: string;
  page_name: string | null;
  page_category: string | null;
  connected: boolean;
  webhook_verified: boolean;
  /** Decrypted page access token (server-only). */
  page_access_token: string;
}

export async function getPageConnection(orgId: string): Promise<PageConnection | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("meta_connections")
    .select("id,org_id,page_id,page_name,page_category,page_access_token,connected,webhook_verified")
    .eq("org_id", orgId)
    .eq("connected", true)
    .maybeSingle<PageConnection>();
  if (error) throw error;
  if (!data) return null;
  return { ...data, page_access_token: decryptToken(data.page_access_token ?? "") };
}

export async function getPageConnectionByPageId(pageId: string): Promise<PageConnection | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("meta_connections")
    .select("id,org_id,page_id,page_name,page_category,page_access_token,connected,webhook_verified")
    .eq("page_id", pageId)
    .maybeSingle<PageConnection>();
  if (error) throw error;
  if (!data) return null;
  return { ...data, page_access_token: decryptToken(data.page_access_token ?? "") };
}
