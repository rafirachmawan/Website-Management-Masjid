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
    <div className="flex flex-col min-h-screen bg-background">
      <Hero />
      <main className="flex-1">
        <FinancialSummaryCards />
        <FinancialChart />
        <TransactionTable />
        <AnnouncementsSection />
        <PrayerScheduleSection />
      </main>
      <Footer />
    </div>
  );
}