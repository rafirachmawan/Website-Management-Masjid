"use client";

import { Hero } from "@/components/public/Hero";
import { FinancialSummaryCards } from "@/components/public/FinancialSummaryCards";
import { FinancialChart } from "@/components/public/FinancialChart";
import { TransactionTable } from "@/components/public/TransactionTable";
import { AnnouncementsSection } from "@/components/public/AnnouncementsSection";
import { PrayerScheduleSection } from "@/components/public/PrayerScheduleSection";
import { Footer } from "@/components/public/Footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Hero />
      <main className="flex flex-1 flex-col">
        {/* Alur keuangan: sorotan → tren → bukti dalam satu permukaan */}
        <div id="keuangan" className="flex scroll-mt-20 flex-col bg-background">
          <FinancialSummaryCards />
          <FinancialChart />
          <TransactionTable />
        </div>
        {/* Kabar dan ibadah dipisah ke permukaan berbeda */}
        <div id="informasi" className="flex scroll-mt-20 flex-col">
          <div className="border-y border-border/60 bg-muted/40">
            <AnnouncementsSection />
          </div>
          <PrayerScheduleSection />
        </div>
      </main>
      <Footer />
    </div>
  );
}