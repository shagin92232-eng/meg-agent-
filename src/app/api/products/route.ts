/**
 * Products (list + CRUD).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession, jsonError } from "@/lib/auth";
import { json } from "@/lib/api";
import { env } from "@/lib/config";

function normalizeMetadata(value: unknown): Record<string, unknown> {
  if (value === undefined || value === null || value === "") return {};

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return {};
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
      throw new Error("metadata must be a JSON object");
    } catch (err) {
      throw new Error("metadata must be a valid JSON object string, not plain text");
    }
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (Array.isArray(value)) {
    throw new Error("metadata must be a JSON object, not an array");
  }

  throw new Error("metadata must be a JSON object");
}

async function uploadProductImage(file: File, orgId: string): Promise<string | null> {
  const supabase = createAdminClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const path = `${orgId}/product-images/${Date.now()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from(env.supabase.storageBucket).upload(path, file, {
    upsert: false,
    contentType: file.type || "application/octet-stream",
  });
  if (uploadError) throw new Error(uploadError.message);
  const { data: publicData } = supabase.storage.from(env.supabase.storageBucket).getPublicUrl(path);
  return publicData?.publicUrl ?? null;
}

function parseBodyFromFormData(form: FormData) {
  const raw = Object.fromEntries(form.entries());
  const metadata = normalizeMetadata(raw.metadata ?? {});
  return {
    name: String(raw.name ?? ""),
    description: String(raw.description ?? ""),
    price: raw.price === "" ? undefined : Number(raw.price ?? 0),
    currency: String(raw.currency ?? "BDT"),
    stock: raw.stock === "" ? undefined : Number(raw.stock ?? 0),
    sku: String(raw.sku ?? ""),
    barcode: String(raw.barcode ?? ""),
    category: String(raw.category ?? "General"),
    image_url: String(raw.image_url ?? ""),
    metadata,
    is_enabled: raw.is_enabled === "true" || raw.is_enabled === "false" ? raw.is_enabled === "true" : undefined,
  };
}

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);
  const url = new URL(request.url);
  const enabled = url.searchParams.get("enabled");
  const category = url.searchParams.get("category");
  const q = url.searchParams.get("q")?.trim();

  const supabase = createAdminClient();
  let query = supabase
    .from("products")
    .select("*")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false });

  if (enabled === "true") query = query.eq("is_enabled", true);
  if (enabled === "false") query = query.eq("is_enabled", false);
  if (category) query = query.eq("category", category);
  if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return jsonError(error.message, 500);
  return json({ data });
}

function normalizeCurrency(input?: unknown): string {
  const raw = typeof input === "string" ? input.trim().toUpperCase() : "";
  if (!raw) return "BDT";
  if (!/^[A-Z]{3}$/.test(raw)) {
    throw new Error("currency must be a valid ISO 4217 3-letter code such as BDT or USD");
  }
  return raw;
}

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);
  if (session.profile.role !== "owner" && session.profile.role !== "admin")
    return jsonError("Only owners/admins can create products.", 403);

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let body: Record<string, any> = {};
    let uploadedImageUrl: string | null = null;
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const imageFile = form.get("image");
      body = parseBodyFromFormData(form);
      if (imageFile instanceof File && imageFile.size > 0) {
        uploadedImageUrl = await uploadProductImage(imageFile, session.orgId);
      }
      body.image_url = uploadedImageUrl ?? (body.image_url || null);
    } else {
      body = await request.json().catch(() => ({}));
    }

    const { name, description, price, currency, stock, sku, barcode, category, image_url, metadata } = body;
    if (!name || String(name).trim().length === 0) return jsonError("name is required", 400);

    const normalizedMetadata = normalizeMetadata(metadata ?? {});
    const normalizedCurrency = normalizeCurrency(currency);
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("products")
      .insert({
        org_id: session.orgId,
        name: String(name).trim(),
        description: description || null,
        price: price ?? null,
        currency: normalizedCurrency,
        stock: stock ?? null,
        sku: sku || null,
        barcode: barcode || null,
        category: category || null,
        image_url: image_url || null,
        metadata: normalizedMetadata,
        is_enabled: true,
      })
      .select("*")
      .single();
    if (error) return jsonError(error.message, 500);
    return json({ data });
  } catch (e: any) {
    return jsonError(e?.message ?? "Invalid product payload", 400);
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);
  if (session.profile.role !== "owner" && session.profile.role !== "admin")
    return jsonError("Only owners/admins can update products.", 403);

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let body: Record<string, any> = {};
    let uploadedImageUrl: string | null = null;
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const imageFile = form.get("image");
      body = parseBodyFromFormData(form);
      if (imageFile instanceof File && imageFile.size > 0) {
        uploadedImageUrl = await uploadProductImage(imageFile, session.orgId);
      }
      body.image_url = uploadedImageUrl ?? (body.image_url || null);
    } else {
      body = await request.json().catch(() => ({}));
    }

    const { id, name, description, price, currency, stock, sku, barcode, category, image_url, metadata, is_enabled } = body;
    if (!id) return jsonError("id is required", 400);
    if (!name || String(name).trim().length === 0) return jsonError("name is required", 400);

    const normalizedMetadata = normalizeMetadata(metadata ?? {});
    const normalizedCurrency = normalizeCurrency(currency);
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("products")
      .update({
        name: String(name).trim(),
        description: description || null,
        price: price ?? null,
        currency: normalizedCurrency,
        stock: stock ?? null,
        sku: sku || null,
        barcode: barcode || null,
        category: category || null,
        image_url: image_url || null,
        metadata: normalizedMetadata,
        is_enabled,
      })
      .eq("id", id)
      .eq("org_id", session.orgId)
      .select("*")
      .single();
    if (error) return jsonError(error.message, 500);
    return json({ data });
  } catch (e: any) {
    return jsonError(e?.message ?? "Invalid product payload", 400);
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);
  if (session.profile.role !== "owner" && session.profile.role !== "admin")
    return jsonError("Only owners/admins can delete products.", 403);

  const body = await request.json().catch(() => ({}));
  const { id } = body;
  if (!id) return jsonError("id is required", 400);

  const supabase = createAdminClient();

  const { error } = await supabase.from("products").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) return jsonError(error.message, 500);
  return json({ ok: true });
}
