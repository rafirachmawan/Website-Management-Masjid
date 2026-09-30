"use client";

import { ReactNode, useState, createContext, useContext, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "./Sidebar";
import { AdminHeader } from "./AdminHeader";
import { WarningCircle } from "@phosphor-icons/react";
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
  const [showDefaultPwBanner, setShowDefaultPwBanner] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Halaman login dirender tanpa shell sidebar/header.
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    fetch("/api/admin/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setShowDefaultPwBanner(d?.authenticated === true && d?.isDefaultPassword === true))
      .catch(() => null);
  }, [isLoginPage, pathname]);

  if (isLoginPage) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

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
          {showDefaultPwBanner && (
            <p role="status" className="flex flex-wrap items-center gap-2 border-b border-amber-500/25 bg-amber-500/10 px-4 py-2.5 text-[13px] font-medium text-amber-800 md:px-6 dark:text-amber-200">
              <WarningCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Anda masih memakai kata sandi bawaan.{" "}
                <Link href="/admin/settings" className="font-bold underline underline-offset-2">
                  Segera ganti di Pengaturan → Keamanan
                </Link>
                .
              </span>
            </p>
          )}
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