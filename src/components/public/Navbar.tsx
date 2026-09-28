"use client";

import { useState } from "react";
import { CaretDown, List, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// Menu diselaraskan dengan isi halaman publik yang benar-benar ada
// (PRODUCT.md): hero, ringkasan, grafik, transaksi, pengumuman, kegiatan,
// jadwal sholat, kontak. Tidak ada halaman Profil/Virtual Tour/Wisata/Aula/Reservasi.
type MenuChild = { name: string; href: string };
type MenuItem = { name: string; href: string; children?: MenuChild[] };

const MENU: MenuItem[] = [
  { name: "Beranda", href: "#beranda" },
  { name: "Jadwal Sholat", href: "#jadwal-sholat" },
  {
    name: "Keuangan",
    href: "#keuangan",
    children: [
      { name: "Ringkasan Kas", href: "#ringkasan" },
      { name: "Grafik Bulanan", href: "#grafik" },
      { name: "Rincian Transaksi", href: "#transaksi" },
    ],
  },
  { name: "Berita", href: "#pengumuman" },
  { name: "Kegiatan", href: "#kegiatan" },
  { name: "Kontak", href: "#kontak" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDrop, setOpenDrop] = useState<string | null>(null);

  return (
    <nav
      aria-label="Navigasi utama"
      className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur"
    >
        <div className="container mx-auto flex h-14 items-center justify-center gap-2 px-4 md:px-6 lg:px-8">
          {/* Mobile toggle */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground lg:hidden"
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

          {/* Mobile label */}
          <p className="text-sm font-semibold tracking-normal text-foreground lg:hidden">
            Menu
          </p>
          <span className="w-9 lg:hidden" aria-hidden="true" />
        </div>

        {/* Mobile panel */}
        {mobileOpen && (
          <div className="border-t border-border/60 bg-background lg:hidden">
            <div className="container mx-auto space-y-1 px-4 py-3 md:px-6">
              <ul className="space-y-1">
                {MENU.map((item) => (
                  <li key={item.name} className="rounded-lg">
                    {item.children ? (
                      <>
                        <button
                          type="button"
                          aria-expanded={openDrop === item.name}
                          onClick={() => setOpenDrop((v) => (v === item.name ? null : item.name))}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold tracking-normal text-foreground hover:bg-muted"
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
                                className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-primary"
                              >
                                Semua {item.name}
                              </a>
                            </li>
                            {item.children.map((child) => (
                              <li key={child.name}>
                                <a
                                  href={child.href}
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
                        className="block rounded-xl px-3 py-2.5 text-sm font-semibold tracking-normal text-foreground hover:bg-muted hover:text-primary"
                      >
                        {item.name}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
    </nav>
  );
}
