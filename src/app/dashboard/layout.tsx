"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [isClient, setIsClient] = useState(false); // To avoid hydration mismatch on screen size checks

  useEffect(() => {
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
  }, []);

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
          marginLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 
            ? (collapsed ? "var(--sidebar-collapsed)" : "var(--sidebar-width)")
            : "0" 
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
