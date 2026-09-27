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
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { chartData, formatCurrency } from "@/lib/mock-data";
import type { ChartDataPoint } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatCurrency as libFormatCurrency } from "@/lib/utils";

type ChartType = "area" | "line" | "bar";

const COLORS = {
  income: "oklch(0.42 0.12 162)",
  expense: "oklch(0.58 0.2 25)",
  balance: "oklch(0.55 0.15 85)",
};

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
  const chartConfig = {
    income: { label: "Pemasukan", color: COLORS.income },
    expense: { label: "Pengeluaran", color: COLORS.expense },
    balance: { label: "Saldo", color: COLORS.balance },
  };

  const CommonChart = () => (
    <>
      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
      <XAxis
        dataKey="period"
        tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        axisLine={{ stroke: "var(--border)" }}
        tickLine={false}
        interval={0}
      />
      <YAxis
        tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        axisLine={false}
        tickLine={false}
        tickFormatter={(value) => libFormatCurrency(value).replace("Rp", "").trim()}
      />
      <Legend
        wrapperStyle={{ paddingTop: "16px" }}
        formatter={(value) => chartConfig[value as keyof typeof chartConfig]?.label || value}
      />
      <Tooltip content={<CustomTooltip />} />
    </>
  );

  switch (type) {
    case "area":
      return (
        <ResponsiveContainer width="100%" height={320}>
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
        <ResponsiveContainer width="100%" height={320}>
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
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} layout="vertical">
            <CommonChart />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => libFormatCurrency(value).replace("Rp", "").trim()}
            />
            <YAxis
              dataKey="period"
              type="category"
              tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
              width={80}
            />
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
    <section aria-labelledby="chart-heading" className="py-10 md:py-16">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl font-semibold">Grafik Keuangan Bulanan</CardTitle>
            <Tabs value={chartType} onValueChange={setChartType} className="w-auto">
              <TabsList className="bg-muted p-1 rounded-lg" aria-label="Tipe grafik">
                <TabsTrigger value="area" className="px-3 py-1.5 text-sm">
                  Area
                </TabsTrigger>
                <TabsTrigger value="line" className="px-3 py-1.5 text-sm">
                  Garis
                </TabsTrigger>
                <TabsTrigger value="bar" className="px-3 py-1.5 text-sm">
                  Batang
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="relative h-[340px] w-full">
              <ChartContent data={chartData} type={chartType} />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.income }} />
                <span>Pemasukan</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.expense }} />
                <span>Pengeluaran</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-0.5" style={{ backgroundColor: COLORS.balance }} />
                <span>Saldo</span>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm text-muted-foreground text-center">
                Data 9 bulan terakhir (Jan–Sep 2026). Surplus tertinggi pada September 2026
                berkat waqaf tanah Rp 50 Juta.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}