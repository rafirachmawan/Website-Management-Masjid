"use client";

import { useState, useMemo } from "react";
import { useApi } from "@/lib/api";
import { DataSkeleton } from "@/components/DataSkeleton";
import type {
  Transaction,
  Category,
  ChartDataPoint,
  FinancialSummary,
  MosqueProfile,
} from "@/types";
import { formatCurrency, cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/PageHeader";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Coins,
  TrendUp,
  TrendDown,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  ChartBar,
  ChartPie,
  Receipt,
  Printer,
  FileText,
  Info,
} from "@phosphor-icons/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ─── Constants ───────────────────────────────────────────────────────────────

const COLORS = {
  income: "oklch(0.42 0.12 162)",
  expense: "oklch(0.58 0.2 25)",
};

const PIE_COLORS_INCOME = [
  "#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0",
];

const PIE_COLORS_EXPENSE = [
  "#dc2626", "#ef4444", "#f87171", "#fca5a5", "#fecaca", "#fde2e2", "#fee2e2",
];

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// ─── Tooltips ────────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-3 min-w-[200px]">
      <p className="text-xs font-semibold text-muted-foreground mb-2">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="flex items-center justify-between gap-4 text-xs py-0.5" style={{ color: entry.color || entry.fill }}>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            {entry.name}
          </span>
          <span className="font-bold tabular-nums">{formatCurrency(entry.value)}</span>
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload || !payload[0]) return null;
  const data = payload[0];
  return (
    <div className="bg-card border border-border rounded-xl shadow-lg p-3 min-w-[180px]">
      <p className="flex items-center gap-2 text-xs font-semibold text-foreground mb-1">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload?.fill }} />
        {data.name}
      </p>
      <p className="text-sm font-bold tabular-nums text-foreground">{formatCurrency(data.value)}</p>
      <p className="text-[11px] text-muted-foreground">{data.payload?.percentage}% dari total</p>
    </div>
  );
}

// ─── Summary Stats ───────────────────────────────────────────────────────────

function ReportSummaryStats({
  income,
  expense,
  balance,
  txnCount,
  periodLabel,
}: {
  income: number;
  expense: number;
  balance: number;
  txnCount: number;
  periodLabel: string;
}) {
  const stats = [
    {
      title: "Total Pemasukan",
      value: formatCurrency(income),
      icon: TrendUp,
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      valueColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Total Pengeluaran",
      value: formatCurrency(expense),
      icon: TrendDown,
      iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      valueColor: "text-rose-600 dark:text-rose-400",
    },
    {
      title: "Saldo Bersih",
      value: formatCurrency(balance),
      icon: Coins,
      iconBg: balance >= 0 ? "bg-primary/10 text-primary" : "bg-rose-500/10 text-rose-600",
      valueColor: balance >= 0 ? "text-primary" : "text-rose-600 dark:text-rose-400",
    },
    {
      title: "Jumlah Transaksi",
      value: txnCount.toString(),
      icon: Receipt,
      iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
      valueColor: "text-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.title} className="hover:border-primary/30 hover:shadow-xs transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-sm font-medium text-muted-foreground">{s.title}</span>
              <div className={cn("p-2 rounded-xl shrink-0", s.iconBg)}>
                <s.icon className="w-4.5 h-4.5" aria-hidden="true" />
              </div>
            </div>
            <p className={cn("text-2xl font-bold tabular-nums tracking-tight", s.valueColor)}>
              {s.value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{periodLabel}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Trend Chart (Area) ──────────────────────────────────────────────────────

function TrendChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 12, right: 24, left: -5, bottom: 4 }}>
        <defs>
          <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.income} stopOpacity={0.2} />
            <stop offset="95%" stopColor={COLORS.income} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.expense} stopOpacity={0.2} />
            <stop offset="95%" stopColor={COLORS.expense} stopOpacity={0} />
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
          tickFormatter={(v) => {
            if (v === 0) return "0";
            if (v >= 1_000_000) return `${(v / 1_000_000).toLocaleString("id-ID")} jt`;
            return `${(v / 1_000).toLocaleString("id-ID")} rb`;
          }}
        />
        <Tooltip content={<ChartTooltip />} />
        <Area type="monotone" dataKey="income" stroke={COLORS.income} strokeWidth={2.5} fill="url(#gradIncome)" name="Pemasukan" />
        <Area type="monotone" dataKey="expense" stroke={COLORS.expense} strokeWidth={2.5} fill="url(#gradExpense)" name="Pengeluaran" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Bar Comparison Chart ────────────────────────────────────────────────────

