"use client";

import { useState } from "react";
import { CaretDown, List, X, MagnifyingGlass } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// TODO(admin): ubah daftar menu dan href sesuai halaman yang dikelola admin.
// Semua href "#" adalah placeholder. BERITA menunjuk ke #pengumuman,
// KONTAK menunjuk ke #kontak footer. Sisanya menunggu halaman CMS.
type MenuChild = { name: string; href: string };
type MenuItem = { name: string; href: string; children?: MenuChild[] };

const MENU: MenuItem[] = [
  {
    name: "Profil",
    href: "#profil",
    children: [
      { name: "Sejarah", href: "#" },
      { name: "Visi Misi", href: "#" },
      { name: "Pengurus Takmir", href: "#" },
      { name: "Fasilitas", href: "#" },
    ],
  },
  { name: "Virtual Tour", href: "#virtual-tour" },
  {
    name: "Wisata",
    href: "#wisata",
    children: [
      { name: "Paket Wisata", href: "#" },
      { name: "Galeri", href: "#" },
    ],
  },
  {
    name: "Pendidikan",
    href: "#pendidikan",
    children: [
      { name: "TPA", href: "#" },
      { name: "Tahfidz", href: "#" },
      { name: "Kajian Rutin", href: "#" },
    ],
  },
  { name: "Aula", href: "#aula" },
  { name: "Berita", href: "#pengumuman" },
  { name: "Kontak", href: "#kontak" },
  { name: "Reservasi", href: "#reservasi" },
];

function SearchBox({ id, className }: { id: string; className?: string }) {
  return (
    <form
      role="search"
      aria-label="Cari di situs masjid"
      className={cn("flex items-center", className)}
      onSubmit={(e) => e.preventDefault()}
    >
      <label htmlFor={id} className="sr-only">
        Cari
      </label>
      <input
        id={id}
        type="search"
        placeholder="Cari"
        className="h-9 w-28 rounded-l-md border border-r-0 border-border bg-muted/60 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none md:w-32"
      />
      <button
        type="submit"
        aria-label="Cari"
        className="flex h-9 w-9 items-center justify-center rounded-r-md bg-primary text-primary-foreground transition-colors hover:opacity-90"
      >
        <MagnifyingGlass className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDrop, setOpenDrop] = useState<string | null>(null);

  return (
    <nav
      aria-label="Navigasi utama"
      className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur"
    >
        <div className="container mx-auto flex h-14 items-center justify-between gap-2 px-4 md:px-6 lg:px-8">
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

          {/* Desktop menu: satu baris, geser horizontal bila sempit */}
          <ul className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto lg:flex">
            {MENU.map((item) => (
              <li key={item.name} className="group relative shrink-0">
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
                      className="flex items-center gap-1 whitespace-nowrap rounded-md px-3 py-2 text-[13px] font-semibold uppercase tracking-wide text-foreground transition-colors hover:bg-muted hover:text-primary"
                    >
                      {item.name}
                      <CaretDown className="h-3.5 w-3.5" aria-hidden="true" />
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
                    className="block whitespace-nowrap rounded-md px-3 py-2 text-[13px] font-semibold uppercase tracking-wide text-foreground transition-colors hover:bg-muted hover:text-primary"
                  >
                    {item.name}
                  </a>
                )}
              </li>
            ))}
          </ul>

          {/* Mobile label */}
          <p className="text-sm font-semibold uppercase tracking-wide text-foreground lg:hidden">
            Menu
          </p>

          <SearchBox id="cari-desktop" className="hidden sm:flex" />
          <span className="w-9 sm:hidden" aria-hidden="true" />
        </div>

        {/* Mobile panel */}
        {mobileOpen && (
          <div className="border-t border-border/60 bg-background lg:hidden">
            <div className="container mx-auto space-y-1 px-4 py-3 md:px-6">
              <SearchBox id="cari-mobile" className="w-full pb-2 sm:hidden" />
              <ul className="space-y-1">
                {MENU.map((item) => (
                  <li key={item.name} className="rounded-lg">
                    {item.children ? (
                      <>
                        <button
                          type="button"
                          aria-expanded={openDrop === item.name}
                          onClick={() => setOpenDrop((v) => (v === item.name ? null : item.name))}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold uppercase tracking-wide text-foreground hover:bg-muted"
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
                        className="block rounded-lg px-3 py-2.5 text-sm font-semibold uppercase tracking-wide text-foreground hover:bg-muted hover:text-primary"
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
