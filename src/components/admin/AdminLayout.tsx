"use client";

import { ReactNode, useState, createContext, useContext, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { AdminHeader } from "./AdminHeader";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: ReactNode;
}

interface SidebarContextType {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within AdminLayout");
  }
  return context;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const sidebarWidth = collapsed ? 64 : 256; // w-16 = 64px, w-64 = 256px

  return (
    <SidebarContext.Provider value={{ isMobileOpen, setIsMobileOpen, collapsed, setCollapsed }}>
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        
        {/* Mobile overlay */}
        {isMobile && isMobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        <div className="flex-1 min-w-0 flex flex-col" style={{ marginLeft: isMobile ? 0 : sidebarWidth }}>
          <AdminHeader />
          <main
            className={cn(
              "flex-1 transition-all duration-300",
              isMobile ? "p-4" : "p-6 lg:p-8"
            )}
            id="main-content"
            tabIndex={-1}
          >
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}