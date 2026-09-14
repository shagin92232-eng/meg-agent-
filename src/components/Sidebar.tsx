"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  MessageSquare, 
  Package, 
  ShoppingCart, 
  BookOpen, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Bot
} from "lucide-react";

export function Sidebar({ 
  collapsed, 
  setCollapsed 
}: { 
  collapsed: boolean; 
  setCollapsed: (v: boolean) => void 
}) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    let active = true;
    void fetch("/api/conversations?limit=100", { credentials: "same-origin" })
      .then((r) => r.ok ? r.json() : Promise.reject(r))
      .then((payload) => {
        if (!active) return;
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        const count = rows.filter((row: any) => Number(row.unread_count ?? 0) > 0).length;
        setUnreadCount(count);
      })
      .catch(() => setUnreadCount(0));
    return () => { active = false; };
  }, []);

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Conversations", href: "/dashboard/conversations", icon: MessageSquare, badge: unreadCount > 0 ? String(unreadCount) : undefined },
    { name: "Products", href: "/dashboard/products", icon: Package },
    { name: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
    { name: "Knowledge Base", href: "/dashboard/knowledge", icon: BookOpen },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <aside 
      className={`fixed left-0 top-0 h-full bg-[var(--surface)] border-r border-[var(--border)] transition-all duration-300 z-40 flex flex-col`}
      style={{ width: collapsed ? "var(--sidebar-collapsed)" : "var(--sidebar-width)" }}
    >
      {/* Logo Area */}
      <div className="h-[var(--header-height)] flex items-center justify-between px-4 border-b border-[var(--border)]">
        <div className={`flex items-center gap-3 overflow-hidden transition-opacity duration-300 ${collapsed ? "opacity-0 w-0" : "opacity-100"}`}>
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center shrink-0">
            <Bot size={20} />
          </div>
          <span className="font-bold text-[var(--text-primary)] whitespace-nowrap tracking-wide">
            Messeng AI
          </span>
        </div>
        
        {collapsed && (
          <div className="w-full h-full flex items-center justify-center absolute left-0 top-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center">
              <Bot size={20} />
            </div>
          </div>
        )}

        <button 
          onClick={() => setCollapsed(!collapsed)}
          className={`shrink-0 p-1.5 rounded-md text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-hover)] transition-colors absolute right-[-14px] top-4 bg-[var(--surface)] border border-[var(--border)] z-50`}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-6 px-3 flex flex-col gap-2 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative group ${
                isActive 
                  ? "bg-[var(--accent-glow)] text-[var(--accent-hover)]" 
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
              }`}
            >
              <item.icon size={20} className={`shrink-0 ${isActive ? "text-[var(--accent)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors"}`} />
              
              <span className={`whitespace-nowrap font-medium text-sm transition-opacity duration-200 ${collapsed ? "opacity-0 hidden" : "opacity-100 block"}`}>
                {item.name}
              </span>

              {item.badge && !collapsed && (
                <span className="ml-auto bg-[var(--accent)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-[var(--surface-active)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Area */}
      <div className="p-4 border-t border-[var(--border)]">
        <div className={`flex items-center gap-3 transition-all ${collapsed ? "justify-center" : ""}`}>
          <div className="avatar avatar-sm">
            SJ
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-[var(--text-primary)] truncate">Admin Viewer</span>
              <span className="text-xs text-[var(--text-muted)] truncate">admin@meg.ai</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
