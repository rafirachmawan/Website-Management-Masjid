"use client";

import Link from "next/link";
import { WarningCircle } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Keadaan galat yang seragam untuk halaman admin.
//
// Latar masalah: `useApi` menyetel `data = null` DAN `error` saat permintaan
// gagal. Komponen yang hanya memeriksa `data` akan menampilkan skeleton
// selamanya (atau daftar kosong) seolah data memang belum ada — pengurus tidak
// tahu ada yang rusak. Pakai komponen ini agar selalu ada penjelasan + jalan
// keluar.
export function AdminErrorState({
  title = "Gagal memuat data",
  message,
  actionHref,
  actionLabel,
  code,
}: {
  title?: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
  code?: string;
}) {
  return (
    <Card className="border-destructive/30 shadow-sm" role="alert">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-bold">
          <WarningCircle className="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="max-w-[65ch] text-sm leading-relaxed text-muted-foreground">{message}</p>
        {code && <p className="font-mono text-xs text-muted-foreground/80">Kode: {code}</p>}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary"
          >
            Muat ulang halaman
          </button>
          {actionHref && actionLabel && (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {actionLabel}
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
