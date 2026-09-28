"use client";

import { Navbar } from "@/components/public/Navbar";
import { Hero } from "@/components/public/Hero";
import { FinancialSummaryCards } from "@/components/public/FinancialSummaryCards";
import { AnnouncementsSection } from "@/components/public/AnnouncementsSection";
import { ActivitiesSection } from "@/components/public/ActivitiesSection";
import { Footer } from "@/components/public/Footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <Hero />
      <main className="flex flex-1 flex-col">
        {/* Alur keuangan: sorotan ringkas saja */}
        <div id="keuangan" className="flex scroll-mt-20 flex-col bg-background">
          <FinancialSummaryCards />
        </div>
        {/* Kabar dan ibadah dipisah ke permukaan berbeda */}
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