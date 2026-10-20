import Link from "next/link";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { getMosqueProfile } from "@/server/services/mosque";

// 404 dengan branding masjid. Dipakai otomatis oleh notFound() di
// `/berita/[id]`, `/kegiatan/[id]`, dan URL yang tidak dikenal — bukan lagi
// halaman bawaan Next yang polos tanpa Navbar.
export default async function NotFound() {
  // DB belum siap tidak boleh merusak halaman 404 → fallback tanpa profil.
  const profile = await getMosqueProfile().catch(() => null);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40">
        <Navbar profile={profile} />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-16 md:py-24">
        <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-8 text-center shadow-[0_24px_50px_-30px_rgba(4,47,34,0.45)] md:p-12">
          <p className="font-display text-5xl font-bold text-primary/25 tabular-nums md:text-6xl">
            404
          </p>
          <h1 className="font-display mt-4 text-2xl font-semibold text-foreground md:text-3xl">
            Halaman tidak ditemukan
          </h1>
          <p className="mx-auto mt-3 max-w-[52ch] text-pretty text-sm leading-relaxed text-muted-foreground md:text-[15px]">
            Tautan yang Anda buka mungkin salah ketik, sudah dipindahkan, atau
            datanya telah dihapus pengurus.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
            <Link
              href="/"
              className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:-translate-y-px hover:brightness-110 active:translate-y-0 active:scale-[0.98]"
            >
              Kembali ke Beranda
            </Link>
            <Link
              href="/keuangan"
              className="inline-flex h-10 items-center rounded-full border border-border bg-card px-5 text-sm font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              Lihat Laporan Kas
            </Link>
          </div>
        </div>
      </main>

      <Footer profile={profile} />
    </div>
  );
}
