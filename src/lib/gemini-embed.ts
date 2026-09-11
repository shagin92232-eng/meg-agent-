/**
 * Gemini embeddings (text-embedding-004) — used for RAG semantic search.
 * Separate module so the generation path stays small and import-light.
 */
import { env } from "@/lib/config";
import { GeminiError } from "@/lib/gemini";

export type EmbeddingTaskType =
  | "RETRIEVAL_DOCUMENT"
  | "RETRIEVAL_QUERY"
  | "SEMANTIC_SIMILARITY"
  | "CLASSIFICATION"
  | "CLUSTERING";

function embedUrl(): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.gemini.embeddingModel)}:embedContent`;
}

async function embedFetch(body: unknown) {
  const url = `${embedUrl()}?key=${encodeURIComponent(env.gemini.apiKey)}`;
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new GeminiError(`Gemini embeddings error ${res.status}: ${text}`, res.status, text);
  }
  return res.json() as Promise<any>;
}

/** Embed text. Returns a vector (number[]). Defaults to 768 dims for text-embedding-004. */
export async function geminiEmbed(text: string, taskType: EmbeddingTaskType = "RETRIEVAL_DOCUMENT"): Promise<number[]> {
  if (!env.gemini.apiKey) throw new GeminiError("GEMINI_API_KEY is not configured.");
  if (!text || !text.trim()) return [];
  const body = {
    content: { parts: [{ text }], role: "user" },
    config: { taskType },
  };
  const data = await embedFetch(body);
  // Support both single-embedding and batch response shapes defensively.
  const single = data?.embedding?.values;
  const batch = data?.embeddings?.[0]?.values;
  const values = single ?? batch;
  if (!Array.isArray(values)) {
    throw new GeminiError("Gemini embedding response had no values.", 0, data);
  }
  return values as number[];
}

/** Embed many strings with bounded concurrency, returning an array of vectors. */
export async function geminiEmbedBatch(
  texts: string[],
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" = "RETRIEVAL_DOCUMENT",
  concurrency = 5
): Promise<number[][]> {
  const results: number[][] = [];
  for (let i = 0; i < texts.length; i += concurrency) {
    const slice = texts.slice(i, i + concurrency);
    const batch = await Promise.all(slice.map((t) => geminiEmbed(t, taskType)));
    results.push(...batch);
  }
  return results;
}
