import { Hero } from "@/components/public/Hero";
import { FinancialSummaryCards } from "@/components/public/FinancialSummaryCards";
import { TransactionTable } from "@/components/public/TransactionTable";
import { AnnouncementsSection } from "@/components/public/AnnouncementsSection";
import { ActivitiesSection } from "@/components/public/ActivitiesSection";
import { OfficialsSection } from "@/components/public/OfficialsSection";
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
    transactions,
    announcements,
    activities,
    officials,
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
      <div id="beranda" className="scroll-mt-20">
        <Hero profile={profile} prayer={prayer} />
      </div>
      <main className="flex flex-1 flex-col">
        {/* Takmir: pengurus masjid dari data admin */}
        <OfficialsSection officials={officials} />
        {/* Keuangan: ringkasan + rincian — sesuai menu Navbar */}
        <div
          id="keuangan"
          className="flex scroll-mt-20 flex-col border-t border-border/60 bg-background"
        >
          <FinancialSummaryCards
            financialSummary={financialSummary}
            latestRecorder={transactions[0]?.recordedBy}
          />
          <TransactionTable transactions={transactions} />
        </div>
        {/* Informasi */}
        <div id="informasi" className="flex scroll-mt-20 flex-col">
          <div className="border-y border-border/60 bg-muted/40">
            <AnnouncementsSection announcements={announcements} />
          </div>
          <ActivitiesSection activities={activities} />
        </div>
      </main>
      <Footer profile={profile} />
    </div>
  );
}
