"use client";

import { useEffect } from "react";
import Link from "next/link";
import { WarningCircle, ArrowClockwise, House } from "@phosphor-icons/react";

// Batas galat global: bila render sebuah halaman gagal (DB terkunci, data
// rusak), jamaah melihat pesan yang jelas + tombol coba lagi — bukan layar
// putih atau stack trace Next.js.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Detail hanya ke konsol peramban; jamaah cukup melihat pesan ramah.
    console.error("[app] galat render:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-8 text-center shadow-[0_24px_50px_-30px_rgba(4,47,34,0.45)] md:p-12">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
          <WarningCircle className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="font-display mt-5 text-2xl font-semibold text-foreground md:text-3xl">
          Terjadi kendala saat memuat halaman
        </h1>
        <p className="mx-auto mt-3 max-w-[52ch] text-pretty text-sm leading-relaxed text-muted-foreground md:text-[15px]">
          Data mungkin sedang diperbarui pengurus. Silakan coba lagi sebentar —
          bila tetap gagal, hubungi takmir masjid.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-xs text-muted-foreground/80">
            Kode: {error.digest}
          </p>
        )}

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:-translate-y-px hover:brightness-110 active:translate-y-0 active:scale-[0.98]"
          >
            <ArrowClockwise className="h-4 w-4" aria-hidden="true" />
            Coba lagi
          </button>
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            <House className="h-4 w-4" aria-hidden="true" />
            Ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