function ComparisonBarChart({ data }: { data: ChartDataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 12, right: 24, left: -5, bottom: 4 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
        <XAxis
          dataKey="period"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
          interval={0}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => {
            if (v === 0) return "0";
            if (v >= 1_000_000) return `${(v / 1_000_000).toLocaleString("id-ID")} jt`;
            return `${(v / 1_000).toLocaleString("id-ID")} rb`;
          }}
        />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="income" name="Pemasukan" fill={COLORS.income} radius={[4, 4, 0, 0]} maxBarSize={32} />
        <Bar dataKey="expense" name="Pengeluaran" fill={COLORS.expense} radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Category Breakdown (Pie) ────────────────────────────────────────────────

interface CategoryBreakdownItem {
  name: string;
  value: number;
  percentage: number;
  fill: string;
}

function CategoryPieChart({
  data,
  title,
}: {
  data: CategoryBreakdownItem[];
  title: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
        Tidak ada data
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-semibold text-foreground mb-3">{title}</p>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
            strokeWidth={2}
            stroke="var(--card)"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip content={<PieTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="space-y-1.5 mt-2 max-h-[160px] overflow-y-auto">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs px-1 py-0.5">
            <span className="flex items-center gap-2 text-muted-foreground truncate">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
              <span className="truncate">{item.name}</span>
            </span>
            <span className="font-semibold text-foreground tabular-nums shrink-0 ml-2">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Category Summary Table ──────────────────────────────────────────────────

function CategorySummaryTable({
  filteredTxns,
  categories,
  type,
}: {
  filteredTxns: Transaction[];
  categories: Category[];
  type: "income" | "expense";
}) {
  const filtered = filteredTxns.filter((t) => t.type === type);
  const total = filtered.reduce((s, t) => s + t.amount, 0);

  const grouped = useMemo(() => {
    const map = new Map<string, { category: string; categoryId: string; total: number; count: number }>();
    filtered.forEach((t) => {
      const existing = map.get(t.categoryId);
      if (existing) {
        existing.total += t.amount;
        existing.count += 1;
      } else {
        map.set(t.categoryId, {
          category: t.category,
          categoryId: t.categoryId,
          total: t.amount,
          count: 1,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filtered]);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableCaption className="sr-only">
          Rincian {type === "income" ? "pemasukan" : "pengeluaran"} per kategori
        </TableCaption>
        <TableHeader>
          <TableRow className="bg-muted/30 border-b border-border/60 hover:bg-muted/30">
            <TableHead className="py-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Kategori
            </TableHead>
            <TableHead className="py-2.5 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-widest w-20">
              Transaksi
            </TableHead>
            <TableHead className="py-2.5 text-right text-[11px] font-bold text-muted-foreground uppercase tracking-widest w-36">
              Jumlah
            </TableHead>
            <TableHead className="py-2.5 text-right text-[11px] font-bold text-muted-foreground uppercase tracking-widest w-20">
              %
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grouped.map((row) => {
            const pct = total > 0 ? Math.round((row.total / total) * 100) : 0;
            const cat = categories.find((c) => c.id === row.categoryId);
            return (
              <TableRow key={row.categoryId} className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors">
                <TableCell className="py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat?.color || "var(--primary)" }}
                    />
                    <span className="text-sm font-semibold text-foreground">{row.category}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-center text-sm text-muted-foreground tabular-nums">
                  {row.count}
                </TableCell>
                <TableCell className={cn(
                  "py-3 text-right text-sm font-bold tabular-nums",
                  type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                )}>
                  {formatCurrency(row.total)}
                </TableCell>
                <TableCell className="py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          type === "income" ? "bg-emerald-500" : "bg-rose-500"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{pct}%</span>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {/* Total Row */}
          <TableRow className="bg-muted/20 border-t-2 border-border/60 hover:bg-muted/30">
            <TableCell className="py-3 text-sm font-bold text-foreground">Total</TableCell>
            <TableCell className="py-3 text-center text-sm font-semibold text-foreground tabular-nums">
              {filtered.length}
            </TableCell>
            <TableCell className={cn(
              "py-3 text-right text-sm font-bold tabular-nums",
              type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )}>
              {formatCurrency(total)}
            </TableCell>
            <TableCell className="py-3 text-right text-xs text-muted-foreground">100%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Monthly Summary Table ───────────────────────────────────────────────────

function MonthlySummaryTable({ data }: { data: ChartDataPoint[] }) {
  const totalIncome = data.reduce((s, d) => s + d.income, 0);
  const totalExpense = data.reduce((s, d) => s + d.expense, 0);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableCaption className="sr-only">Ringkasan keuangan per bulan</TableCaption>
        <TableHeader>
          <TableRow className="bg-muted/30 border-b border-border/60 hover:bg-muted/30">
            <TableHead className="py-2.5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Periode</TableHead>
            <TableHead className="py-2.5 text-right text-[11px] font-bold text-muted-foreground uppercase tracking-widest w-36">Pemasukan</TableHead>
            <TableHead className="py-2.5 text-right text-[11px] font-bold text-muted-foreground uppercase tracking-widest w-36">Pengeluaran</TableHead>
            <TableHead className="py-2.5 text-right text-[11px] font-bold text-muted-foreground uppercase tracking-widest w-36">Saldo</TableHead>
            <TableHead className="py-2.5 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-widest w-24">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => {
            const surplus = row.income - row.expense;
            return (
              <TableRow key={row.period} className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors">
                <TableCell className="py-3 text-sm font-semibold text-foreground">{row.period}</TableCell>
                <TableCell className="py-3 text-right text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(row.income)}
                </TableCell>
                <TableCell className="py-3 text-right text-sm font-bold tabular-nums text-rose-600 dark:text-rose-400">
                  {formatCurrency(row.expense)}
                </TableCell>
                <TableCell className={cn(
                  "py-3 text-right text-sm font-bold tabular-nums",
                  surplus >= 0 ? "text-primary" : "text-rose-600 dark:text-rose-400"
                )}>
                  {formatCurrency(surplus)}
                </TableCell>
                <TableCell className="py-3 text-center">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[11px] font-semibold px-2 py-0.5 border gap-1",
                      surplus >= 0
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60"
                        : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/60"
                    )}
                  >
                    {surplus >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {surplus >= 0 ? "Surplus" : "Defisit"}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
          {/* Total Row */}
          <TableRow className="bg-muted/20 border-t-2 border-border/60 hover:bg-muted/30">
            <TableCell className="py-3 text-sm font-bold text-foreground">Total Tahun 2026</TableCell>
            <TableCell className="py-3 text-right text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalIncome)}
            </TableCell>
            <TableCell className="py-3 text-right text-sm font-bold tabular-nums text-rose-600 dark:text-rose-400">
              {formatCurrency(totalExpense)}
            </TableCell>
            <TableCell className={cn(
              "py-3 text-right text-sm font-bold tabular-nums",
              totalIncome - totalExpense >= 0 ? "text-primary" : "text-rose-600"
            )}>
              {formatCurrency(totalIncome - totalExpense)}
            </TableCell>
            <TableCell className="py-3 text-center">
              <Badge variant="outline" className="text-[11px] font-semibold px-2 py-0.5 border bg-primary/10 text-primary border-primary/30">
                Akumulasi
              </Badge>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

type PeriodType = "monthly" | "yearly" | "custom";
type ChartType = "area" | "bar";

export function ReportsPage() {
  const { data: fetchedTransactions } = useApi<Transaction[]>("/api/transactions");
  const { data: fetchedCategories } = useApi<Category[]>("/api/categories");
  const { data: fetchedChart } = useApi<ChartDataPoint[]>("/api/chart");
  const { data: fetchedSummary } = useApi<FinancialSummary>("/api/financial-summary");
  const { data: fetchedProfile } = useApi<MosqueProfile>("/api/mosque-profile");

  const transactions = fetchedTransactions ?? [];
  const categories = fetchedCategories ?? [];
  const chartData = fetchedChart ?? [];
  const financialSummary = fetchedSummary;
  const mosqueProfile = fetchedProfile;

  const [periodType, setPeriodType] = useState<PeriodType>("yearly");
  const [selectedMonth, setSelectedMonth] = useState("9"); // September
  const [selectedYear] = useState("2026");
  const [chartType, setChartType] = useState<ChartType>("area");

  // Filter transactions by period
  const filteredTxns = useMemo(() => {
    if (periodType === "monthly") {
      const month = parseInt(selectedMonth);
      return transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() + 1 === month && d.getFullYear() === parseInt(selectedYear);
      });
    }
    // yearly — all 2026
    return transactions.filter((t) => new Date(t.date).getFullYear() === parseInt(selectedYear));
  }, [periodType, selectedMonth, selectedYear]);

  // Compute totals
  const totalIncome = filteredTxns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filteredTxns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Period label
  const periodLabel = periodType === "monthly"
    ? `${MONTHS[parseInt(selectedMonth) - 1]} ${selectedYear}`
    : `Tahun ${selectedYear}`;

  // Chart data based on period
  const displayChartData = periodType === "monthly"
    ? chartData.filter((c) => c.period.includes(MONTHS[parseInt(selectedMonth) - 1].slice(0, 3)))
    : chartData;

  // Category pie data
  const incomePieData: CategoryBreakdownItem[] = useMemo(() => {
    const map = new Map<string, number>();
    filteredTxns.filter((t) => t.type === "income").forEach((t) => {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    });
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({
        name,
        value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
        fill: PIE_COLORS_INCOME[i % PIE_COLORS_INCOME.length],
      }));
  }, [filteredTxns]);

  const expensePieData: CategoryBreakdownItem[] = useMemo(() => {
    const map = new Map<string, number>();
    filteredTxns.filter((t) => t.type === "expense").forEach((t) => {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    });
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({
        name,
        value,
        percentage: total > 0 ? Math.round((value / total) * 100) : 0,
        fill: PIE_COLORS_EXPENSE[i % PIE_COLORS_EXPENSE.length],
      }));
  }, [filteredTxns]);

  if (!fetchedTransactions || !fetchedCategories || !fetchedChart || !financialSummary || !mosqueProfile) {
    return (
      <div className="space-y-6" aria-label="Memuat laporan keuangan">
        <DataSkeleton lines={2} className="max-w-md" />
        <DataSkeleton lines={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <PageHeader
        title="Laporan Keuangan"
        description={`Ringkasan dan analisis keuangan masjid ${mosqueProfile.shortName}`}
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl shadow-2xs">
              <Printer className="w-4 h-4" />
              Cetak
            </Button>
            <Button size="sm" className="gap-1.5 rounded-xl shadow-xs">
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
          </>
        }
      />

      {/* ── Period Selector ───────────────────────────────────────────── */}
      <Card className="hover:border-primary/20 transition-all">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Periode Laporan:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Select
                value={periodType}
                onValueChange={(val) => {
                  if (val) setPeriodType(val as PeriodType);
                }}
              >
                <SelectTrigger className="w-[140px] h-9 text-xs rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Bulanan</SelectItem>
                  <SelectItem value="yearly">Tahunan</SelectItem>
                </SelectContent>
              </Select>

              {periodType === "monthly" && (
                <Select
                  value={selectedMonth}
                  onValueChange={(val) => {
                    if (val) setSelectedMonth(val);
                  }}
                >
                  <SelectTrigger className="w-[150px] h-9 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="h-9 px-3 flex items-center rounded-lg bg-muted/50 border border-border/60 text-xs font-medium text-muted-foreground">
                Tahun: {selectedYear}
              </div>
            </div>

            <div className="sm:ml-auto flex items-center gap-1 p-1 bg-muted/40 rounded-lg border border-border/40">
              <span className="text-[11px] text-muted-foreground px-1.5 shrink-0">Tampilan:</span>
              <Badge
                variant={periodLabel ? "outline" : "default"}
                className={cn(
                  "text-xs font-medium px-2.5 py-1 cursor-pointer border-0 transition-all rounded-md",
                  "bg-primary/10 text-primary"
                )}
              >
                <FileText className="w-3.5 h-3.5 mr-1" />
                {periodLabel}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Summary Stats ─────────────────────────────────────────────── */}
      <ReportSummaryStats
        income={totalIncome}
        expense={totalExpense}
        balance={balance}
        txnCount={filteredTxns.length}
        periodLabel={periodLabel}
      />

      {/* ── Charts Section ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart (2/3 width) */}
        <Card className="lg:col-span-2 hover:border-primary/20 transition-all">
          <CardHeader className="p-5 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Tren Arus Kas
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Perbandingan pemasukan dan pengeluaran {periodLabel.toLowerCase()}
                </p>
              </div>
              <div className="flex items-center gap-1 p-0.5 bg-muted/40 rounded-lg border border-border/40">
                <button
                  onClick={() => setChartType("area")}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                    chartType === "area"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <TrendUp className="w-3.5 h-3.5" />
                  Area
                </button>
                <button
                  onClick={() => setChartType("bar")}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                    chartType === "bar"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ChartBar className="w-3.5 h-3.5" />
                  Bar
                </button>
              </div>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-5 mt-3 text-xs">
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
            {chartType === "area" ? (
              <TrendChart data={displayChartData} />
            ) : (
              <ComparisonBarChart data={displayChartData} />
            )}
          </CardContent>
        </Card>

        {/* Pie Charts (1/3 width) */}
        <Card className="hover:border-primary/20 transition-all">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-base font-semibold text-foreground">Komposisi Kategori</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Distribusi per kategori transaksi</p>
          </CardHeader>
          <CardContent className="p-5 pt-3 space-y-6">
            <Tabs defaultValue="income" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-9">
                <TabsTrigger value="income" className="text-xs gap-1">
                  <TrendUp className="w-3.5 h-3.5" />
                  Pemasukan
                </TabsTrigger>
                <TabsTrigger value="expense" className="text-xs gap-1">
                  <TrendDown className="w-3.5 h-3.5" />
                  Pengeluaran
                </TabsTrigger>
              </TabsList>
              <TabsContent value="income" className="mt-4">
                <CategoryPieChart data={incomePieData} title="Komposisi Pemasukan" />
              </TabsContent>
              <TabsContent value="expense" className="mt-4">
                <CategoryPieChart data={expensePieData} title="Komposisi Pengeluaran" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* ── Category Breakdown Tables ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="hover:border-primary/20 transition-all">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10">
                <TrendUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-foreground">Rincian Pemasukan</CardTitle>
                <p className="text-xs text-muted-foreground">Per kategori, {periodLabel}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <CategorySummaryTable filteredTxns={filteredTxns} categories={categories} type="income" />
          </CardContent>
        </Card>

        <Card className="hover:border-primary/20 transition-all">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/10">
                <TrendDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-foreground">Rincian Pengeluaran</CardTitle>
                <p className="text-xs text-muted-foreground">Per kategori, {periodLabel}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <CategorySummaryTable filteredTxns={filteredTxns} categories={categories} type="expense" />
          </CardContent>
        </Card>
      </div>

      {/* ── Monthly Summary Table ─────────────────────────────────────── */}
      {periodType === "yearly" && (
        <Card className="hover:border-primary/20 transition-all">
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-500/10">
                <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-foreground">Ringkasan Bulanan</CardTitle>
                <p className="text-xs text-muted-foreground">Rekap arus kas per bulan, tahun {selectedYear}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <MonthlySummaryTable data={chartData} />
          </CardContent>
        </Card>
      )}

      {/* ── Info Box ──────────────────────────────────────────────────── */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-5 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Info className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Catatan Laporan</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Laporan ini dihasilkan berdasarkan data transaksi yang telah dicatat.
              Untuk laporan resmi dengan kop surat masjid dan tanda tangan pengurus,
              klik tombol <strong>Export PDF</strong> di atas. Data terakhir diperbarui pada{" "}
              {new Date(financialSummary.lastUpdated).toLocaleDateString("id-ID", {
                day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
              })}.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
