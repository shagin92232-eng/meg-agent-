import { Clock, MapPin, Package, Tag, Edit3, MoreHorizontal, X } from "lucide-react";
import { useState } from "react";

export function CustomerProfile() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[var(--surface)] border-l border-[var(--border)] w-full overflow-y-auto">
      <div className="flex flex-col items-center p-5 border-b border-[var(--border)] bg-gradient-to-b from-[var(--surface-active)] to-transparent">
        <div className="avatar avatar-xl mb-3 border-4 border-[var(--background)] shadow-lg shadow-[var(--shadow-sm)]">
          AJ
        </div>
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Alice Johnson</h2>
        <div className="flex gap-2 mt-2">
          <span className="badge badge-accent">VIP</span>
          <span className="badge badge-info">Wholesale</span>
        </div>

        <div className="w-full flex justify-between mt-4 px-4 bg-[var(--background)] p-3 rounded-lg border border-[var(--border-light)]">
          <div className="text-center">
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Orders</p>
            <p className="text-base font-bold text-[var(--text-primary)] mt-0.5">14</p>
          </div>
          <div className="w-px bg-[var(--border)] scale-y-125 mx-2"></div>
          <div className="text-center">
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Spent</p>
            <p className="text-base font-bold text-[var(--text-primary)] mt-0.5">$2.4k</p>
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">About</h3>
          <div className="relative">
            <button className="p-2 rounded-md hover:bg-[var(--surface-active)] text-[var(--text-secondary)]" onClick={() => setMenuOpen(!menuOpen)}>
              <MoreHorizontal size={14} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-10 w-56 rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-lg z-20">
                <button className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-active)] text-[var(--text-primary)]">View full order history</button>
                <button className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-active)] text-[var(--text-primary)]">Log a complaint</button>
                <button className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-active)] text-[var(--text-primary)]">Send follow-up</button>
                <button className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--surface-active)] text-[var(--text-primary)]">Add note</button>
              </div>
            )}
          </div>
        </div>

        <ul className="flex flex-col gap-2">
          <li className="flex items-center gap-3 text-sm text-[var(--text-primary)]">
            <MapPin size={14} className="text-[var(--text-secondary)]" /> New York, USA
          </li>
          <li className="flex items-center gap-3 text-sm text-[var(--text-primary)]">
            <Clock size={14} className="text-[var(--text-secondary)]" /> 10:35 AM
          </li>
          <li className="flex items-center gap-3 text-sm text-[var(--text-primary)] font-mono">
            <Tag size={14} className="text-[var(--text-secondary)]" /> psid_8471294812
          </li>
        </ul>

        <div className="w-full h-px bg-[var(--border)]"></div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Active Order</h3>
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

        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Internal Notes</h3>
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
