import { Download, Search, Filter, MoreHorizontal, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function OrdersPage() {
  const orders = [
    { id: "#10045", date: "Today, 11:32 AM", customer: "Diana Prince", total: 149.99, status: "Pending", items: 2 },
    { id: "#10044", date: "Today, 09:12 AM", customer: "Bruce Wayne", total: 499.00, status: "Processing", items: 4 },
    { id: "#10043", date: "Yesterday", customer: "Clark Kent", total: 45.00, status: "Shipped", items: 1 },
    { id: "#10042", date: "Yesterday", customer: "Alice Johnson", total: 149.99, status: "Processing", items: 3 },
    { id: "#10041", date: "Mon, 14 Aug", customer: "Barry Allen", total: 29.99, status: "Delivered", items: 1 },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': return 'badge-warning';
      case 'Processing': return 'badge-info';
      case 'Shipped': return 'badge-accent';
      case 'Delivered': return 'badge-success';
      default: return '';
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Orders</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Track customer orders generated via AI.
          </p>
        </div>
        <button className="btn btn-secondary sm:w-auto w-full">
          <Download size={18} />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="card w-full flex flex-col overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row gap-4 justify-between items-center bg-[var(--surface-active)]/30">
          <div className="relative w-full sm:w-96">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input 
              type="text" 
              placeholder="Search by order ID or customer..." 
              className="w-full pl-9 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>
          <button className="btn btn-secondary w-full sm:w-auto">
            <Filter size={16} />
            <span>Status</span>
          </button>
        </div>

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
              {orders.map((o) => (
                <tr key={o.id} className="group hover:bg-[var(--surface-hover)] transition-colors">
                  <td className="font-mono text-sm font-semibold text-[var(--text-primary)] cursor-pointer group-hover:text-[var(--accent)]">{o.id}</td>
                  <td className="text-sm text-[var(--text-muted)]">{o.date}</td>
                  <td className="font-medium text-sm text-[var(--text-primary)]">{o.customer}</td>
                  <td className="text-center text-sm font-semibold text-[var(--text-secondary)]">{o.items}</td>
                  <td className="text-right font-mono font-medium">${o.total.toFixed(2)}</td>
                  <td className="text-center">
                    <span className={`badge ${getStatusBadge(o.status)}`}>{o.status}</span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href="/dashboard/conversations">
                        <button 
                          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-glow)] rounded-md transition-colors"
                          data-tooltip="View Conversation"
                        >
                          <MessageSquare size={16} />
                        </button>
                      </Link>
                      <button className="p-1.5 text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-active)] rounded-md transition-colors">
                        <MoreHorizontal size={16} />
                      </button>
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
