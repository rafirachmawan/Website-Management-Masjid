"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Layout,
  Coins,
  FileText,
  ListChecks,
  Users,
  Gear,
  Mosque,
  ChartBar,
  CaretLeft,
  CaretRight,
  SignOut,
  X,
} from "@phosphor-icons/react";
import { useSidebar } from "./AdminLayout";
import { useApi } from "@/lib/api";
import { getInitials } from "@/lib/utils";
import type { MosqueProfile } from "@/types";

const navigation = [
  { name: "Overview", href: "/admin", icon: Layout },
  { name: "Transaksi Kas", href: "/admin/transactions", icon: Coins },
  { name: "Laporan Keuangan", href: "/admin/reports", icon: FileText },
  { name: "Berita", href: "/admin/announcements", icon: ListChecks },
  { name: "Kegiatan", href: "/admin/activities", icon: ChartBar },
  { name: "Jadwal Sholat", href: "/admin/prayer-schedule", icon: Mosque },
  { name: "Pengurus", href: "/admin/users", icon: Users },
  { name: "Pengaturan", href: "/admin/settings", icon: Gear },
];

export function Sidebar() {
  const { isMobileOpen, setIsMobileOpen, collapsed, setCollapsed } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { data: profile } = useApi<MosqueProfile>("/api/mosque-profile");
  const brandName = profile?.shortName || profile?.name || "Masjid";
  const brandInitials = profile ? getInitials(profile.shortName || profile.name) : "M";

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close mobile drawer on navigation
  const handleNavClick = () => {
    if (isMobile) setIsMobileOpen(false);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch("/api/admin/session", { method: "DELETE" });
    } catch {
      // Tetap keluar walau request gagal — cookie akan kedaluwarsa sendiri.
    } finally {
      handleNavClick();
      router.replace("/admin/login");
      router.refresh();
    }
  };

  const sidebarStyle = isMobile
    ? { transform: isMobileOpen ? "translateX(0)" : "translateX(-100%)" }
    : {};

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 h-full border-r border-border bg-card transition-all duration-300",
        isMobile ? "w-64" : collapsed ? "w-16" : "w-64",
        isMobile && "lg:translate-x-0"
      )}
      style={sidebarStyle}
      aria-label="Navigasi admin"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          {!collapsed && !isMobile && (
            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">{brandInitials}</span>
              </div>
              <span className="font-display text-[15px] font-semibold text-foreground">{brandName}</span>
            </Link>
          )}
          {isMobile && (
            <span className="font-display text-[15px] font-semibold text-foreground">{brandName}</span>
          )}
          <button
            onClick={() => {
              if (isMobile) {
                setIsMobileOpen(false);
              } else {
                setCollapsed(!collapsed);
              }
            }}
            className={cn(
              "p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors",
              !isMobile && collapsed && "ml-auto"
            )}
            aria-label={isMobile ? "Tutup menu" : collapsed ? "Perluas sidebar" : "Collapse sidebar"}
            aria-expanded={isMobile ? isMobileOpen : !collapsed}
          >
            {isMobile ? <X className="w-5 h-5" /> : collapsed ? <CaretRight className="w-5 h-5" /> : <CaretLeft className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1" aria-label="Menu utama">
          {navigation.map((item) => {
            const isActive = item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  collapsed && !isMobile && "justify-center"
                )}
                aria-current={isActive ? "page" : undefined}
                title={collapsed && !isMobile ? item.name : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                {(isMobile || !collapsed) && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleNavClick}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors",
              collapsed && !isMobile && "justify-center"
            )}
            title={collapsed && !isMobile ? "Lihat halaman publik" : undefined}
          >
            <Layout className="w-5 h-5 shrink-0" aria-hidden="true" />
            {(isMobile || !collapsed) && <span>Lihat Publik</span>}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={cn(
              "mt-1 flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-destructive transition-colors disabled:opacity-60",
              collapsed && !isMobile && "justify-center"
            )}
            title={collapsed && !isMobile ? "Keluar" : undefined}
          >
            <SignOut className="w-5 h-5 shrink-0" aria-hidden="true" />
            {(isMobile || !collapsed) && <span>{isLoggingOut ? "Keluar…" : "Keluar"}</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}