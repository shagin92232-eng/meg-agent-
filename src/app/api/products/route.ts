/**
 * Products (list + CRUD).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession, jsonError } from "@/lib/auth";
import { json } from "@/lib/api";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);
  const url = new URL(request.url);
  const enabled = url.searchParams.get("enabled");
  const category = url.searchParams.get("category");

  const supabase = createAdminClient();
  let query = supabase
    .from("products")
    .select("*")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false });
  if (enabled === "true") query = query.eq("is_enabled", true);
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return jsonError(error.message, 500);
  return json({ data });
}

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);
  if (session.profile.role !== "owner" && session.profile.role !== "admin")
    return jsonError("Only owners/admins can create products.", 403);

  const body = await request.json().catch(() => ({}));
  const { name, description, price, currency, stock, sku, barcode, category, image_url, metadata } = body;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("products")
    .insert({
      org_id: session.orgId,
      name,
      description: description || null,
      price: price || null,
      currency: currency || null,
      stock: stock || null,
      sku: sku || null,
      barcode: barcode || null,
      category: category || null,
      image_url: image_url || null,
      metadata: metadata || {},
      is_enabled: true,
    })
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);
  return json({ data });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);
  if (session.profile.role !== "owner" && session.profile.role !== "admin")
    return jsonError("Only owners/admins can update products.", 403);

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { name, description, price, currency, stock, sku, barcode, category, image_url, metadata, is_enabled } = body;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("products")
    .update({
      name,
      description: description || null,
      price: price || null,
      currency: currency || null,
      stock: stock || null,
      sku: sku || null,
      barcode: barcode || null,
      category: category || null,
      image_url: image_url || null,
      metadata: metadata || {},
      is_enabled,
    })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);
  return json({ data });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);
  if (session.profile.role !== "owner" && session.profile.role !== "admin")
    return jsonError("Only owners/admins can delete products.", 403);

  const { id } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase.from("products").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) return jsonError(error.message, 500);
  return json({ ok: true });
}
