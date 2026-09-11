/**
 * Semantic chunking for the Knowledge Base.
 *
 * Splits documents on paragraph/heading boundaries (NOT fixed character counts)
 * and keeps heading context attached to the chunks under it. Each chunk targets
 * KB_CHUNK_TARGET_TOKENS (~500) and is capped at KB_CHUNK_MAX_TOKENS (~800).
 */
import { estimateTokens } from "@/lib/utils";

export const KB_CHUNK_TARGET_TOKENS = 500;
export const KB_CHUNK_MAX_TOKENS = 800;
export const KB_CHUNK_TARGET_CHARS = KB_CHUNK_TARGET_TOKENS * 4;
export const KB_CHUNK_MAX_CHARS = KB_CHUNK_MAX_TOKENS * 4;

export type KbChunkInput = {
  chunk_index: number;
  content: string;
  heading: string | null;
  metadata: Record<string, unknown>;
  token_count: number;
};

export function chunkDocument(text: string, source?: string): KbChunkInput[] {
  if (!text || !text.trim()) return [];
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const blocks = src.split(/\n\s*\n/).filter((b) => b.trim().length > 0);

  let currentHeading: string | null = null;
  const chunks: KbChunkInput[] = [];
  let buffer = "";
  let bufTokens = 0;
  let chunkIndex = 0;

  const flush = (heading: string | null, content: string) => {
    if (!content.trim()) return;
    chunks.push({
      chunk_index: chunkIndex++,
      content: content.trim(),
      heading,
      metadata: { source },
      token_count: estimateTokens(content),
    });
  };

  const append = (heading: string | null, content: string) => {
    const tokens = estimateTokens(content);
    if (tokens > KB_CHUNK_MAX_CHARS) {
      // Oversized block: split by sentence boundaries, keeping heading context.
      const sentences = content.split(/(?<=[.!?])\s+/);
      let piece = "";
      let carry = heading;
      for (const s of sentences) {
        const candidate = piece ? piece + " " + s : s;
        if (estimateTokens(candidate) > KB_CHUNK_MAX_CHARS && piece) {
          flush(carry, piece);
          piece = s;
          carry = heading;
        } else {
          piece = candidate;
        }
      }
      if (piece) flush(carry, piece);
      return;
    }
    if (bufTokens + tokens > KB_CHUNK_MAX_CHARS && buffer) {
      flush(currentHeading, buffer);
      buffer = content;
      bufTokens = tokens;
    } else {
      buffer += buffer ? "\n\n" + content : content;
      bufTokens += tokens;
    }
  };

  for (const block of blocks) {
    const lines = block.split("\n");
    const first = lines[0].trim();
    const headingMatch = first.match(/^#{1,6}\s+(.*)$/);
    const looksLikeHeading =
      !!headingMatch ||
      (first.length < 80 && first.endsWith(":") && lines.length >= 1 && !first.includes("  "));
    if (headingMatch) currentHeading = headingMatch[1].trim();
    else if (looksLikeHeading && lines.length < 4) currentHeading = first.replace(/:$/, "").trim();

    const content = headingMatch ? lines.slice(1).join("\n").trim() : block;
    if (content) append(currentHeading, content);
  }
  if (buffer) flush(currentHeading, buffer);

  // Merge tiny trailing chunks into their predecessor to avoid fragments.
  const merged: KbChunkInput[] = [];
  for (const c of chunks) {
    if (merged.length && merged[merged.length - 1].token_count + c.token_count <= KB_CHUNK_TARGET_CHARS) {
      const prev = merged[merged.length - 1];
      prev.content += "\n\n" + c.content;
      prev.token_count = estimateTokens(prev.content);
    } else {
      merged.push({ ...c, chunk_index: merged.length });
    }
  }
  return merged;
}
