// Indikator muat halaman publik. Semua halaman publik `force-dynamic`
// (baca database tiap kunjungan), jadi jeda singkat itu wajar — lebih baik
// terlihat daripada layar kosong.
//
// Dipasang per-folder (`berita/loading.tsx`, dst.), BUKAN di `app/loading.tsx`,
// supaya batas muat tidak ikut menutupi seluruh panel admin saat navigasi.
export function PageLoading({ label = "Memuat halaman…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-3 bg-background"
    >
      <span
        aria-hidden="true"
        className="h-9 w-9 animate-spin rounded-full border-2 border-border border-t-primary"
      />
      <p className="text-sm text-muted-foreground">{label}</p>
      <span className="sr-only">{label}</span>
    </div>
  );
}
