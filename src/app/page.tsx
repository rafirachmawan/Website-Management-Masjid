"use client";

import { Navbar } from "@/components/public/Navbar";
import { Hero } from "@/components/public/Hero";
import { FinancialSummaryCards } from "@/components/public/FinancialSummaryCards";
import { FinancialChart } from "@/components/public/FinancialChart";
import { TransactionTable } from "@/components/public/TransactionTable";
import { AnnouncementsSection } from "@/components/public/AnnouncementsSection";
import { ActivitiesSection } from "@/components/public/ActivitiesSection";
import { PrayerScheduleSection } from "@/components/public/PrayerScheduleSection";
import { Footer } from "@/components/public/Footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div id="beranda" className="scroll-mt-20">
        <Hero />
      </div>
      <main className="flex flex-1 flex-col">
        {/* Ibadah dulu: jadwal sholat langsung setelah hero */}
        <PrayerScheduleSection />
        {/* Keuangan: ringkasan + grafik + rincian — sesuai menu Navbar */}
        <div id="keuangan" className="flex scroll-mt-20 flex-col border-t border-border/60 bg-background">
          <FinancialSummaryCards />
          <FinancialChart />
          <TransactionTable />
        </div>
        {/* Informasi */}
        <div id="informasi" className="flex scroll-mt-20 flex-col">
          <div className="border-y border-border/60 bg-muted/40">
            <AnnouncementsSection />
          </div>
          <ActivitiesSection />
        </div>
      </main>
      <Footer />
    </div>
  );
}