/**
 * Document text extraction for the Knowledge Base.
 *
 * Supported: PDF, DOC/DOCX, TXT, CSV, and images (described via Gemini vision).
 * Unsupported types return a clear note instead of failing silently.
 * Node-only libs (pdf-parse, mammoth) are required here — server route handlers only.
 */
import { geminiGenerateText } from "@/lib/gemini";

export type ExtractResult = { text: string; note?: string };

export async function extractFileText(file: { mime_type: string; buffer: Buffer; file_name: string }): Promise<ExtractResult> {
  const { mime_type, buffer, file_name } = file;
  const ext = (file_name.split(".").pop() || "").toLowerCase();

  if (mime_type === "text/plain" || ext === "txt") return { text: buffer.toString("utf8") };
  if (mime_type === "text/csv" || ext === "csv") return { text: csvToText(buffer.toString("utf8")) };

  if (mime_type === "application/pdf" || ext === "pdf") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const { text } = await pdfParse(buffer);
      return { text: text || "" };
    } catch (e: any) {
      return { text: "", note: `PDF parsing failed: ${e?.message || e}` };
    }
  }

  if (mime_type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || ["doc", "docx"].includes(ext)) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return { text: result?.value || "" };
    } catch (e: any) {
      return { text: "", note: `DOCX parsing failed: ${e?.message || e}` };
    }
  }

  if (["ppt", "pptx"].includes(ext) || mime_type.includes("powerpoint")) {
    return { text: "", note: `Unsupported source (${mime_type}). Use PDF/TXT/CSV/DOCX instead.` };
  }

  // Images → describe via Gemini vision so the KB holds usable text.
  if (mime_type.startsWith("image/")) {
    try {
      const part = { inline_data: { mime_type: mime_type, data: buffer.toString("base64") } };
      const { text } = await geminiGenerateText(
        "You are a knowledge-extraction assistant. Describe this image accurately and in detail (text, products, tables, diagrams, pricing, data). Stored in a knowledge base to answer customer questions.",
        [{ role: "user", parts: [part] }],
        { temperature: 0.1, maxOutputTokens: 1024 }
      );
      return { text: text || "", note: "Image described via Gemini vision." };
    } catch (e: any) {
      return { text: "", note: `Image vision failed: ${e?.message || e}` };
    }
  }

  return { text: "", note: `Unsupported file type (${mime_type}). Supported: PDF, DOCX, TXT, CSV, images.` };
}

function csvToText(csv: string): string {
  const rows = csv.split(/\r?\n/);
  if (rows.length === 0) return "";
  const header = rows[0].split(",").map((h) => h.trim());
  const out: string[] = [];
  for (let r = 1; r < rows.length; r++) {
    const cols = rows[r].split(",").map((c) => c.trim());
    if (cols.join("") === "") continue;
    let line = "";
    for (let i = 0; i < header.length && i < cols.length; i++) if (cols[i]) line += `${header[i]}: ${cols[i]}; `;
    if (line) out.push(line.trim());
  }
  return out.join("\n") || csv;
}
