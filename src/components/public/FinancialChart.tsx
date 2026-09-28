"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { chartData } from "@/lib/mock-data";
import type { ChartDataPoint } from "@/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency as libFormatCurrency } from "@/lib/utils";

type ChartType = "area" | "line" | "bar";

const COLORS = {
  income: "oklch(0.42 0.12 162)",
  expense: "oklch(0.58 0.2 25)",
  balance: "oklch(0.55 0.15 85)",
};

// Ringkas label sumbu agar tidak terpotong di ruang sempit.
// 74.500.000 menjadi 74,5 jt. Tooltip tetap memakai nominal penuh.
function formatAxisCompact(value: number): string {
  const abs = Math.abs(value);
  const tidy = (n: string) => n.replace(".", ",").replace(",0", "");
  if (abs >= 1_000_000_000) return `${tidy((value / 1_000_000_000).toFixed(1))} M`;
  if (abs >= 1_000_000) return `${tidy((value / 1_000_000).toFixed(1))} jt`;
  if (abs >= 1_000) return `${tidy((value / 1_000).toFixed(1))} rb`;
  return `${value}`;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload) return null;

  return (
    <div
      className="bg-card border border-border rounded-lg shadow-lg p-3 min-w-[200px]"
      style={{ filter: "drop-shadow(0 4px 6px rgb(0 0 0 / 0.1))" }}
    >
      <p className="text-sm font-medium text-foreground mb-2">{label}</p>
      {payload.map((entry, index) => (
        <p
          key={index}
          className="flex items-center gap-2 text-sm"
          style={{ color: entry.color }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="font-medium">{entry.name}:</span>
          <span className="font-bold tabular-nums">{libFormatCurrency(entry.value)}</span>
        </p>
      ))}
    </div>
  );
}

function ChartContent({ data, type }: { data: ChartDataPoint[]; type: ChartType }) {
  const CommonChart = () => (
    <>
      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
      <XAxis
        dataKey="period"
        tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        axisLine={{ stroke: "var(--border)" }}
        tickLine={false}
        interval="preserveStartEnd"
        minTickGap={24}
      />
      <YAxis
        tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        axisLine={false}
        tickLine={false}
        tickFormatter={(value: number) => formatAxisCompact(value)}
        width={52}
        tickCount={6}
        domain={[0, "auto"]}
      />
      <Tooltip content={<CustomTooltip />} />
    </>
  );

  switch (type) {
    case "area":
      return (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.income} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.income} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.expense} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.expense} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.balance} stopOpacity={0.2} />
                <stop offset="95%" stopColor={COLORS.balance} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CommonChart />
            <Area
              type="monotone"
              dataKey="income"
              stroke={COLORS.income}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorIncome)"
              name="income"
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke={COLORS.expense}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorExpense)"
              name="expense"
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke={COLORS.balance}
              strokeWidth={2}
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#colorBalance)"
              name="balance"
            />
          </AreaChart>
        </ResponsiveContainer>
      );

    case "line":
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CommonChart />
            <Line
              type="monotone"
              dataKey="income"
              stroke={COLORS.income}
              strokeWidth={2.5}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 3 }}
              name="income"
            />
            <Line
              type="monotone"
              dataKey="expense"
              stroke={COLORS.expense}
              strokeWidth={2.5}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 3 }}
              name="expense"
            />
            <Line
              type="monotone"
              dataKey="balance"
              stroke={COLORS.balance}
              strokeWidth={2.5}
              strokeDasharray="5 5"
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 3 }}
              name="balance"
            />
          </LineChart>
        </ResponsiveContainer>
      );

    case "bar":
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) => formatAxisCompact(value)}
            />
            <YAxis
              dataKey="period"
              type="category"
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="income" fill={COLORS.income} name="income" radius={[0, 4, 4, 0]} maxBarSize={30} />
            <Bar dataKey="expense" fill={COLORS.expense} name="expense" radius={[4, 0, 0, 4]} maxBarSize={30} />
          </BarChart>
        </ResponsiveContainer>
      );

    default:
      return null;
  }
}

export function FinancialChart() {
  const [chartType, setChartType] = useState<ChartType>("area");

  return (
    <section
      id="grafik"
      aria-labelledby="chart-heading"
      className="scroll-mt-24 py-8 md:py-10"
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-4 border-b border-border/70 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6 md:pb-5">
            <div className="min-w-0 max-w-xl">
              <h2 id="chart-heading" className="font-display text-balance text-2xl font-semibold text-foreground md:text-[1.7rem] md:leading-snug">
                Grafik Keuangan Bulanan
              </h2>
              <p className="mt-1.5 max-w-[65ch] text-sm leading-relaxed text-muted-foreground">
                Tren Jan-Sep 2026 untuk pemasukan, pengeluaran, dan saldo.
              </p>
            </div>
            <Tabs value={chartType} onValueChange={(v) => v && setChartType(v as ChartType)} className="w-auto shrink-0">
              <TabsList className="rounded-full border border-border bg-muted/70 p-1" aria-label="Tipe grafik">
                <TabsTrigger value="area" className="rounded-full px-4 py-1.5 text-sm data-active:shadow-sm">
                  Area
                </TabsTrigger>
                <TabsTrigger value="line" className="rounded-full px-4 py-1.5 text-sm data-active:shadow-sm">
                  Garis
                </TabsTrigger>
                <TabsTrigger value="bar" className="rounded-full px-4 py-1.5 text-sm data-active:shadow-sm">
                  Batang
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="p-5 md:p-6 md:pt-5">
            <div className="relative h-[300px] w-full md:h-[320px]">
              <ChartContent data={chartData} type={chartType} />
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.income }} />
                <span>Pemasukan</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.expense }} />
                <span>Pengeluaran</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-0.5 w-5 rounded-full" style={{ backgroundColor: COLORS.balance }} />
                <span>Saldo</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 border-t border-border/70 bg-primary/[0.04] px-5 py-3.5 text-center md:flex-row md:justify-center md:gap-2">
            <span className="text-sm font-semibold text-primary">
              Sorotan September 2026:
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Surplus tertinggi berkat wakaf tanah Rp 50 Juta dari Bpk. H. Surya.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}