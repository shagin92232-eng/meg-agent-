/**
 * Analytics and dashboard data.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession, jsonError } from "@/lib/auth";
import { json } from "@/lib/api";

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session) return jsonError("Unauthorized", 401);
  const url = new URL(request.url);
  const period = url.searchParams.get("period") || "7d"; // 7d, 30d, 90d
  const startDate = url.searchParams.get("start_date");
  const endDate = url.searchParams.get("end_date");

  const supabase = createAdminClient();

  // Total customers
  const { data: customerCount, error: customerErr } = await supabase
    .from("customers")
    .select("count", { count: "exact" })
    .eq("org_id", session.orgId);
  if (customerErr) return jsonError(customerErr.message, 500);

  // New conversations (by date range)
  let convQuery = supabase.from("conversations").select("count", { count: "exact" }).eq("org_id", session.orgId);
  if (startDate && endDate) {
    convQuery = convQuery.gte("created_at", startDate).lte("created_at", endDate);
  } else {
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    convQuery = convQuery.gte("created_at", cutoff);
  }
  const { data: convCount, error: convErr } = await convQuery;
  if (convErr) return jsonError(convErr.message, 500);

  // Active conversations (open)
  const { data: activeCount, error: activeErr } = await supabase
    .from("conversations")
    .select("count", { count: "exact" })
    .eq("org_id", session.orgId)
    .eq("status", "open");
  if (activeErr) return jsonError(activeErr.message, 500);

  // Unread conversations
  const { data: unreadCount, error: unreadErr } = await supabase
    .from("conversations")
    .select("count", { count: "exact" })
    .eq("org_id", session.orgId)
    .gt("unread_count", 0);
  if (unreadErr) return jsonError(unreadErr.message, 500);

  // AI handled conversations
  const { data: aiHandledCount, error: aiErr } = await supabase
    .from("conversations")
    .select("count", { count: "exact" })
    .eq("org_id", session.orgId)
    .eq("ai_handled", true);
  if (aiErr) return jsonError(aiErr.message, 500);

  // Human handled conversations
  const { data: humanHandledCount, error: humanErr } = await supabase
    .from("conversations")
    .select("count", { count: "exact" })
    .eq("org_id", session.orgId)
    .eq("human_handled", true);
  if (humanErr) return jsonError(humanErr.message, 500);

  // Orders
  const { data: orders, error: ordersErr } = await supabase
    .from("orders")
    .select("count", { count: "exact" })
    .eq("org_id", session.orgId);
  if (ordersErr) return jsonError(ordersErr.message, 500);

  // Confirmed orders
  const { data: confirmedOrders, error: confirmedErr } = await supabase
    .from("orders")
    .select("count", { count: "exact" })
    .eq("org_id", session.orgId)
    .eq("status", "confirmed");
  if (confirmedErr) return jsonError(confirmedErr.message, 500);

  // Pending orders
  const { data: pendingOrders, error: pendingErr } = await supabase
    .from("orders")
    .select("count", { count: "exact" })
    .eq("org_id", session.orgId)
    .eq("status", "pending");
  if (pendingErr) return jsonError(pendingErr.message, 500);

  // Cancelled orders
  const { data: cancelledOrders, error: cancelledErr } = await supabase
    .from("orders")
    .select("count", { count: "exact" })
    .eq("org_id", session.orgId)
    .eq("status", "cancelled");
  if (cancelledErr) return jsonError(cancelledErr.message, 500);

  // Sales revenue (sum of total_amount)
  const { data: salesData, error: salesErr } = await supabase
    .from("orders")
    .select("total_amount")
    .eq("org_id", session.orgId)
    .neq("status", "cancelled");
  if (salesErr) return jsonError(salesErr.message, 500);

  const totalSales = salesData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

  // Products count
  const { data: productCount, error: productErr } = await supabase
    .from("products")
    .select("count", { count: "exact" })
    .eq("org_id", session.orgId);
  if (productErr) return jsonError(productErr.message, 500);

  return json({
    stats: {
      total_customers: customerCount?.[0]?.count || 0,
      new_conversations: convCount?.[0]?.count || 0,
      active_conversations: activeCount?.[0]?.count || 0,
      unread_conversations: unreadCount?.[0]?.count || 0,
      ai_handled: aiHandledCount?.[0]?.count || 0,
      human_handled: humanHandledCount?.[0]?.count || 0,
      orders: orders?.[0]?.count || 0,
      confirmed_orders: confirmedOrders?.[0]?.count || 0,
      pending_orders: pendingOrders?.[0]?.count || 0,
      cancelled_orders: cancelledOrders?.[0]?.count || 0,
      sales_revenue: totalSales,
      products: productCount?.[0]?.count || 0,
    },
  });
}
