/**
 * Knowledge-base service: semantic retrieval + document ingestion (chunk →
 * embed → store) + product indexing for semantic product search.
 *
 * Retrieval is intentionally token-frugal: only the top-K most relevant chunks
 * are returned to the AI (never the entire document).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { geminiEmbed, geminiEmbedBatch } from "@/lib/gemini-embed";
import { chunkDocument } from "@/lib/chunking";
import { extractFileText } from "@/lib/text-extract";
import { env } from "@/lib/config";

export type RetrievedChunk = {
  id: string;
  document_id: string;
  content: string;
  heading: string;
  metadata: Record<string, unknown>;
  similarity: number;
};

export type ProductHit = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  image_url: string;
  similarity: number;
};

export const DEFAULT_TOP_K = 6;
export const DEFAULT_SIM_THRESHOLD = 0.35;

export interface SearchOpts {
  topK?: number;
  threshold?: number;
}

export async function searchKnowledge(orgId: string, query: string, opts: SearchOpts = {}): Promise<RetrievedChunk[]> {
  const embedding = await geminiEmbed(query, "RETRIEVAL_QUERY");
  if (!embedding.length) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("match_kb_chunks", {
    p_org_id: orgId,
    p_query_vec: embedding,
    p_threshold: opts.threshold ?? DEFAULT_SIM_THRESHOLD,
    p_match_count: opts.topK ?? DEFAULT_TOP_K,
  });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    document_id: r.document_id,
    content: r.content,
    heading: r.heading,
    metadata: r.metadata,
    similarity: Number(r.similarity),
  }));
}

export async function searchProducts(orgId: string, query: string, opts: SearchOpts = {}): Promise<ProductHit[]> {
  const embedding = await geminiEmbed(query, "RETRIEVAL_QUERY");
  if (!embedding.length) return [];
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("match_products", {
    p_org_id: orgId,
    p_query_vec: embedding,
    p_threshold: opts.threshold ?? 0.3,
    p_match_count: opts.topK ?? 5,
  });
  if (error) throw error;
  return (data ?? []) as ProductHit[];
}

type KbDoc = {
  id: string;
  org_id: string;
  title: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  product_id?: string | null;
  metadata?: Record<string, unknown>;
};

export async function processKbDocument(orgId: string, docId: string): Promise<{ chunks: number; tokens: number; error?: string }> {
  const supabase = createAdminClient();
  const { data: doc, error: docErr } = await supabase
    .from("kb_documents")
    .select("id,org_id,title,file_name,storage_path,mime_type,product_id,metadata")
    .eq("id", docId)
    .single<KbDoc>();
  if (docErr || !doc) throw new Error(`Document not found: ${docErr?.message}`);
  if (doc.org_id !== orgId) throw new Error("Document does not belong to this organization.");

  await supabase.from("kb_documents").update({ status: "processing", error: null }).eq("id", docId);

  const { data: blob, error: dlErr } = await supabase.storage.from(env.supabase.storageBucket).download(doc.storage_path);
  if (dlErr || !blob) {
    const msg = `Failed to download document: ${dlErr?.message}`;
    await supabase.from("kb_documents").update({ status: "failed", error: msg }).eq("id", docId);
    return { chunks: 0, tokens: 0, error: msg };
  }
  const buffer = Buffer.from(await blob.arrayBuffer());

  const { text, note } = await extractFileText({ mime_type: doc.mime_type, buffer, file_name: doc.file_name });
  const chunkInputs = chunkDocument(text, doc.title);
  if (chunkInputs.length > 0) {
    const embeddings = await geminiEmbedBatch(chunkInputs.map((c) => c.content), "RETRIEVAL_DOCUMENT", 5);
    const admin = createAdminClient();
    await admin.from("kb_chunks").delete().eq("document_id", docId);
    const rows = chunkInputs.map((c, i) => ({
      document_id: docId,
      org_id: orgId,
      chunk_index: c.chunk_index,
      content: c.content,
      heading: c.heading,
      metadata: { ...c.metadata, note, embedding_model: env.gemini.embeddingModel, product_id: doc.product_id },
      embedding: embeddings[i],
      token_count: c.token_count,
    }));
    const { error: insErr } = await admin.from("kb_chunks").insert(rows);
    if (insErr) throw new Error(`Storing chunks failed: ${insErr.message}`);
  }

  const status = text.trim() ? "ready" : "failed";
  const error = text.trim() ? (note ? `${status}; ${note}` : undefined) : "No extractable text found.";
  const totalTokens = chunkInputs.reduce((s, c) => s + (c.token_count ?? 0), 0);
  await createAdminClient()
    .from("kb_documents")
    .update({ status, chunk_count: chunkInputs.length, token_count: totalTokens, error: error ?? null })
    .eq("id", docId);
  return { chunks: chunkInputs.length, tokens: totalTokens, error };
}

export async function deleteKbChunks(docId: string) {
  const supabase = createAdminClient();
  await supabase.from("kb_chunks").delete().eq("document_id", docId);
}

export async function indexProduct(orgId: string, product: { id: string; name: string; description?: string; price?: number; category?: string; sku?: string }): Promise<void> {
  const text = `${product.name}. ${product.description ?? ""}. Category: ${product.category ?? ""}. SKU: ${product.sku ?? ""}. Price: ${product.price ?? "n/a"}.`;
  const embedding = await geminiEmbed(text, "RETRIEVAL_DOCUMENT");
  if (!embedding.length) return;
  const supabase = createAdminClient();
  await supabase.from("products").update({ embedding: embedding, updated_at: new Date().toISOString() }).eq("id", product.id).eq("org_id", orgId);
}
