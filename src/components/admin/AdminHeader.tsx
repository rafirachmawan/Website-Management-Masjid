"use client";

import { List, Bell, Moon, Sun, User, SignOut, CaretRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Gear } from "@phosphor-icons/react";
import { useSidebar } from "./AdminLayout";

const user = {
  name: "Ust. Ahmad",
  role: "Bendahara",
  email: "ahmad@masjidarrahman.or.id",
  initials: "UA",
};

export function AdminHeader() {
  const { isMobileOpen, setIsMobileOpen } = useSidebar();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  const SEGMENT_LABELS: Record<string, string> = {
    announcements: "Berita",
    activities: "Kegiatan",
    transactions: "Transaksi Kas",
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
      href: "/admin" + arr.slice(0, index + 1).join("/"),
      isLast: index === arr.length - 1,
    }));

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="lg:hidden p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label={isMobileOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={isMobileOpen}
          >
            <List className="w-6 h-6" />
          </button>

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
                    <AvatarImage src="/avatar.png" alt={user.name} />
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
                    href="/admin/profile"
                    className="flex w-full items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Profil
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
                render={
                  <button type="button" className="flex w-full items-center gap-2">
                    <SignOut className="w-4 h-4" />
                    Keluar
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