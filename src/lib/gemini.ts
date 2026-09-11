/**
 * Gemini integration — thin wrapper over the stable Gemini REST endpoints.
 *
 * Why raw REST instead of the SDK?
 *   * Model identifiers stay fully configurable via env (GEMINI_MODEL).
 *   * The endpoints (:generateContent / :embedContent) are stable & supported.
 *   * Multimodal payloads (text + base64 images) map 1:1 to the REST schema.
 *   * No SDK version coupling.
 *
 * SECURITY: API key is never logged; requests happen server-side only.
 */
import { env } from "@/lib/config";

export type GeminiContentPart =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } }; // base64 image bytes

export type GeminiContent = {
  role: "user" | "model";
  parts: GeminiContentPart[];
};

export type GeminiGenerationOptions = {
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
  responseMimeType?: string; // "application/json" etc.
  stopSequences?: string[];
};

export type GeminiUsage = {
  promptTokens?: number;
  candidatesTokens?: number;
  totalTokens?: number;
};

export class GeminiError extends Error {
  constructor(message: string, public status?: number, public body?: unknown) {
    super(message);
    this.name = "GeminiError";
  }
}

/** Convert raw image bytes into a Gemini inline_data part. */
export function buildBase64Image(contentType: string, bytes: Buffer): { mime_type: string; data: string } {
  return { mime_type: contentType, data: bytes.toString("base64") };
}

/** Convert a public/accessible image URL into a Gemini inline_data part. */
export async function imageFromUrl(url: string): Promise<GeminiContentPart | null> {
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    const arrayBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    let mime = res.headers.get("content-type") || "image/jpeg";
    if (!mime.startsWith("image/")) mime = "image/jpeg";
    return buildBase64Image(mime, buffer);
  } catch {
    return null;
  }
}

function baseUrl(): string {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.gemini.model)}`;
}

async function geminiFetch(path: string, body: unknown) {
  const url = `${baseUrl()}${path}?key=${encodeURIComponent(env.gemini.apiKey)}`;
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new GeminiError(`Gemini API error ${res.status}: ${text}`, res.status, text);
  }
  return res.json() as Promise<any>;
}

/** Generate text (supports multimodal contents). Returns {text, usage}. */
export async function geminiGenerateText(
  systemPrompt: string,
  contents: GeminiContent[],
  opts: GeminiGenerationOptions = {}
): Promise<{ text: string; usage?: GeminiUsage }> {
  if (!env.gemini.apiKey) throw new GeminiError("GEMINI_API_KEY is not configured.");
  const body: any = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      temperature: opts.temperature ?? env.gemini.temperature,
      maxOutputTokens: opts.maxOutputTokens ?? env.gemini.maxOutputTokens,
      topP: opts.topP,
      topK: opts.topK,
      stopSequences: opts.stopSequences,
      ...(opts.responseMimeType ? { responseMimeType: opts.responseMimeType } : {}),
    },
  };
  const data = await geminiFetch(":generateContent", body);
  const candidate = data?.candidates?.[0];
  const text: string = candidate?.content?.parts?.[0]?.text ?? "";
  const usage: GeminiUsage = data?.usageMetadata
    ? {
        promptTokens: data.usageMetadata.promptTokenCount,
        candidatesTokens: data.usageMetadata.candidatesTokenCount,
        totalTokens: data.usageMetadata.totalTokenCount,
      }
    : undefined;
  if (!text && !candidate) {
    throw new GeminiError(`Gemini returned no content. Finish reason: ${candidate?.finishReason || "unknown"}`, 0, data);
  }
  return { text, usage };
}

/** Generate with JSON response schema (structured output). */
export async function geminiGenerateJson<T = any>(
  systemPrompt: string,
  contents: GeminiContent[],
  schema: any,
  opts: GeminiGenerationOptions = {}
): Promise<{ text: string; parsed: T; usage?: GeminiUsage }> {
  if (!env.gemini.apiKey) throw new GeminiError("GEMINI_API_KEY is not configured.");
  const body: any = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      temperature: opts.temperature ?? 0,
      maxOutputTokens: opts.maxOutputTokens ?? env.gemini.maxOutputTokens,
      topP: opts.topP,
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  };
  const data = await geminiFetch(":generateContent", body);
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  let parsed: T;
  try {
    parsed = typeof text === "string" && text.trim() ? (JSON.parse(text) as T) : ({} as T);
  } catch {
    parsed = {} as T;
  }
  const usage: GeminiUsage = data?.usageMetadata
    ? {
        promptTokens: data.usageMetadata.promptTokenCount,
        candidatesTokens: data.usageMetadata.candidatesTokenCount,
        totalTokens: data.usageMetadata.totalTokenCount,
      }
    : undefined;
  return { text, parsed, usage };
}
