/**
 * Small server-side helpers for route handlers: JSON responses + auth guard.
 */
export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

export function jsonError(message: string, status: number): Response {
  return json({ error: message }, status);
}
