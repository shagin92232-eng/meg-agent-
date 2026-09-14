"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { createBrowserClient } from "@/lib/supabase/client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [isClient, setIsClient] = useState(false); // To avoid hydration mismatch on screen size checks
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient();
    void supabase.auth.getSession().then((result) => {
      const sessionExists = Boolean(result.data.session);
      const hasSessionError = Boolean(result.error);

      if (!sessionExists && !hasSessionError) {
        router.replace("/login");
      }
    });

    setIsClient(true);
    const checkScreen = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--background)] flex bg-pattern">
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden lg:block">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isClient && sidebarOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setSidebarOpenMobile(false)}
          />
          <div className="relative w-[var(--sidebar-width)] h-full flex-shrink-0 animate-slide-right">
            <Sidebar collapsed={false} setCollapsed={() => {}} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div 
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{
          marginLeft: collapsed ? "var(--sidebar-collapsed)" : "var(--sidebar-width)"
        }}
      >
        <Header collapsed={collapsed} setSidebarOpenMobile={setSidebarOpenMobile} />
        
        <main className="flex-1 overflow-auto mt-[var(--header-height)] p-4 lg:p-8">
          <div className="mx-auto w-full max-w-7xl animate-fade-in">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}
