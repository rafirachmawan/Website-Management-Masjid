"use client";

import { useState } from "react";
import { List, Moon, Sun, User, SignOut, CaretRight } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Gear } from "@phosphor-icons/react";
import { useSidebar } from "./AdminLayout";

// Label generik — tidak ada sesi profil per pengguna (satu akun pengurus).
const user = {
  name: "Pengurus",
  role: "Admin Masjid",
  initials: "AM",
};

export function AdminHeader() {
  const { isMobileOpen, setIsMobileOpen } = useSidebar();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch("/api/admin/session", { method: "DELETE" });
    } catch {
      // Tetap keluar walau request gagal — cookie akan kedaluwarsa sendiri.
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  };

  const SEGMENT_LABELS: Record<string, string> = {
    announcements: "Berita",
    activities: "Kegiatan",
    transactions: "Transaksi Kas",
    categories: "Kategori Kas",
    reports: "Laporan Keuangan",
    users: "Pengurus",
    settings: "Pengaturan",
    "prayer-schedule": "Jadwal Sholat",
  };

  const breadcrumbs = pathname
    .replace("/admin", "")
    .split("/")
    .filter(Boolean)
    .map((segment, index, arr) => ({
      label:
        SEGMENT_LABELS[segment] ??
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
      href: "/admin/" + arr.slice(0, index + 1).join("/"),
      isLast: index === arr.length - 1,
    }));

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-1 lg:gap-4">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="lg:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label={isMobileOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={isMobileOpen}
          >
            <List className="w-6 h-6" />
          </button>

          {/* Judul halaman ringkas khusus mobile (breadcrumb hanya tampil di desktop) */}
          <span className="min-w-0 truncate text-sm font-semibold text-foreground lg:hidden">
            {breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : "Overview"}
          </span>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Breadcrumb">
            <span className="text-sm text-muted-foreground">Admin</span>
            {breadcrumbs.length > 0 && (
              <>
                <CaretRight className="w-3.5 h-3.5 text-muted-foreground/60" aria-hidden="true" />
                {breadcrumbs.map((crumb, i) => (
                  <span key={crumb.href} className="flex items-center gap-1">
                    {i > 0 && <CaretRight className="w-3.5 h-3.5 text-muted-foreground/60" aria-hidden="true" />}
                    {crumb.isLast ? (
                      <span className="text-sm font-medium text-foreground">{crumb.label}</span>
                    ) : (
                      <Link href={crumb.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {crumb.label}
                      </Link>
                    )}
                  </span>
                ))}
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={theme === "dark" ? "Mode terang" : "Mode gelap"}
          >
            <Sun className="w-5 h-5 rotate-[-15deg] scale-0 transition-transform dark:rotate-0 dark:scale-100" />
            <Moon className="w-5 h-5 rotate-90 scale-100 transition-transform dark:rotate-0 dark:scale-0" />
          </Button>

          <DropdownMenu>
            {/* CATATAN: pakai `render`, bukan-child. DropdownMenuTrigger dari
                base-ui sudah merender <button> sendiri; menaruh <Button> di
                dalamnya membuat <button> di dalam <button> → hydration error. */}
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              }
            />
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                render={
                  <Link
                    href="/admin/settings"
                    className="flex w-full items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Profil & Pengaturan
                  </Link>
                }
              />
              <DropdownMenuItem
                render={
                  <Link
                    href="/admin/settings"
                    className="flex w-full items-center gap-2"
                  >
                    <Gear className="w-4 h-4" />
                    Pengaturan
                  </Link>
                }
              />
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                disabled={isLoggingOut}
                render={
                  <button
                    type="button"
                    onClick={logout}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-2"
                  >
                    <SignOut className="w-4 h-4" />
                    {isLoggingOut ? "Keluar…" : "Keluar"}
                  </button>
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}