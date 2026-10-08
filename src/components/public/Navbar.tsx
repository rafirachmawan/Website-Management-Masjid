"use client";

import { useState, useEffect } from "react";
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

export function Navbar({ profile }: { profile?: MosqueProfile | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDrop, setOpenDrop] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // Identitas masjid untuk bar mobile (logo + nama).
  // Logo mengikuti fitur yang diatur portal admin (Pengaturan → File logo / logoUrl).
  // Bila admin sudah mengunggah logo, tampilkan gambarnya; bila belum, fallback ke inisial.
  const brandName = profile?.name?.trim() || "Website Masjid";
  const brandShort = (profile?.shortName?.trim() || brandName).slice(0, 2).toUpperCase();
  const brandLogoUrl = profile?.logoUrl?.trim() ? profile.logoUrl.trim() : null;
  const closeMenu = () => {
    setMobileOpen(false);
    setOpenDrop(null);
  };

  // Setelah di-scroll sedikit, beri latar solid + blur supaya menu
  // tetap terbaca di atas foto/ konten dan terlihat "mengikuti".
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label="Navigasi utama"
      className={cn(
        "relative z-10 font-sans transition-all duration-300",
        // Mobile: selalu berlatar solid supaya rapi & terbaca di atas foto hero.
        "border-b border-border/60 bg-background/90 shadow-sm backdrop-blur-md",
        // Desktop: transparan di atas hero, solid setelah di-scroll.
        scrolled || mobileOpen
          ? "lg:border-border/60 lg:bg-background/90 lg:shadow-sm lg:backdrop-blur-md"
          : "lg:border-transparent lg:bg-transparent lg:shadow-none lg:backdrop-blur-none",
      )}
    >
        <div className="container mx-auto flex h-14 items-center justify-between gap-3 px-4 md:px-6 lg:justify-center lg:gap-2 lg:px-8">
          {/* Brand mobile: logo + nama masjid */}
          <a
            href="/#beranda"
            onClick={closeMenu}
            className="flex min-w-0 items-center gap-2.5 lg:hidden"
            aria-label="Ke beranda"
          >
            {brandLogoUrl ? (
              <img
                src={brandLogoUrl}
                alt={`Logo ${brandName}`}
                className="h-8 w-8 shrink-0 rounded-full border border-border bg-white object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold tracking-wide text-primary-foreground"
              >
                {brandShort}
              </span>
            )}
            <span className="block max-w-[56vw] truncate text-sm font-bold tracking-tight text-foreground">
              {brandName}
            </span>
          </a>
          {/* Mobile toggle */}
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

          {/* Desktop menu: satu basis tinggi & display untuk semua item
              agar tombol dropdown sejajar presisi dengan link biasa */}
          <ul className="hidden items-center justify-center lg:flex lg:gap-x-0.5 xl:gap-x-1">
            {MENU.map((item) => (
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
                      className="inline-flex h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 text-sm font-semibold tracking-normal text-foreground transition-all duration-200 hover:bg-primary/[0.07] hover:text-primary active:scale-[0.98] xl:px-4"
                    >
                      {item.name}
                      <CaretDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
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
                    className="inline-flex h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 text-sm font-semibold tracking-normal text-foreground transition-all duration-200 hover:bg-primary/[0.07] hover:text-primary active:scale-[0.98] xl:px-4"
                  >
                    {item.name}
                  </a>
                )}
              </li>
            ))}
          </ul>
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
