"use client";

import { Bell, Search, Menu, LogOut, ExternalLink } from "lucide-react";
import { Link } from "next/link";
import { createBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function Header({ 
  collapsed, 
  setSidebarOpenMobile 
}: { 
  collapsed: boolean;
  setSidebarOpenMobile: (v: boolean) => void;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header 
      className="fixed top-0 right-0 h-[var(--header-height)] bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)] z-30 transition-all duration-300 flex items-center justify-between px-4 lg:px-8"
      style={{ left: `var(${collapsed ? '--sidebar-collapsed' : '--sidebar-width'})` }}
    >
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button 
          onClick={() => setSidebarOpenMobile(true)}
          className="lg:hidden p-2 rounded-md text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-hover)]"
        >
          <Menu size={20} />
        </button>

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-full focus-within:border-[var(--accent)] focus-within:shadow-[0_0_0_3px_var(--accent-glow)] transition-all">
          <Search size={16} className="text-[var(--text-muted)]" />
          <input 
            type="text" 
            placeholder="Search customers, orders..." 
            className="bg-transparent border-none outline-none text-sm w-48 lg:w-64 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
          <div className="flex gap-1">
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] bg-[var(--surface-active)] text-[var(--text-muted)] rounded border border-[var(--border-light)]">⌘</kbd>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] bg-[var(--surface-active)] text-[var(--text-muted)] rounded border border-[var(--border-light)]">K</kbd>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-5">
        <div className="flex items-center gap-3 border-r border-[var(--border)] pr-3 lg:pr-5">
          <a href="#" className="hidden sm:flex items-center gap-2 text-xs font-semibold px-2.5 py-1.5 bg-[var(--accent-glow)] text-[var(--accent-hover)] rounded-md hover:bg-[var(--accent)] hover:text-white transition-colors">
            Connect Meta App <ExternalLink size={12} />
          </a>
          
          <button className="relative p-2 rounded-full text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-hover)] transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--danger)] rounded-full border border-[var(--background)]"></span>
          </button>
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
