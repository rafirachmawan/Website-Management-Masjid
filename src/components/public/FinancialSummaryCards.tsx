import { financialSummary } from "@/lib/mock-data";
import { formatCurrency, cn } from "@/lib/utils";
import { TrendUp, TrendDown, ShieldCheck, ArrowUpRight, ArrowDownRight, Scales } from "@phosphor-icons/react";

function TrendPill({ value, label, tone }: { value: number; label: string; tone: "light" | "dark" }) {
  const Icon = value >= 0 ? TrendUp : TrendDown;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold tabular-nums",
          tone === "light"
            ? value >= 0
              ? "bg-white/15 text-white"
              : "bg-white/15 text-white"
            : value >= 0
              ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
        )}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {Math.abs(value)}%
      </span>
      <span className={tone === "light" ? "text-white/70" : "text-muted-foreground"}>{label}</span>
    </span>
  );
}

function LedgerRow({
  icon: Icon,
  title,
  value,
  description,
  trend,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: number;
  description: string;
  trend?: { value: number; label: string };
  accent: string;
}) {
  return (
    <div className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/40">
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", accent)}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
        <p className="mt-0.5 truncate text-xl font-bold tracking-tight text-foreground tabular-nums">
          {formatCurrency(value)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      {trend && (
        <div className="hidden shrink-0 sm:block">
          <TrendPill value={trend.value} label={trend.label} tone="dark" />
        </div>
      )}
    </div>
  );
}

export function FinancialSummaryCards() {
  const { currentBalance, monthlyIncome, monthlyExpense, yearlyIncome, yearlyExpense } =
    financialSummary;
  const surplus = monthlyIncome - monthlyExpense;

  return (
    <section
      id="ringkasan"
      aria-labelledby="summary-heading"
      className="relative scroll-mt-24 overflow-hidden pt-16 pb-8 md:pt-20 md:pb-10"
    >
      {/* Gema grid hero — sangat tipis */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]" aria-hidden="true">
        <svg className="h-full w-full text-primary" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="ringkasan-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#ringkasan-grid)" />
        </svg>
      </div>

      <div className="container relative mx-auto px-4 md:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl md:mb-10">
          <h2
            id="summary-heading"
            className="text-2xl font-bold tracking-tight text-balance text-foreground md:text-3xl"
          >
            Ringkasan Keuangan
          </h2>
          <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-muted-foreground md:text-base">
            Posisi kas terkini dan arus bulan berjalan, terverifikasi bendahara dan bisa
            ditelusuri sampai ke bukti transaksi.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-12 lg:gap-6">
          {/* Panel utama — saldo, bahasa emerald solid seperti penekanan hero */}
          <div className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-lg shadow-primary/20 md:p-7 lg:col-span-7">
            <div
              className="pointer-events-none absolute inset-0 opacity-10"
              aria-hidden="true"
              style={{
                backgroundImage:
                  "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                backgroundSize: "44px 44px",
                maskImage: "radial-gradient(ellipse 90% 90% at 20% 10%, black 40%, transparent 100%)",
              }}
            />
            <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
            <div className="relative">
              <div className="flex items-center gap-2 text-[13px] font-medium text-white/75">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Saldo Kas Saat Ini
              </div>
              <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums md:text-4xl">
                {formatCurrency(currentBalance)}
              </p>
              <p className="mt-2 max-w-[48ch] text-sm leading-relaxed text-white/85">
                Terakhir diperbarui 27 Sep 2026, dicatat Ust. Ahmad (Bendahara).
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/15 pt-5">
                <div>
                  <p className="text-xs text-white/75">Pemasukan September</p>
                  <p className="mt-1 font-bold tabular-nums">+{formatCurrency(monthlyIncome)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/75">Pengeluaran September</p>
                  <p className="mt-1 font-bold tabular-nums">−{formatCurrency(monthlyExpense)}</p>
                </div>
                <div className="sm:ml-auto">
                  <TrendPill value={18} label="vs bln lalu" tone="light" />
                </div>
              </div>
            </div>
          </div>

          {/* Kolom pendukung — baris ledger, bukan kartu kembar */}
          <div className="flex flex-col gap-3 md:gap-4 lg:col-span-5">
            <LedgerRow
              icon={ArrowUpRight}
              title="Pemasukan Bulan Ini"
              value={monthlyIncome}
              description="September 2026, infak, zakat, wakaf, sewa"
              trend={{ value: 12, label: "vs bln lalu" }}
              accent="bg-green-500/10 text-green-700 dark:text-green-300"
            />
            <LedgerRow
              icon={ArrowDownRight}
              title="Pengeluaran Bulan Ini"
              value={monthlyExpense}
              description="September 2026, operasional, honor, rawat"
              trend={{ value: -5, label: "vs bln lalu" }}
              accent="bg-red-500/10 text-red-700 dark:text-red-300"
            />
            <div className="flex items-center gap-4 rounded-2xl border border-primary/25 bg-primary/[0.04] p-4 shadow-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Scales className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-muted-foreground">Selisih Bulanan</p>
                <p className="mt-0.5 text-xl font-bold tracking-tight text-foreground tabular-nums">
                  {formatCurrency(surplus)}{" "}
                  <span className="ml-1 align-middle text-xs font-semibold text-primary">Surplus</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">September 2026, siap disalurkan</p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 border-t border-border/60 pt-4 text-[13px] leading-relaxed text-muted-foreground">
          Arus tahun berjalan: pemasukan {formatCurrency(yearlyIncome)}, pengeluaran{" "}
          {formatCurrency(yearlyExpense)}, selisih {formatCurrency(yearlyIncome - yearlyExpense)}.
        </p>
      </div>
    </section>
  );
}