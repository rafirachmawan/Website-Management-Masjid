"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { CaretDown, List, X, Heart } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { MosqueProfile } from "@/types";

// Menu diselaraskan dengan isi halaman publik yang benar-benar ada
// (PRODUCT.md): hero, takmir, keuangan, pengumuman, kegiatan, jadwal sholat,
// kontak. Tidak ada halaman Profil/Virtual Tour/Wisata/Aula/Reservasi.
type MenuChild = { name: string; href: string };
type MenuItem = { name: string; href: string; children?: MenuChild[] };

// Menu memakai path absolut ("/#...") supaya tetap berfungsi saat diklik
// dari halaman detail (/berita/[id], /kegiatan/[id]), bukan hanya beranda.
const MENU: MenuItem[] = [
  { name: "Beranda", href: "/#beranda" },
  { name: "Jadwal Sholat", href: "/#jadwal-sholat" },
  { name: "Pengurus", href: "/pengurus" },
  {
    name: "Keuangan",
    href: "/keuangan",
    children: [
      { name: "Ringkasan Kas", href: "/keuangan#ringkasan" },
      { name: "Rincian Transaksi", href: "/keuangan#transaksi" },
    ],
  },
  { name: "Berita", href: "/berita" },
  { name: "Kegiatan", href: "/kegiatan" },
  { name: "Kontak", href: "/#kontak" },
];

function splitHref(href: string): { path: string; hash: string } {
  const idx = href.indexOf("#");
  if (idx === -1) return { path: href || "/", hash: "" };
  return {
    path: href.slice(0, idx) || "/",
    hash: href.slice(idx + 1),
  };
}

