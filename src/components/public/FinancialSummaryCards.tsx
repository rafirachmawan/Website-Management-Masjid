"use client";

// Data dikirim sebagai prop dari `app/page.tsx` (Server Component) — tidak ada
// fetch di browser. Tetap Client Component karena @phosphor-icons/react memakai
// React Context internal.
import type { FinancialSummary } from "@/types";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Scales,
  ArrowRight,
  Wallet,
  Receipt,
  ChartLineUp,
} from "@phosphor-icons/react";

function TrendPill({
  value,
  label,
  dark = false,
}: {
  value: number;
  label: string;
  dark?: boolean;
}) {
  const positive = value >= 0;
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold tabular-nums ring-1 ring-inset",
          dark
            ? "bg-white/10 text-white ring-white/20"
            : positive
              ? "bg-emerald-500/10 text-emerald-700 ring-emerald-600/20 dark:text-emerald-300 dark:ring-emerald-400/20"
              : "bg-rose-500/10 text-rose-700 ring-rose-600/20 dark:text-rose-300 dark:ring-rose-400/20"
        )}
      >
        {positive ? (
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
        ) : (
          <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
        )}
        {Math.abs(value)}%
      </span>
      <span
        className={cn(
          "hidden whitespace-nowrap sm:inline",
          dark ? "text-white/60" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </span>
  );
}

function FlowRow({
  icon: Icon,
  title,
  desc,
  value,
  prefix,
  trend,
  iconClass,
  valueClass,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  value: number;
  prefix: "+" | "−";
  trend?: { value: number; label: string };
  iconClass: string;
  valueClass?: string;
}) {
  return (
    <div className="group flex items-center gap-3.5 rounded-2xl p-3 transition-all duration-200 hover:bg-muted/70 active:scale-[0.99] sm:gap-4 sm:p-3.5">
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset transition-transform duration-200 group-hover:scale-105",
          iconClass
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{desc}</p>
        <p className={cn("mt-1.5 text-[17px] font-bold tracking-tight tabular-nums", valueClass)}>
          {prefix}
          {formatCurrency(value).replace("Rp", "Rp ")}
        </p>
      </div>
      {trend && <TrendPill value={trend.value} label={trend.label} />}
    </div>
  );
}

