import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import { FinancialSummaryCards } from "@/components/public/FinancialSummaryCards";
import { DonationTransfer } from "@/components/public/DonationTransfer";
import { TransactionTable } from "@/components/public/TransactionTable";
import { getFinancialSummary, getTransactions, getLatestRecorder } from "@/server/services/finance";
import { getAppConfig } from "@/server/services/config";
import { getMosqueProfile } from "@/server/services/mosque";
import type { Transaction } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Keuangan Masjid",
  description: "Ringkasan kas dan rincian transaksi keuangan masjid yang transparan untuk jamaah.",
};

export default async function KeuanganPage() {
  // Konfigurasi & profil dibutuhkan lebih dulu: keputusan "muat seluruh
  // transaksi atau tidak" bergantung pada `publicTransparency`.
  const [config, profile] = await Promise.all([getAppConfig(), getMosqueProfile()]);

  const [financialSummary, transactions, latestRecorder] = await Promise.all([
    getFinancialSummary(),
    // Transparansi publik mati → tabel tidak ditampilkan, jadi jangan buang
    // waktu memuat seluruh transaksi (P3.10).
    config.publicTransparency ? getTransactions() : Promise.resolve<Transaction[]>([]),
    // Kartu ringkasan tetap menampilkan nama pencatat terakhir walau tabel
    // disembunyikan — cukup satu kolom, bukan seluruh tabel.
    getLatestRecorder(),
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
            latestRecorder={transactions[0]?.recordedBy ?? latestRecorder}
            timeZone={profile?.timezone}
          />
          {/* Rekening admin (/admin → Pengaturan → Rekening & Kas).
              Anchor `#donasi` SELALU ada di sini — CTA "Salurkan Infaq"
              (Navbar & Hero) menuju `/keuangan#donasi`, dan DonationTransfer
              mengembalikan `null` bila admin mematikan/mengosongkan rekening. */}
          <div id="donasi" className="scroll-mt-24">
            <DonationTransfer config={config} />
          </div>
          {config.publicTransparency ? (
            <TransactionTable transactions={transactions} timeZone={profile?.timezone} />
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
