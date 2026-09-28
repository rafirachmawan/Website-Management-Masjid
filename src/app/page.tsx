import { Navbar } from "@/components/public/Navbar";
import { Hero } from "@/components/public/Hero";
import { PrayerScheduleSection } from "@/components/public/PrayerScheduleSection";
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
  } = await getPublicHomeData();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div id="beranda" className="scroll-mt-20">
        <Hero profile={profile} prayer={prayer} />
      </div>
      <main className="flex flex-1 flex-col">
        {/* Ibadah dulu: jadwal sholat langsung setelah hero */}
        <PrayerScheduleSection profile={profile} prayer={prayer} />
        {/* Keuangan: ringkasan + grafik + rincian — sesuai menu Navbar */}
        <div
          id="keuangan"
          className="flex scroll-mt-20 flex-col border-t border-border/60 bg-background"
        >
          <FinancialSummaryCards
            financialSummary={financialSummary}
            latestRecorder={transactions[0]?.recordedBy}
          />
          <FinancialChart chartData={chartData} />
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
