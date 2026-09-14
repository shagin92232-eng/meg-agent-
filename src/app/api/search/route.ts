/**
 * Global org-scoped search across the operational records.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession, jsonError } from "@/lib/auth";
import { json } from "@/lib/api";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (!q) return json({ data: { customers: [], conversations: [], products: [], orders: [], knowledge: [] } });

  const supabase = createAdminClient();
  const like = `%${q}%`;

  const [customers, conversations, products, orders, knowledge] = await Promise.all([
    supabase.from("customers").select("*").eq("org_id", session.orgId).or(`name.ilike.${like},first_name.ilike.${like},last_name.ilike.${like},psid.ilike.${like}`).limit(5),
    supabase.from("conversations").select("*, customers(name)").eq("org_id", session.orgId).or(`last_message_preview.ilike.${like},status.ilike.${like}`).limit(5),
    supabase.from("products").select("*").eq("org_id", session.orgId).or(`name.ilike.${like},description.ilike.${like},category.ilike.${like},sku.ilike.${like}`).limit(5),
    supabase.from("orders").select("*, customers(name)").eq("org_id", session.orgId).or(`order_number.ilike.${like},notes.ilike.${like}`).limit(5),
    supabase.from("kb_documents").select("*").eq("org_id", session.orgId).or(`title.ilike.${like},file_name.ilike.${like},mime_type.ilike.${like}`).limit(5),
  ]);

  const out = {
    customers: customers.data ?? [],
    conversations: conversations.data ?? [],
    products: products.data ?? [],
    orders: orders.data ?? [],
    knowledge: knowledge.data ?? [],
  };

  return json({ data: out });
}
