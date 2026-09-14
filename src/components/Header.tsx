"use client";

import { Bell, Search, Menu, LogOut, ExternalLink, X } from "lucide-react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type NotificationRow = {
  id: string;
  title: string;
  message?: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
};

export function Header({
  collapsed,
  setSidebarOpenMobile,
}: {
  collapsed: boolean;
  setSidebarOpenMobile: (v: boolean) => void;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchResults, setSearchResults] = useState<Record<string, any[]>>({
    customers: [],
    conversations: [],
    products: [],
    orders: [],
    knowledge: [],
  });

  useEffect(() => {
    void fetch("/api/notifications?limit=6")
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((payload) => setNotifications(payload?.data ?? []))
      .catch(() => setNotifications([]));
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setSearchResults({ customers: [], conversations: [], products: [], orders: [], knowledge: [] });
      return;
    }

    const timeout = setTimeout(() => {
      void fetch(`/api/search?q=${encodeURIComponent(q)}`)
        .then((res) => res.ok ? res.json() : { data: { customers: [], conversations: [], products: [], orders: [], knowledge: [] } })
        .then((payload) => setSearchResults(payload?.data ?? { customers: [], conversations: [], products: [], orders: [], knowledge: [] }))
        .catch(() => setSearchResults({ customers: [], conversations: [], products: [], orders: [], knowledge: [] }));
    }, 250);

    return () => clearTimeout(timeout);
  }, [search]);

  const handleLogout = async () => {
    const supabase = createBrowserClient();
    try {
      await supabase.auth.signOut();
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH", body: JSON.stringify({ mark_all_read: true }), headers: { "Content-Type": "application/json" } });
    setNotifications((items) => items.map((n) => ({ ...n, is_read: true })));
  };

  const handleRead = async (id: string) => {
    await fetch("/api/notifications", { method: "PATCH", body: JSON.stringify({ id }), headers: { "Content-Type": "application/json" } });
    setNotifications((items) => items.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  return (
    <header
      className="fixed top-0 right-0 h-[var(--header-height)] bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)] z-30 transition-all duration-300 flex items-center justify-between px-4 lg:px-8"
      style={{ left: `var(${collapsed ? '--sidebar-collapsed' : '--sidebar-width'})` }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpenMobile(true)}
          className="lg:hidden p-2 rounded-md text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-hover)]"
        >
          <Menu size={20} />
        </button>

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-full focus-within:border-[var(--accent)] focus-within:shadow-[0_0_0_3px_var(--accent-glow)] transition-all relative">
          <Search size={16} className="text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers, orders..."
            className="bg-transparent border-none outline-none text-sm w-48 lg:w-64 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
          {search && <button className="text-[var(--text-muted)] hover:text-white" onClick={() => setSearch("")}><X size={14} /></button>}
          <div className="flex gap-1">
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] bg-[var(--surface-active)] text-[var(--text-muted)] rounded border border-[var(--border-light)]">⌘</kbd>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] bg-[var(--surface-active)] text-[var(--text-muted)] rounded border border-[var(--border-light)]">K</kbd>
          </div>

          {search.trim().length >= 2 && (
            <div className="absolute left-0 top-full mt-2 w-[min(520px,80vw)] bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-2xl p-3 z-50">
              <div className="text-xs uppercase text-[var(--text-muted)] mb-2">Global search</div>
              <div className="space-y-2 max-h-80 overflow-auto">
                {Object.entries(searchResults).flatMap(([bucket, rows]) => rows.length ? rows.map((row: any, idx: number) => (
                  <div key={`${bucket}-${row.id ?? idx}`} className="text-sm px-2 py-1 rounded border border-[var(--border)]">
                    <span className="font-semibold text-[var(--text-primary)] mr-2">{bucket}</span>
                    <span className="text-[var(--text-secondary)]">{row.name ?? row.title ?? row.order_number ?? row.last_message_preview ?? row.title ?? row.file_name ?? "Record"}</span>
                  </div>
                )) : [])}
                {Object.values(searchResults).every((arr) => arr.length === 0) && (
                  <div className="text-sm text-[var(--text-muted)]">No matching records</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-5">
        <div className="flex items-center gap-3 border-r border-[var(--border)] pr-3 lg:pr-5">
          <a href="/api/meta/connect" className="hidden sm:flex items-center gap-2 text-xs font-semibold px-2.5 py-1.5 bg-[var(--accent-glow)] text-[var(--accent-hover)] rounded-md hover:bg-[var(--accent)] hover:text-white transition-colors">
            Connect Meta App <ExternalLink size={12} />
          </a>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-full text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-hover)] transition-colors"
            >
              <Bell size={18} />
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--danger)] rounded-full border border-[var(--background)]"></span>}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-2xl p-3 z-50">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--text-primary)] text-sm">Notifications</span>
                  <button className="text-xs text-[var(--accent)] hover:underline" onClick={markAllRead}>Mark all read</button>
                </div>
                <div className="mt-2 space-y-2 max-h-64 overflow-auto">
                  {notifications.length === 0 && <div className="text-xs text-[var(--text-muted)]">No notifications</div>}
                  {notifications.map((n) => (
                    <button key={n.id} onClick={() => handleRead(n.id)} className="w-full text-left px-2 py-2 rounded border border-[var(--border)] hover:bg-[var(--surface-hover)]">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[var(--text-primary)] text-xs">{n.title}</span>
                        {!n.is_read && <span className="w-2 h-2 bg-[var(--accent)] rounded-full"></span>}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)]">{n.message ?? ""}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors px-2 py-1 rounded-md hover:bg-[var(--danger-bg)]"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
