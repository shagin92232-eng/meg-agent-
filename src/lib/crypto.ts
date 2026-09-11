/**
 * Server-side-only token encryption for sensitive credentials stored at rest
 * (Meta page/user access tokens). AES-256-GCM keyed by TOKEN_ENCRYPTION_KEY.
 *
 * If no key is configured, tokens are stored as plain text (dev only) and a
 * loud warning is emitted. This file is imported only by server code.
 */
import crypto from "node:crypto";

const ALGO = "aes-256-gcm";
const PREFIX = "m2::v1::";

function getKey(): Buffer | null {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) return null;
  // Accept hex (32 bytes=64 hex chars) or base64.
  try {
    if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
    return Buffer.from(raw, "base64");
  } catch {
    return null;
  }
}

export function encryptToken(plain: string): string {
  const key = getKey();
  if (!key || key.length !== 32) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[crypto] TOKEN_ENCRYPTION_KEY not set; storing token as plaintext (DEV ONLY).");
    }
    return plain;
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptToken(stored: string): string {
  if (!stored) return "";
  if (!stored.startsWith(PREFIX)) return stored; // plaintext fallback
  const key = getKey();
  if (!key || key.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY is required to decrypt stored tokens.");
  }
  const [ivB64, tagB64, dataB64] = stored.slice(PREFIX.length).split(":");
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const encrypted = Buffer.from(dataB64, "base64");
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
