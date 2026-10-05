"use client";

import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { DataSkeleton } from "@/components/DataSkeleton";
import type {
  MosqueProfile,
  FinancialSummary,
  Transaction,
  ChartDataPoint,
  Announcement,
  Activity,
  AppConfig,
} from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/PageHeader";
import {
  Coins,
  TrendUp,
  TrendDown,
  Plus,
  Eye,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from "@phosphor-icons/react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const COLORS = {
  income: "oklch(0.42 0.12 162)",
  expense: "oklch(0.58 0.2 25)",
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-3 min-w-45">
      <p className="text-xs font-semibold text-muted-foreground mb-2">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="flex items-center justify-between gap-3 text-xs py-0.5" style={{ color: entry.color }}>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}:
          </span>
          <span className="font-bold tabular-nums">{formatCurrency(entry.value)}</span>
        </p>
      ))}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
  trendLabel?: string;
  iconBgClass?: string;
  valueColorClass?: string;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendLabel,
  iconBgClass = "bg-primary/10 text-primary",
  valueColorClass = "text-foreground",
}: StatCardProps) {
  return (
    <Card className="hover:border-primary/30 hover:shadow-xs transition-all duration-200">
      <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
        {/* Top: Title & Icon */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-muted-foreground truncate">{title}</span>
          <div className={cn("p-2.5 rounded-xl shrink-0 transition-transform duration-200 hover:scale-105", iconBgClass)}>
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>

        {/* Middle: Big Stat Value */}
        <div className="py-0.5">
          <div
            className={cn("text-2xl xl:text-[27px] font-bold tracking-tight tabular-nums truncate leading-none", valueColorClass)}
            title={String(value)}
          >
            {value}
          </div>
        </div>

        {/* Bottom: Trend and Context */}
        <div className="flex items-center justify-between gap-1 pt-2 border-t border-border/40 text-xs">
          {trend !== undefined && (
            <div
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-xs shrink-0",
                trend >= 0
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40"
              )}
            >
              {trend >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 shrink-0" /> : <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />}
              <span>{Math.abs(trend)}%</span>
              {trendLabel && <span className="font-normal opacity-80 ml-0.5">{trendLabel}</span>}
            </div>
          )}
          {description && (
            <span className="text-muted-foreground text-[11px] truncate text-right">
              {description}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MiniChart({ data }: { data: ChartDataPoint[] }) {
  const hasData = data.some((d) => d.income > 0 || d.expense > 0);
  if (!hasData) {
    return (
      <div className="flex h-57.5 flex-col items-center justify-center gap-1 text-center">
        <p className="text-sm font-semibold text-foreground">Belum ada arus kas 6 bulan terakhir</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Catat transaksi pertama lewat tombol Transaksi Baru agar tren tampil di sini.
        </p>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={230}>
      <AreaChart data={data.slice(-6)} margin={{ top: 12, right: 24, left: -5, bottom: 4 }}>
        <defs>
          <linearGradient id="colorIncomeMini" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.income} stopOpacity={0.25} />
            <stop offset="95%" stopColor={COLORS.income} stopOpacity={0.0} />
          </linearGradient>
          <linearGradient id="colorExpenseMini" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.expense} stopOpacity={0.25} />
            <stop offset="95%" stopColor={COLORS.expense} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
        <XAxis
          dataKey="period"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
          interval={0}
          padding={{ left: 10, right: 10 }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => {
            if (value === 0) return "0";
            if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString("id-ID")} jt`;
            if (value >= 1_000) return `${(value / 1_000).toLocaleString("id-ID")} rb`;
            return String(value);
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="income"
          stroke={COLORS.income}
          strokeWidth={2.5}
          fillOpacity={1}
          fill="url(#colorIncomeMini)"
          name="Pemasukan"
        />
        <Area
          type="monotone"
          dataKey="expense"
          stroke={COLORS.expense}
          strokeWidth={2.5}
          fillOpacity={1}
          fill="url(#colorExpenseMini)"
          name="Pengeluaran"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function RecentTransactions({ items }: { items: Transaction[] }) {
  const recentTxns = items.slice(0, 5);

  return (
    <Card className="hover:border-primary/20 transition-all">
      <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base sm:text-lg font-semibold text-foreground">Transaksi Terbaru</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">5 catatan transaksi kas masjid terkini</p>
        </div>
        <Link href="/admin/transactions" className="text-xs font-medium text-primary hover:underline flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" />
          Lihat Semua
        </Link>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        {recentTxns.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-10 text-center">
            <p className="text-sm font-semibold text-foreground">Belum ada transaksi</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Mulai dengan Catat Kas Masuk / Kas Keluar — tabel ini akan terisi otomatis.
            </p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableCaption className="sr-only">5 transaksi terakhir</TableCaption>
            <TableHeader>
              <TableRow className="bg-muted border-b-2 border-border hover:bg-muted">
                <TableHead className="w-24 py-2.5 text-left text-xs font-bold text-foreground uppercase tracking-wider">Tanggal</TableHead>
                <TableHead className="py-2.5 text-left text-xs font-bold text-foreground uppercase tracking-wider">Kategori</TableHead>
                <TableHead className="py-2.5 text-left text-xs font-bold text-foreground uppercase tracking-wider">Keterangan</TableHead>
                <TableHead className="w-32 py-2.5 text-right text-xs font-bold text-foreground uppercase tracking-wider">Jumlah</TableHead>
                <TableHead className="w-24 py-2.5 text-center text-xs font-bold text-foreground uppercase tracking-wider">Tipe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTxns.map((txn) => (
                <TableRow key={txn.id} className="hover:bg-muted/40 border-b border-border/50 last:border-0 transition-colors">
                  <TableCell className="py-3 text-xs font-medium text-muted-foreground">{formatDate(txn.date, { day: "2-digit", month: "short" })}</TableCell>
                  <TableCell className="py-3 text-xs font-semibold text-foreground">{txn.category}</TableCell>
                  <TableCell className="py-3 text-xs text-muted-foreground max-w-xs truncate">{txn.description}</TableCell>
                  <TableCell className="py-3 text-xs text-right tabular-nums font-bold">
                    {txn.type === "income" ? (
                      <span className="text-emerald-600 dark:text-emerald-400">+{formatCurrency(txn.amount)}</span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400">-{formatCurrency(txn.amount)}</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 text-center">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[11px] font-semibold px-2 py-0.5 border",
                        txn.type === "income"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60"
                          : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/60"
                      )}
                    >
                      {txn.type === "income" ? "Masuk" : "Keluar"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  const actions = [
    {
      label: "Catat Kas Masuk",
      href: "/admin/transactions?type=income",
      icon: Coins,
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white",
      desc: "Infak, sedekah, zakat, waqaf, & sewa",
    },
    {
      label: "Catat Kas Keluar",
      href: "/admin/transactions?type=expense",
      icon: TrendDown,
      iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white",
      desc: "Operasional, honor, belanja, & utilitas",
    },
    {
      label: "Lihat Laporan Keuangan",
      href: "/admin/reports",
      icon: Download,
      iconBg: "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
      desc: "Bulanan, tahunan, cetak, & ekspor CSV",
    },
    {
      label: "Tambah Berita",
      href: "/admin/announcements",
      icon: Plus,
      iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:bg-sky-600 group-hover:text-white",
      desc: "Info jamaah, jadwal kajian, & agenda",
    },
  ];

  return (
    <Card className="hover:border-primary/20 transition-all">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">Aksi Cepat</CardTitle>
          <span className="text-xs text-muted-foreground font-normal">Pintasan menu</span>
        </div>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-2.5">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group flex items-center gap-3.5 p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/40 hover:border-primary/40 hover:shadow-xs transition-all duration-200"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 shadow-xs", action.iconBg)}>
              <action.icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {action.label}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {action.desc}
              </p>
            </div>
            <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground/60 group-hover:bg-primary/10 group-hover:text-primary transition-all shrink-0">
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

function UpcomingAnnouncements({ items }: { items: Announcement[] }) {
  return (
    <Card className="hover:border-primary/20 transition-all">
      <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base font-semibold text-foreground">Berita Terbaru</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Informasi aktif untuk jamaah</p>
        </div>
        <Link href="/admin/announcements" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
          <Eye className="w-3.5 h-3.5" />
          Lihat Semua
        </Link>
      </CardHeader>
      <CardContent className="p-5 pt-0 space-y-2.5">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-8 text-center">
            <p className="text-sm font-semibold text-foreground">Belum ada berita</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Tambah pengumuman pertama agar jamaah melihat info terkini di beranda.
            </p>
          </div>
        ) : (
        items.slice(0, 3).map((ann) => (
          <div
            key={ann.id}
            className="flex items-start gap-3 p-3 rounded-xl border border-border/70 hover:bg-muted/40 transition-colors"
          >
            <div
              className={cn(
                "w-2.5 h-2.5 rounded-full mt-1.5 shrink-0",
                ann.priority === "important" && "bg-amber-500 ring-4 ring-amber-500/20",
                ann.priority === "normal" && "bg-emerald-500 ring-4 ring-emerald-500/20"
              )}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-sm text-foreground truncate">{ann.title}</h4>
                <span className="text-[11px] text-muted-foreground shrink-0">{formatDate(ann.publishedAt, { day: "2-digit", month: "short" })}</span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{ann.content}</p>
            </div>
          </div>
        ))
        )}
      </CardContent>
    </Card>
  );
}

function pctChange(current: number, prev: number): number | undefined {
  if (prev <= 0) return current > 0 ? 100 : undefined;
  return Math.round(((current - prev) / prev) * 100);
}

export function DashboardOverview() {
  const { data: mosqueProfile } = useApi<MosqueProfile>("/api/mosque-profile");
  const { data: financialSummary } = useApi<FinancialSummary>("/api/financial-summary");
  const { data: fetchedTransactions } = useApi<Transaction[]>("/api/transactions");
  const { data: chartData } = useApi<ChartDataPoint[]>("/api/chart");
  const { data: announcements } = useApi<Announcement[]>("/api/announcements");
  const { data: activities } = useApi<Activity[]>("/api/activities");
  const { data: appConfig } = useApi<AppConfig>("/api/config");

  // Header butuh profil; sisanya progresif agar satu API lambat tidak blokir semua.
  if (!mosqueProfile) {
    return (
      <div className="space-y-6" aria-label="Memuat dashboard">
        <DataSkeleton lines={2} className="max-w-md" />
        <DataSkeleton lines={5} />
      </div>
    );
  }

  const transactions = fetchedTransactions ?? [];
  const txnsLoading = !fetchedTransactions;
  const { currentBalance, monthlyIncome, monthlyExpense } = financialSummary ?? {
    currentBalance: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    yearlyIncome: 0,
    yearlyExpense: 0,
    lastUpdated: new Date().toISOString(),
  };

  // Tren MoM dari prefix yyyy-MM zona Jakarta (tanpa new Date agar imun TZ).
  const jakartaMonth = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
  const [cy, cm] = jakartaMonth.split("-").map(Number);
  const prevM = cm === 1 ? 12 : cm - 1;
  const prevY = cm === 1 ? cy - 1 : cy;
  const prevPrefix = `${prevY}-${String(prevM).padStart(2, "0")}`;
  const prevIncome = transactions
    .filter((t) => t.date.startsWith(prevPrefix) && t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const prevExpense = transactions
    .filter((t) => t.date.startsWith(prevPrefix) && t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const incomeTrend = financialSummary ? pctChange(monthlyIncome, prevIncome) : undefined;
  const expenseTrend = financialSummary ? pctChange(monthlyExpense, prevExpense) : undefined;

  const minAlert = appConfig?.minBalanceAlert ?? 0;
  const lowBalance = financialSummary != null && minAlert > 0 && currentBalance < minAlert;
  const monthLabel = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description={`Ringkasan keuangan dan aktivitas masjid ${mosqueProfile.shortName}`}
        actions={
          <>
            <Link
              href="/admin/reports"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-all duration-200 shadow-2xs hover:shadow-xs"
            >
              <Download className="w-4 h-4 text-muted-foreground" />
              Laporan
            </Link>
            <Link
              href="/admin/transactions?type=income"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-xs hover:shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Transaksi Baru
            </Link>
          </>
        }
      />

      {/* Peringatan saldo minimum (config minBalanceAlert akhirnya dipakai) */}
      {lowBalance && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-sm dark:border-amber-800/50 dark:bg-amber-950/40"
        >
          <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
            <Coins className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              Saldo kas di bawah batas minimum ({formatCurrency(minAlert)})
            </p>
            <p className="mt-0.5 text-amber-800/90 dark:text-amber-300/90">
              Saldo saat ini {formatCurrency(currentBalance)}. Tinjau pengeluaran atau dorong
              pemasukan bulan berjalan.
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {!financialSummary ? (
        <DataSkeleton lines={2} />
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Saldo Kas"
          value={formatCurrency(currentBalance)}
          description={
            financialSummary.lastUpdated
              ? `Diperbarui ${formatDate(financialSummary.lastUpdated, { day: "numeric", month: "short", year: "numeric" })}`
              : monthLabel
          }
          icon={Coins}
          iconBgClass="bg-primary/10 text-primary"
          valueColorClass="text-foreground"
        />
        <StatCard
          title="Pemasukan Bulan Ini"
          value={formatCurrency(monthlyIncome)}
          description={monthLabel}
          icon={TrendUp}
          trend={incomeTrend}
          trendLabel="vs bln lalu"
          iconBgClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          valueColorClass="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          title="Pengeluaran Bulan Ini"
          value={formatCurrency(monthlyExpense)}
          description={monthLabel}
          icon={TrendDown}
          trend={expenseTrend}
          trendLabel="vs bln lalu"
          iconBgClass="bg-rose-500/10 text-rose-600 dark:text-rose-400"
          valueColorClass="text-rose-600 dark:text-rose-400"
        />
        <StatCard
          title="Surplus Bulanan"
          value={formatCurrency(monthlyIncome - monthlyExpense)}
          description="Saldo bersih bulan ini"
          icon={Coins}
          iconBgClass="bg-teal-500/10 text-teal-600 dark:text-teal-400"
          valueColorClass="text-teal-600 dark:text-teal-400"
        />
      </div>
      )}

      {/* Kesehatan konten — total berita/kegiatan/transaksi agar tak hanya kas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Berita aktif", value: announcements?.length, href: "/admin/announcements", ready: announcements !== undefined },
          { label: "Kegiatan terjadwal", value: (activities ?? []).length, href: "/admin/activities", ready: activities !== undefined },
          { label: "Total transaksi", value: transactions.length, href: "/admin/transactions", ready: !txnsLoading },
        ].map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40"
          >
            <span className="text-sm text-muted-foreground">{c.label}</span>
            <span className="text-lg font-bold tabular-nums text-foreground">
              {c.ready ? c.value : "…"}
            </span>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Chart Card */}
          <Card className="hover:border-primary/20 transition-all">
            <CardHeader className="p-5 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base sm:text-lg font-semibold text-foreground">Tren 6 Bulan Terakhir</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Perbandingan arus kas pemasukan dan pengeluaran</p>
              </div>
              <div className="flex items-center gap-4 text-xs shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.income }} />
                  <span className="text-muted-foreground font-medium">Pemasukan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.expense }} />
                  <span className="text-muted-foreground font-medium">Pengeluaran</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-3">
              {!chartData ? <DataSkeleton lines={4} /> : <MiniChart data={chartData} />}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          {txnsLoading ? <DataSkeleton lines={4} /> : <RecentTransactions items={transactions} />}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <QuickActions />
          {!announcements ? <DataSkeleton lines={3} /> : <UpcomingAnnouncements items={announcements} />}
        </div>
      </div>
    </div>
  );
}