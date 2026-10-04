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
} from "@phosphor-icons/react";

/** Satu bahasa warna untuk semua ikon: hijau = pemasukan, merah = pengeluaran,
    netral = sisanya. Semua lewat token, bukan emerald-700/rose-700 hardcode. */
const FLOW_TONE = {
  in: "bg-primary/10 text-primary ring-primary/20",
  out: "bg-destructive/10 text-destructive ring-destructive/20",
  flat: "bg-muted text-muted-foreground ring-border",
} as const;

function TrendPill({ value, label }: { value: number; label: string }) {
  const positive = value >= 0;
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-xs">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold tabular-nums ring-1 ring-inset",
          positive
            ? "bg-primary/10 text-primary ring-primary/20"
            : "bg-destructive/10 text-destructive ring-destructive/20",
        )}
      >
        {positive ? (
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
        ) : (
          <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
        )}
        {Math.abs(value)}%
      </span>
      <span className="hidden whitespace-nowrap text-muted-foreground sm:inline">{label}</span>
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
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  value: number;
  prefix: "+" | "−";
  trend?: { value: number; label: string };
  tone: keyof typeof FLOW_TONE;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-xl p-3 transition-colors hover:bg-muted/60 sm:gap-4 sm:p-3.5">
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
          FLOW_TONE[tone],
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{desc}</p>
        <p className="mt-1.5 text-[17px] font-bold tabular-nums text-foreground">
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
  const hasFlow = totalFlow > 0;
  const incomeShare = hasFlow ? Math.round((monthlyIncome / totalFlow) * 100) : 0;
  const yearlySurplus = yearlyIncome - yearlyExpense;
  const monthLabel = new Date().toLocaleDateString("id-ID", { month: "long" });
  const isSurplus = surplus >= 0;

  return (
    <section
      id="ringkasan"
      aria-labelledby="summary-heading"
      className="scroll-mt-24 bg-background py-14 md:py-20"
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
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
              href="/keuangan#transaksi"
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:brightness-110 active:scale-[0.98]"
            >
              Lihat rincian
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-12 lg:gap-6">
          {/* Kartu saldo — permukaan polos, angka jadi TRAININGUTAMA */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 md:p-8 lg:col-span-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
                <Wallet className="h-4 w-4 text-primary" aria-hidden="true" />
                Saldo kas saat ini
              </p>
              <p className="text-xs text-muted-foreground">
                Diperbarui{" "}
                {formatDate(financialSummary.lastUpdated, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>

            <p className="mt-4 text-balance text-4xl font-extrabold tracking-tight tabular-nums text-foreground sm:text-5xl md:text-[3.4rem] md:leading-[1.05]">
              {formatCurrency(currentBalance)}
            </p>

            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border pb-5 text-sm leading-relaxed text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              {latestRecorder ? `Dicatat ${latestRecorder}` : "Belum ada transaksi tercatat"}
              <span aria-hidden="true">•</span>
              <span>Dapat ditelusuri ke bukti</span>
            </p>

            {/* Komposisi arus — satu bar, hijau = pemasukan, merah = pengeluaran */}
            <div className="mt-5">
              <div className="flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
                <span>Komposisi {monthLabel}</span>
                <span className="tabular-nums">
                  {hasFlow ? `${incomeShare}% pemasukan` : "Belum ada arus bulan ini"}
                </span>
              </div>
              {hasFlow ? (
                <div
                  className="mt-2.5 flex h-2 w-full overflow-hidden rounded-full bg-muted"
                  role="img"
                  aria-label={`Pemasukan ${incomeShare} persen, pengeluaran ${100 - incomeShare} persen`}
                >
                  <div className="h-full bg-primary" style={{ width: `${incomeShare}%` }} />
                  <div className="h-full bg-destructive" style={{ width: `${100 - incomeShare}%` }} />
                </div>
              ) : (
                <div
                  className="mt-2.5 flex h-2 w-full items-center justify-center overflow-hidden rounded-full bg-muted"
                  role="img"
                  aria-label="Belum ada pemasukan maupun pengeluaran bulan ini"
                >
                  <span className="text-[10px] font-medium text-muted-foreground">—</span>
                </div>
              )}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Pemasukan</p>
                  <p className="mt-1 text-[15px] font-bold tabular-nums text-primary">
                    +{formatCurrency(monthlyIncome)}
                  </p>
                </div>
                <div className="border-l border-border pl-3">
                  <p className="text-xs text-muted-foreground">Pengeluaran</p>
                  <p className="mt-1 text-[15px] font-bold tabular-nums text-destructive">
                    −{formatCurrency(monthlyExpense)}
                  </p>
                </div>
                <div className="border-l border-border pl-3">
                  <p className="text-xs text-muted-foreground">
                    {isSurplus ? "Surplus" : "Defisit"}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-[15px] font-bold tabular-nums",
                      isSurplus ? "text-foreground" : "text-destructive",
                    )}
                  >
                    {isSurplus ? "" : "−"}
                    {formatCurrency(Math.abs(surplus))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom kanan — arus bulan berjalan, permukaan sama dengan kartu saldo */}
          <div className="flex flex-col rounded-2xl border border-border bg-card lg:col-span-5">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
              <div>
                <h3 className="text-[15px] font-bold text-foreground">
                  Arus {monthLabel} {new Date().getFullYear()}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Infak, zakat, wakaf, operasional
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground ring-1 ring-border ring-inset">
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
                tone="in"
              />
              <FlowRow
                icon={ArrowDownRight}
                title="Pengeluaran"
                desc="Operasional • honor • rawat"
                value={monthlyExpense}
                prefix="−"
                tone="out"
              />
              <div className="flex items-center gap-3.5 rounded-xl bg-muted/60 p-3 sm:gap-4 sm:p-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 ring-inset">
                  <Scales className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-[13px] font-semibold text-foreground">
                    Selisih bulanan
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        isSurplus
                          ? "bg-primary/10 text-primary"
                          : "bg-destructive/10 text-destructive",
                      )}
                    >
                      {isSurplus ? "Surplus" : "Defisit"}
                    </span>
                  </p>
                  <p className="mt-1 text-[17px] font-bold tabular-nums text-foreground">
                    {formatCurrency(surplus)}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {isSurplus
                      ? "Siap disalurkan untuk kemaslahatan"
                      : "Perlu ditinjau pengurus"}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-border bg-muted/40 px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-3 text-[13px]">
                <span className="text-muted-foreground">Tahun berjalan</span>
                <span className="font-bold tabular-nums text-foreground">
                  {formatCurrency(yearlySurplus)}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed tabular-nums text-muted-foreground">
                Masuk {formatCurrency(yearlyIncome)} • Keluar {formatCurrency(yearlyExpense)}
              </p>
              <a
                href="/keuangan#transaksi"
                className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-border bg-background px-4 text-[13px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                Telusuri semua transaksi
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        {/* Trust strip — sejajar, ikon satu warna */}
        <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-3 md:mt-6">
          {[
            { icon: Receipt, text: "Setiap rupiah tercatat rapi" },
            { icon: ShieldCheck, text: "Diverifikasi bendahara" },
            { icon: Scales, text: "Surplus disalurkan transparan" },
          ].map((item) => (
            <p
              key={item.text}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-[13px] font-medium text-muted-foreground"
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