export function FinancialSummaryCards({
  financialSummary,
  latestRecorder,
}: {
  financialSummary: FinancialSummary;
  latestRecorder?: string;
}) {
  const { currentBalance, monthlyIncome, monthlyExpense, yearlyIncome, yearlyExpense } =
    financialSummary;
  const surplus = monthlyIncome - monthlyExpense;
  const totalFlow = monthlyIncome + monthlyExpense;
  const incomeShare = totalFlow > 0 ? Math.round((monthlyIncome / totalFlow) * 100) : 0;
  const yearlySurplus = yearlyIncome - yearlyExpense;
  const monthLabel = new Date().toLocaleDateString("id-ID", { month: "long" });

  return (
    <section
      id="ringkasan"
      aria-labelledby="summary-heading"
      className="relative scroll-mt-24 overflow-hidden py-14 md:py-20"
    >
      {/* Ambient background — lembut, tidak seperti tabel */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/60 via-background to-background" />
        <div className="absolute -top-32 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15" />
        <div className="absolute right-[-8rem] bottom-[-6rem] h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 md:px-6 lg:px-8">
        {/* Header: judul + aksi, tidak center semua */}
        <div className="mb-8 flex flex-col gap-5 md:mb-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.06] px-3 py-1 text-xs font-semibold text-primary">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Keuangan transparan • Terverifikasi bendahara
            </p>
            <h2
              id="summary-heading"
              className="font-display text-h2-fluid mt-3 font-semibold text-foreground"
            >
              Ringkasan Keuangan
            </h2>
            <p className="mt-2.5 max-w-[58ch] text-pretty text-sm leading-relaxed text-muted-foreground md:text-[15px]">
              Posisi kas terkini dan arus bulan berjalan. Setiap angka bisa
              ditelusuri sampai ke bukti transaksi.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="#transaksi"
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_10px_24px_-10px_var(--primary)] transition-all duration-200 hover:-translate-y-px hover:brightness-110 active:translate-y-0 active:scale-[0.98]"
            >
              Lihat rincian
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="#grafik"
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground transition-all duration-200 hover:border-primary/40 hover:text-primary active:scale-[0.98]"
            >
              <ChartLineUp className="h-4 w-4" aria-hidden="true" />
              Grafik bulanan
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-12 lg:gap-6">
          {/* Kartu utama — saldo */}
          <div className="relative overflow-hidden rounded-[24px] bg-emerald-950 p-6 text-white shadow-[0_28px_60px_-24px_rgba(4,47,34,0.65)] ring-1 ring-white/10 sm:p-7 md:p-8 lg:col-span-7">
            {/* Lapisan premium: glow + pola islami samar */}
            <div
              className="pointer-events-none absolute inset-0"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-950 to-[#021a12]" />
              <div className="absolute -top-28 -right-20 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
              <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-teal-300/10 blur-3xl" />
              <svg
                className="absolute inset-0 h-full w-full opacity-[0.07]"
                viewBox="0 0 200 200"
                preserveAspectRatio="xMidYMid slice"
              >
                <defs>
                  <pattern
                    id="islamic-grid"
                    width="28"
                    height="28"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M14 0 L28 14 L14 28 L0 14 Z"
                      fill="none"
                      stroke="white"
                      strokeWidth="0.7"
                    />
                    <circle cx="14" cy="14" r="1.4" fill="white" />
                  </pattern>
                </defs>
                <rect width="200" height="200" fill="url(#islamic-grid)" />
              </svg>
              <div className="absolute inset-0 rounded-[24px] ring-1 ring-white/10 ring-inset" />
            </div>

            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-medium text-white/90 ring-1 ring-white/15 ring-inset">
                  <Wallet className="h-4 w-4" aria-hidden="true" />
                  Saldo kas saat ini
                </p>
                <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-200/90">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                  </span>
                  Diperbarui {formatDate(financialSummary.lastUpdated, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              <p className="mt-5 text-balance text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl md:text-[3.4rem] md:leading-[1.05]">
                {formatCurrency(currentBalance)}
              </p>
              <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-relaxed text-white/75">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                  {latestRecorder
                    ? `Dicatat ${latestRecorder}`
                    : "Belum ada transaksi tercatat"}
                </span>
                <span aria-hidden="true" className="text-white/30">•</span>
                <span>Dapat ditelusuri ke bukti</span>
              </p>

              {/* Komposisi arus — visual user-friendly */}
              <div className="mt-6 rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10 ring-inset backdrop-blur-sm sm:p-5">
                <div className="flex items-center justify-between gap-3 text-xs font-medium text-white/70">
                  <span>Komposisi {monthLabel}</span>
                </div>
                <div
                  className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-white/15"
                  role="img"
                  aria-label={`Pemasukan ${incomeShare} persen, pengeluaran ${100 - incomeShare} persen`}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-teal-200"
                    style={{ width: `${incomeShare}%` }}
                  />
                  <div
                    className="h-full rounded-full bg-white/35"
                    style={{ width: `${100 - incomeShare}%` }}
                  />
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-3">
                  <div>
                    <p className="text-xs text-white/60">Pemasukan</p>
                    <p className="mt-1 text-[15px] font-bold tabular-nums text-emerald-200">
                      +{formatCurrency(monthlyIncome)}
                    </p>
                  </div>
                  <div className="border-t border-white/10 pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
                    <p className="text-xs text-white/60">Pengeluaran</p>
                    <p className="mt-1 text-[15px] font-bold tabular-nums text-white/90">
                      −{formatCurrency(monthlyExpense)}
                    </p>
                  </div>
                  <div className="border-t border-white/10 pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4">
                    <p className="text-xs text-white/60">Surplus</p>
                    <p className="mt-1 text-[15px] font-bold tabular-nums text-white">
                      {formatCurrency(surplus)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom kanan — satu kartu utuh, bukan 3 kartu generik */}
          <div className="flex flex-col overflow-hidden rounded-[24px] border border-border bg-card shadow-[0_18px_40px_-24px_rgba(4,47,34,0.35)] lg:col-span-5">
            <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 pt-5 pb-4 sm:px-6">
              <div>
                <h3 className="text-[15px] font-bold tracking-tight text-foreground">
                  Arus {monthLabel} {new Date().getFullYear()}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Infak, zakat, wakaf, operasional
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/[0.08] px-2.5 py-1 text-xs font-semibold text-primary ring-1 ring-primary/20 ring-inset">
                <Receipt className="h-3.5 w-3.5" aria-hidden="true" />
                Bulan berjalan
              </span>
            </div>

            <div className="flex flex-1 flex-col divide-y divide-border/60 px-2 py-2 sm:px-3">
              <FlowRow
                icon={ArrowUpRight}
                title="Pemasukan"
                desc="Infak • zakat • wakaf • sewa"
                value={monthlyIncome}
                prefix="+"
                iconClass="bg-emerald-500/10 text-emerald-700 ring-emerald-600/20 dark:text-emerald-300"
                valueClass="text-foreground"
              />
              <FlowRow
                icon={ArrowDownRight}
                title="Pengeluaran"
                desc="Operasional • honor • rawat"
                value={monthlyExpense}
                prefix="−"
                iconClass="bg-rose-500/10 text-rose-700 ring-rose-600/20 dark:text-rose-300"
                valueClass="text-foreground"
              />
              <div className="flex items-center gap-3.5 rounded-2xl bg-primary/[0.06] p-3 ring-1 ring-primary/15 ring-inset sm:gap-4 sm:p-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <Scales className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-foreground">
                    Selisih bulanan
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                      Surplus
                    </span>
                  </p>
                  <p className="mt-1 text-[17px] font-bold tracking-tight tabular-nums text-foreground">
                    {formatCurrency(surplus)}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    Siap disalurkan untuk kemaslahatan
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border/70 bg-muted/50 px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-3 text-[13px]">
                <span className="text-muted-foreground">Tahun berjalan</span>
                <span className="font-bold tabular-nums text-foreground">
                  {formatCurrency(yearlySurplus)}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground tabular-nums">
                Masuk {formatCurrency(yearlyIncome)} • Keluar {formatCurrency(yearlyExpense)}
              </p>
              <a
                href="#transaksi"
                className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-border bg-background px-4 text-[13px] font-semibold text-foreground transition-all duration-200 hover:border-primary/40 hover:text-primary active:scale-[0.99]"
              >
                Telusuri semua transaksi
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        {/* Trust strip — sejajar, bukan paragraf polos */}
        <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3 md:mt-6">
          {[
            { icon: Receipt, text: "Setiap rupiah tercatat rapi" },
            { icon: ShieldCheck, text: "Diverifikasi bendahara" },
            { icon: Scales, text: "Surplus disalurkan transparan" },
          ].map((item) => (
            <p
              key={item.text}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2.5 text-[13px] font-medium text-muted-foreground"
            >
              <item.icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              {item.text}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
