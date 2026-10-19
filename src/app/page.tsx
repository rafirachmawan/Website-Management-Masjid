import Link from "next/link";
import { Hero } from "@/components/public/Hero";
import { Navbar } from "@/components/public/Navbar";
import { FinancialSummaryCards } from "@/components/public/FinancialSummaryCards";
import { FinancialChart } from "@/components/public/FinancialChart";
import { TransactionTable } from "@/components/public/TransactionTable";
import { AnnouncementsSection } from "@/components/public/AnnouncementsSection";
import { ActivitiesSection } from "@/components/public/ActivitiesSection";
import { Footer } from "@/components/public/Footer";
import { getPublicHomeData } from "@/server/services/public-home";

// Data diambil SATU KALI di server lalu diteruskan sebagai props.
// Efeknya: HTML sudah berisi angka & berita terbaru (bagus untuk SEO dan HP
// lambat), dan halaman tidak lagi menembak ~10 request ke /api diri sendiri.
// `force-dynamic` = begitu pengurus menyimpan di /admin, kunjungan berikutnya
// langsung melihat data terbaru.
export const dynamic = "force-dynamic";

export default async function Home() {
  const {
    profile,
    prayer,
    financialSummary,
    chartData,
    transactions,
    announcements,
    activities,
    config,
  } = await getPublicHomeData();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {profile === null && (
        <p
          role="status"
          className="border-b border-amber-500/25 bg-amber-500/10 px-4 py-2.5 text-center text-[13px] font-medium text-amber-800 dark:text-amber-200"
        >
          Website masjid dalam penyiapan — pengurus dapat melengkapi profil, keuangan,
          dan jadwal lewat halaman admin.
        </p>
      )}
      {/* Navbar sticky berlatar solid: hero mulai tepat di bawahnya. */}
      <div className="sticky top-0 z-50">
        <Navbar profile={profile} />
      </div>
      <div id="beranda" className="scroll-mt-20">
        <Hero profile={profile} prayer={prayer} config={config} />
      </div>
      <main className="flex flex-1 flex-col">
        {/* Keuangan — inti janji produk (transparansi): ringkasan kas, tren
            bulanan, lalu rincian per transaksi. Halaman /keuangan tetap ada
            sebagai versi lengkap (rekening donasi + filter). */}
        <div id="keuangan" className="flex scroll-mt-20 flex-col border-t border-border/60">
          <FinancialSummaryCards
            financialSummary={financialSummary}
            latestRecorder={transactions[0]?.recordedBy}
            timeZone={profile?.timezone}
          />
          <FinancialChart chartData={chartData} />
          {config.publicTransparency ? (
            <TransactionTable transactions={transactions} timeZone={profile?.timezone} />
          ) : (
            <div className="container mx-auto px-4 pb-14 md:px-6 md:pb-20 lg:px-8">
              <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
                <p className="font-semibold text-foreground">
                  Rincian transaksi disembunyikan pengurus
                </p>
                <p className="mx-auto mt-1.5 max-w-[60ch] text-pretty text-sm leading-relaxed text-muted-foreground">
                  Ringkasan dan grafik di atas tetap tampil; rincian per transaksi hanya
                  tersedia internal. Pengurus dapat mengaktifkan kembali lewat
                  Pengaturan → Transparansi.
                </p>
                <Link
                  href="/keuangan"
                  className="mt-4 inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-110"
                >
                  Buka halaman keuangan
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Informasi — transisi lembut dari keuangan: tanpa garis keras, hanya alas netral */}
        <div id="informasi" className="flex scroll-mt-20 flex-col">
          <div className="bg-muted/40">
            <AnnouncementsSection announcements={announcements} />
          </div>
          <ActivitiesSection activities={activities} timeZone={profile?.timezone} />
        </div>
      </main>
      <Footer profile={profile} />
    </div>
  );
}
