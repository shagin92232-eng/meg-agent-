import clsx from "clsx";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toUTC(date: Date | string): string {
  return new Date(date).toISOString();
}

/** Very rough token estimate (1 token ≈ 4 chars). Good enough for chunking budgets. */
export function estimateTokens(text: string | null | undefined): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

export function truncate(text: string | null | undefined, max: number): string {
  if (!text) return "";
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

export function formatMessageTime(date: Date | string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  if (isToday(d)) return format(d, "p");
  if (isYesterday(d)) return "Yesterday";
  if (d > new Date(Date.now() - 6 * 24 * 3600 * 1000)) return format(d, "EEE p");
  return format(d, "PPp");
}

export function timeAgo(date: Date | string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatCurrency(value: number | null | undefined, currency = "BDT"): string {
  if (value == null) return "—";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
  } catch {
    return `${value}`;
  }
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return "0";
  return new Intl.NumberFormat("en-US").format(value);
}

// Stable hash for short non-crypto ids
export function shortId(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

export function uniqueId(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Sleep helper for retries
export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
