/**
 * In-app notification creator (server-only).
 */
import { createAdminClient } from "@/lib/supabase/admin";
import type { NotificationType } from "@/types";

export async function createNotification(
  orgId: string,
  type: NotificationType,
  title: string,
  message?: string | null,
  data?: Record<string, unknown>,
  userId?: string | null
) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("notifications").insert({
    org_id: orgId,
    type,
    title,
    message,
    data: data ?? {},
    user_id: userId ?? null,
    is_read: false,
  });
  if (error) console.error("[notifications] insert failed:", error.message);
}
