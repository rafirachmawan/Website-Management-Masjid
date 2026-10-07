import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { FinancialSummaryCards } from "@/components/public/FinancialSummaryCards";
import { DonationTransfer } from "@/components/public/DonationTransfer";
import { TransactionTable } from "@/components/public/TransactionTable";
import { getFinancialSummary, getTransactions } from "@/server/services/finance";
import { getAppConfig } from "@/server/services/config";
import { getMosqueProfile } from "@/server/services/mosque";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Keuangan Masjid",
  description: "Ringkasan kas dan rincian transaksi keuangan masjid yang transparan untuk jamaah.",
};

export default async function KeuanganPage() {
  const [financialSummary, transactions, config, profile] = await Promise.all([
    getFinancialSummary(),
    getTransactions(),
    getAppConfig(),
    getMosqueProfile(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
        <Navbar profile={profile} />
      </header>

      <main className="flex flex-1 flex-col">
        <div className="container mx-auto w-full px-4 pt-8 md:px-6 md:pt-12 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-primary">
              Beranda
            </Link>
            <span aria-hidden="true">/</span>
            <span className="font-medium text-foreground">Keuangan</span>
          </nav>
        </div>
        <div className="flex flex-col border-t border-border/60 bg-background">
          <FinancialSummaryCards
            financialSummary={financialSummary}
            latestRecorder={transactions[0]?.recordedBy}
          />
          {/* Rekening admin (/admin → Pengaturan → Rekening & Kas). */}
          <div className="-mt-6 pb-2 md:-mt-8">
            <DonationTransfer config={config} />
          </div>
          {config.publicTransparency ? (
            <TransactionTable transactions={transactions} />
          ) : (
            <div className="container mx-auto px-4 pb-16 md:px-6 lg:px-8">
              <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
                <p className="font-semibold text-foreground">Rincian transaksi disembunyikan pengurus</p>
                <p className="mx-auto mt-1 max-w-[60ch] text-sm text-muted-foreground">
                  Pengurus menonaktifkan transparansi publik untuk sementara. Ringkasan di atas
                  tetap tampil; rincian per transaksi hanya tersedia internal.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer profile={profile} />
    </div>
  );
}