export function Navbar({ profile }: { profile?: MosqueProfile | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDrop, setOpenDrop] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  // Identitas masjid sepenuhnya dari portal admin (Pengaturan → Profil).
  // Nama = profile.name; logo = profile.logoUrl (fallback inisial).
  // Sub-teks memakai shortName bila berbeda dari nama, bila sama/kosong
  // memakai tagline netral — tidak ada nama yang di-hardcode di sini.
  const brandName = profile?.name?.trim() || "Website Masjid";
  const shortName = profile?.shortName?.trim() || "";
  const brandTagline =
    shortName && shortName.toLowerCase() !== brandName.toLowerCase()
      ? shortName
      : "Keuangan & Informasi Masjid";
  const brandInitials = (shortName || brandName).slice(0, 2).toUpperCase();
  const brandLogoUrl = profile?.logoUrl?.trim() ? profile.logoUrl.trim() : null;
  const closeMenu = () => {
    setMobileOpen(false);
    setOpenDrop(null);
  };

  // Navbar selalu berlatar solid; state ini hanya mempertegas
  // bayangan setelah halaman di-scroll.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lacak hash aktif untuk section jangkar (/#beranda, /#kontak, ...).
  useEffect(() => {
    const readHash = () => setHash(window.location.hash.replace(/^#/, ""));
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, [pathname]);

  // Penanda aktif ala referensi (titik di bawah item aktif).
  const isItemActive = (item: MenuItem): boolean => {
    const { path, hash: itemHash } = splitHref(item.href);
    if (item.children) {
      if (pathname === path || pathname.startsWith(`${path}/`)) return true;
      return item.children.some((child) => {
        const c = splitHref(child.href);
        if (c.hash && (pathname === c.path || pathname.startsWith(`${c.path}/`))) {
          if (!hash) return true;
          return hash === c.hash;
        }
        return pathname === c.path || pathname.startsWith(`${c.path}/`);
      });
    }
    if (itemHash) return pathname === path && (hash === itemHash || (!hash && itemHash === "beranda"));
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const linkBase =
    "relative inline-flex h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 text-sm font-semibold tracking-normal transition-all duration-200 active:scale-[0.98] xl:px-4";

  const renderDot = (active: boolean) =>
    active ? (
      <span
        aria-hidden="true"
        className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary"
      />
    ) : null;

  return (
    <nav
      aria-label="Navigasi utama"
      className={cn(
        "relative z-10 border-b border-border/60 bg-background/95 font-sans backdrop-blur-md transition-all duration-300",
        // Selalu berlatar solid (tidak transparan) supaya tetap terbaca
        // di atas foto hero maupun konten.
        scrolled || mobileOpen ? "shadow-md" : "shadow-sm",
      )}
    >
      {/* Layout 3 zona ala referensi: brand kiri, menu tengah, CTA kanan. */}
      <div className="container mx-auto flex h-14 items-center justify-between gap-3 px-4 md:px-6 lg:h-16 lg:gap-4 lg:px-8">
        {/* Brand: logo + nama masjid (dari admin) + sub-teks. Tampil di semua ukuran. */}
        <Link
          href="/#beranda"
          onClick={closeMenu}
          className="flex min-w-0 shrink-0 items-center gap-2.5"
          aria-label="Ke beranda"
        >
          {brandLogoUrl ? (
            <img
              src={brandLogoUrl}
              alt={`Logo ${brandName}`}
              className="h-8 w-8 shrink-0 rounded-full border border-border bg-white object-cover lg:h-10 lg:w-10"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold tracking-wide text-primary-foreground lg:h-10 lg:w-10 lg:text-xs"
            >
              {brandInitials}
            </span>
          )}
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="block max-w-[52vw] truncate text-sm font-bold tracking-tight text-foreground sm:max-w-[32vw] lg:max-w-[220px] lg:text-[15px] xl:max-w-[260px]">
              {brandName}
            </span>
            <span className="block max-w-[52vw] truncate text-[11px] font-medium text-muted-foreground sm:max-w-[32vw] lg:max-w-[220px] lg:text-xs xl:max-w-[260px]">
              {brandTagline}
            </span>
          </span>
        </Link>

        {/* Desktop menu: tengah, berjarak lega seperti referensi */}
        <ul className="hidden min-w-0 flex-1 items-center justify-center lg:flex lg:gap-x-0.5 xl:gap-x-1.5">
          {MENU.map((item) => {
            const active = isItemActive(item);
            return (
              <li key={item.name} className="group relative flex items-center">
                {item.children ? (
                  <>
                    <button
                      type="button"
                      aria-haspopup="true"
                      aria-expanded={openDrop === item.name}
                      onClick={() => setOpenDrop((v) => (v === item.name ? null : item.name))}
                      onBlur={(e) => {
                        if (!e.currentTarget.parentElement?.contains(e.relatedTarget)) setOpenDrop(null);
                      }}
                      className={cn(
                        linkBase,
                        active ? "text-primary" : "text-foreground hover:bg-primary/[0.07] hover:text-primary",
                      )}
                    >
                      {item.name}
                      <CaretDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {renderDot(active)}
                    </button>
                    <ul
                      className={cn(
                        "absolute left-1/2 top-full z-50 min-w-48 -translate-x-1/2 rounded-xl border border-border bg-card p-1.5 shadow-lg",
                        openDrop === item.name ? "block" : "hidden group-hover:block group-focus-within:block"
                      )}
                    >
                      {item.children.map((child) => (
                        <li key={child.name}>
                          <a
                            href={child.href}
                            className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium normal-case tracking-normal text-foreground transition-colors hover:bg-muted hover:text-primary"
                          >
                            {child.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <a
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      linkBase,
                      active ? "text-primary" : "text-foreground hover:bg-primary/[0.07] hover:text-primary",
                    )}
                  >
                    {item.name}
                    {renderDot(active)}
                  </a>
                )}
              </li>
            );
          })}
        </ul>

        {/* Kanan: CTA pill outline ala referensi + toggle mobile */}
        <div className="flex shrink-0 items-center gap-2">
          <a
            href="/keuangan#donasi"
            className="hidden h-10 items-center gap-2 rounded-full border border-primary/50 px-5 text-sm font-semibold whitespace-nowrap text-primary transition-all duration-200 hover:bg-primary hover:text-primary-foreground active:scale-[0.98] lg:inline-flex"
          >
            <Heart className="h-4 w-4" weight="bold" aria-hidden="true" />
            Salurkan Infaq
          </a>
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted active:scale-95 lg:hidden"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <List className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

        {/* Mobile panel: mengambang (absolute) supaya tidak mendorong
            konten saat dibuka, baik di beranda maupun halaman lain */}
        {mobileOpen && (
          <div className="absolute inset-x-3 top-full z-50 rounded-2xl border border-border bg-card shadow-xl backdrop-blur-md lg:hidden">
            <div className="space-y-1 px-3 py-3">
              <ul className="space-y-1">
                {MENU.map((item) => (
                  <li key={item.name} className="rounded-lg">
                    {item.children ? (
                      <>
                        <button
                          type="button"
                          aria-expanded={openDrop === item.name}
                          onClick={() => setOpenDrop((v) => (v === item.name ? null : item.name))}
                          className={cn(
                            "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold tracking-normal transition-colors",
                            openDrop === item.name
                              ? "bg-primary/[0.07] text-primary"
                              : "text-foreground hover:bg-muted",
                          )}
                        >
                          {item.name}
                          <CaretDown
                            className={cn("h-4 w-4 transition-transform", openDrop === item.name && "rotate-180")}
                            aria-hidden="true"
                          />
                        </button>
                        {openDrop === item.name && (
                          <ul className="ml-2 space-y-0.5 border-l border-border/60 py-1 pl-3">
                            <li>
                              <a
                                href={item.href}
                                onClick={closeMenu}
                                className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-primary"
                              >
                                Semua {item.name}
                              </a>
                            </li>
                            {item.children.map((child) => (
                              <li key={child.name}>
                                <a
                                  href={child.href}
                                  onClick={closeMenu}
                                  className="block rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted hover:text-primary"
                                >
                                  {child.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <a
                        href={item.href}
                        onClick={closeMenu}
                        className="block rounded-xl px-3 py-2.5 text-sm font-semibold tracking-normal text-foreground transition-colors hover:bg-muted hover:text-primary active:bg-muted"
                      >
                        {item.name}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
              <div className="border-t border-border/60 px-1 pt-3 pb-1">
                <a
                  href="/keuangan#donasi"
                  onClick={closeMenu}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.99]"
                >
                  <Heart className="h-4 w-4" weight="fill" aria-hidden="true" />
                  Salurkan Infaq
                </a>
              </div>
            </div>
          </div>
        )}
    </nav>
  );
}
