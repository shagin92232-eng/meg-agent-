/**
 * Media fetching helpers (server-only). Downloads customer-sent attachments so
 * the AI can read them. Messenger attachment URLs are public CDN links; Graph
 * API URLs additionally accept the page access token.
 */
export async function fetchBuffer(url: string, accessToken?: string): Promise<{
  buffer: Buffer;
  mime: string | null;
  status: number;
}> {
  const u = new URL(url);
  if (accessToken && u.hostname.includes && u.hostname.includes("graph.facebook.com")) {
    u.searchParams.set("access_token", accessToken);
  }
  const res = await fetch(u.toString(), { redirect: "follow" });
  const arrayBuf = await res.arrayBuffer();
  return { buffer: Buffer.from(arrayBuf), mime: res.headers.get("content-type"), status: res.status };
}
