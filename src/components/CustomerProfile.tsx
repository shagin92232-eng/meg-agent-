import { Clock, MapPin, Package, Tag, Edit3, CheckCircle2 } from "lucide-react";

export function CustomerProfile() {
  return (
    <div className="flex flex-col h-full bg-[var(--surface)] border-l border-[var(--border)] w-full overflow-y-auto">
      {/* Profile Header */}
      <div className="flex flex-col items-center p-6 border-b border-[var(--border)] bg-gradient-to-b from-[var(--surface-active)] to-transparent">
        <div className="avatar avatar-xl mb-4 border-4 border-[var(--background)] shadow-lg shadow-[var(--shadow-sm)]">
          AJ
        </div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Alice Johnson</h2>
        <div className="flex gap-2 mt-2">
          <span className="badge badge-accent">VIP</span>
          <span className="badge badge-info">Wholesale</span>
        </div>
        
        <div className="w-full flex justify-between mt-6 px-4 bg-[var(--background)] p-3 rounded-lg border border-[var(--border-light)]">
          <div className="text-center">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Orders</p>
            <p className="text-lg font-bold text-[var(--text-primary)] mt-0.5">14</p>
          </div>
          <div className="w-px bg-[var(--border)] scale-y-125 mx-2"></div>
          <div className="text-center">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Spent</p>
            <p className="text-lg font-bold text-[var(--text-primary)] mt-0.5">$2.4k</p>
          </div>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-6">
        
        {/* Info */}
        <div>
          <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">About</h3>
          <ul className="flex flex-col gap-3">
            <li className="flex items-center gap-3 text-sm text-[var(--text-primary)]">
              <MapPin size={16} className="text-[var(--text-secondary)]" /> New York, USA
            </li>
            <li className="flex items-center gap-3 text-sm text-[var(--text-primary)]">
              <Clock size={16} className="text-[var(--text-secondary)]" /> 10:35 AM (Local time)
            </li>
            <li className="flex items-center gap-3 text-sm text-[var(--text-primary)] font-mono">
              <Tag size={16} className="text-[var(--text-secondary)]" /> psid_8471294812
            </li>
          </ul>
        </div>

        <div className="w-full h-px bg-[var(--border)]"></div>

        {/* Recent Order */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Active Order</h3>
            <span className="text-xs text-[var(--accent)] font-semibold hover:underline cursor-pointer">View All</span>
          </div>
          <div className="card p-3 border border-[var(--border-light)] hover:border-[var(--accent)] transition-colors cursor-pointer group flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="font-mono text-sm font-bold group-hover:text-[var(--accent)] transition-colors">#10042</span>
              <span className="badge badge-warning flex items-center gap-1">Processing</span>
            </div>
            <div className="text-sm font-medium text-[var(--text-secondary)] line-clamp-1">
              1x Premium Widget, 2x Standard Gadget
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm font-bold text-[var(--text-primary)]">$149.99</span>
              <span className="text-[10px] text-[var(--text-muted)] font-medium">Placed: 2 days ago</span>
            </div>
          </div>
        </div>

        <div className="w-full h-px bg-[var(--border)]"></div>

        {/* Notes */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Internal Notes</h3>
            <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <Edit3 size={14} />
            </button>
          </div>
          <div className="p-3 bg-[var(--background)] rounded-md border border-[var(--border)] text-sm text-[var(--text-secondary)] min-h-[100px]">
            Customer mentioned they want expedited shipping next time. Also offered a 10% discount on next purchase.
          </div>
        </div>

      </div>
    </div>
  );
}
