"use client";

import { useEffect, useState } from "react";
import { Download, Search, Filter, MoreHorizontal, MessageSquare } from "lucide-react";
import Link from "next/link";

type Order = {
  id: string;
  created_at: string;
  status: string;
  total_amount: number | string;
  customers?: { name?: string };
  order_items?: Array<{ id?: string }>;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (query) params.set("q", query);
      const response = await fetch(`/api/orders?${params.toString()}`, { credentials: "same-origin" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Unable to load orders." }));
        setError(payload?.error ?? "Unable to load orders.");
        setOrders([]);
        return;
      }
      const payload = await response.json();
      setOrders(Array.isArray(payload?.data) ? payload.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, [status, query]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'processing': return 'badge-info';
      case 'shipped': return 'badge-accent';
      case 'confirmed':
      case 'delivered': return 'badge-success';
      default: return '';
    }
  };

  const exportCsv = async () => {
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (query) params.set("q", query);
      const response = await fetch(`/api/orders?${params.toString()}`, { credentials: "same-origin" });
      const payload = await response.json();
      const rows = Array.isArray(payload?.data) ? payload.data : [];
      const csvRows = [["id", "created_at", "customer", "status", "items", "total_amount"]];
      rows.forEach((o: Order) => {
        csvRows.push([o.id, o.created_at, o.customers?.name ?? "", o.status, String(o.order_items?.length ?? 0), String(o.total_amount ?? "")]);
      });
      const csv = csvRows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "orders.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to export orders.");
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Orders</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Track customer orders generated via AI.</p>
        </div>
        <button className="btn btn-secondary sm:w-auto w-full" onClick={exportCsv}>
          <Download size={18} /> <span>Export CSV</span>
        </button>
      </div>

      <div className="card w-full flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row gap-4 justify-between items-center bg-[var(--surface-active)]/30">
          <div className="relative w-full sm:w-96">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} type="text" placeholder="Search by order ID or customer..." className="w-full pl-9 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors" />
          </div>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="btn btn-secondary w-full sm:w-auto">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {error && <div className="p-4 text-sm text-[var(--danger)]">{error}</div>}

        <div className="table-container border-0 rounded-none overflow-x-auto min-w-[700px]">
          <table className="w-full">
            <thead>
              <tr>
                <th className="w-32">Order ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th className="text-center">Items</th>
                <th className="text-right">Total</th>
                <th className="text-center">Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7}>Loading orders...</td></tr>}
              {!loading && orders.map((o) => (
                <tr key={o.id} className="group hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="font-mono text-sm font-semibold text-[var(--text-primary)] cursor-pointer group-hover:text-[var(--accent)]">#{o.id}</td>
                  <td className="text-sm text-[var(--text-muted)]">{o.created_at ? new Date(o.created_at).toLocaleString() : ""}</td>
                  <td className="font-medium text-sm text-[var(--text-primary)]">{o.customers?.name ?? "Customer"}</td>
                  <td className="text-center text-sm font-semibold text-[var(--text-secondary)]">{o.order_items?.length ?? 0}</td>
                  <td className="text-right font-mono font-medium">${Number(o.total_amount ?? 0).toFixed(2)}</td>
                  <td className="text-center">
                    <span className={`badge ${getStatusBadge(o.status)}`}>{o.status}</span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href="/dashboard/conversations">
                        <button className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-glow)] rounded-md transition-colors" data-tooltip="View Conversation"><MessageSquare size={16} /></button>
                      </Link>
                      <button className="p-1.5 text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-active)] rounded-md transition-colors"><MoreHorizontal size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
