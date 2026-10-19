"use client";

// Grafik arus kas untuk halaman publik. Data dikirim utuh dari Server Component
// (bukan fetch di browser), tetap Client Component karena recharts + tab
// interaktif memerlukan state.
//
// Riwayat: komponen ini pernah ada, ikut terhapus bersama blok "grafik" di
// beranda (commit 4dc92a3), padahal datanya masih disediakan server. Sekarang
// dipulihkan agar janji produk "ringkasan + grafik + rincian" benar-benar utuh.

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import type { ChartDataPoint } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ChartType = "area" | "line" | "bar";

// Bentuk minimal entri tooltip yang benar-benar kita pakai. Ditulis sendiri
// (bukan `any`) agar tidak menambah error lint `no-explicit-any`; recharts
// menyerahkan payload yang jauh lebih kaya di runtime.
type TooltipEntry = {
  dataKey?: string | number;
  name?: string;
  value?: number | string;
  color?: string;
};
type ChartTooltipProps = {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: TooltipContentProps<number, string>["label"];
};

// Warna sengaja diambil pada tingkat kecerahan tengah antara token tema
// terang & gelap (`--chart-1`, `--destructive`, `--chart-2`). recharts menulis
// warna ini sebagai atribut SVG, tempat `var(--token)` tidak dihormati semua
// peramban — jadi nilai tengah dipilih agar tetap terbaca di kedua tema.
const COLORS = {
  income: "oklch(0.55 0.14 162)",
  expense: "oklch(0.62 0.2 25)",
  balance: "oklch(0.68 0.15 85)",
};

const SERIES_LABEL: Record<string, string> = {
  income: "Pemasukan",
  expense: "Pengeluaran",
  balance: "Saldo bersih",
};

// Ringkas label sumbu agar tidak terpotong di ruang sempit:
// 74.500.000 → 74,5 jt. Tooltip tetap memakai nominal penuh.
function formatAxisCompact(value: number): string {
  const abs = Math.abs(value);
  const tidy = (n: string) => n.replace(".", ",").replace(",0", "");
  if (abs >= 1_000_000_000) return `${tidy((value / 1_000_000_000).toFixed(1))} M`;
  if (abs >= 1_000_000) return `${tidy((value / 1_000_000).toFixed(1))} jt`;
  if (abs >= 1_000) return `${tidy((value / 1_000).toFixed(1))} rb`;
  return `${value}`;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="min-w-[200px] rounded-lg border border-border bg-card p-3 shadow-lg">
      <p className="mb-2 text-sm font-semibold text-foreground">{label}</p>
      <ul className="space-y-1">
        {payload.map((entry) => (
          <li
            key={String(entry.dataKey ?? entry.name)}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
              aria-hidden="true"
            />
            <span className="font-medium">
              {SERIES_LABEL[String(entry.dataKey ?? entry.name)] ?? entry.name}:
            </span>
            <span className="ml-auto font-bold tabular-nums text-foreground">
              {formatCurrency(Number(entry.value ?? 0))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GridAndAxes() {
  return (
    <>
      {/* Warna lewat className (CSS), bukan atribut SVG: `var(--token)` tidak
          dihormati sebagai nilai atribut di semua peramban, sedangkan kelas
          Tailwind mengisi `fill`/`stroke` dan diwariskan ke elemen teks/gris. */}
      <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" vertical={false} />
      <XAxis
        dataKey="period"
        className="fill-muted-foreground text-border"
        tick={{ fontSize: 12 }}
        axisLine={{ stroke: "currentColor" }}
        tickLine={false}
        interval="preserveStartEnd"
        minTickGap={24}
      />
      <YAxis
        className="fill-muted-foreground"
        tick={{ fontSize: 12 }}
        axisLine={false}
        tickLine={false}
        tickFormatter={(value: number) => formatAxisCompact(value)}
        width={56}
        tickCount={6}
      />
      <Tooltip content={<ChartTooltip />} />
    </>
  );
}

function ChartContent({ data, type }: { data: ChartDataPoint[]; type: ChartType }) {
  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <GridAndAxes />
          <Line
            type="monotone"
            dataKey="income"
            name="Pemasukan"
            stroke={COLORS.income}
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="expense"
            name="Pengeluaran"
            stroke={COLORS.expense}
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="balance"
            name="Saldo bersih"
            stroke={COLORS.balance}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
          <GridAndAxes />
          <Bar dataKey="income" name="Pemasukan" fill={COLORS.income} radius={[4, 4, 0, 0]} maxBarSize={26} />
          <Bar
            dataKey="expense"
            name="Pengeluaran"
            fill={COLORS.expense}
            radius={[4, 4, 0, 0]}
            maxBarSize={26}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="publicIncomeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.income} stopOpacity={0.28} />
            <stop offset="95%" stopColor={COLORS.income} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="publicExpenseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.expense} stopOpacity={0.28} />
            <stop offset="95%" stopColor={COLORS.expense} stopOpacity={0} />
          </linearGradient>
        </defs>
        <GridAndAxes />
        <Area
          type="monotone"
          dataKey="income"
          name="Pemasukan"
          stroke={COLORS.income}
          strokeWidth={2}
          fill="url(#publicIncomeFill)"
        />
        <Area
          type="monotone"
          dataKey="expense"
          name="Pengeluaran"
          stroke={COLORS.expense}
          strokeWidth={2}
          fill="url(#publicExpenseFill)"
        />
        <Area
          type="monotone"
          dataKey="balance"
          name="Saldo bersih"
          stroke={COLORS.balance}
          strokeWidth={2}
          strokeDasharray="5 5"
          fill="none"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function FinancialChart({ chartData }: { chartData: ChartDataPoint[] }) {
  const [chartType, setChartType] = useState<ChartType>("area");

  const hasFlow = chartData.some((p) => p.income > 0 || p.expense > 0);
  const rangeLabel =
    chartData.length > 0
      ? `${chartData[0].period} – ${chartData[chartData.length - 1].period}`
      : "";
  // Sorotan dihitung dari data (bukan teks statis), dan hanya masuk akal bila
  // memang ada arus kas.
  const highlight = hasFlow
    ? [...chartData].sort((a, b) => b.balance - a.balance)[0]
    : undefined;

  return (
    <section
      id="grafik"
      aria-labelledby="grafik-heading"
      className="scroll-mt-24 bg-background py-14 md:py-20"
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_18px_45px_-32px_rgba(4,47,34,0.5)]">
          <div className="flex flex-col gap-4 border-b border-border/70 p-6 sm:flex-row sm:items-center sm:justify-between md:p-7 md:pb-6">
            <div className="max-w-xl">
              <h2
                id="grafik-heading"
                className="font-display text-balance text-2xl font-semibold text-foreground md:text-[1.75rem] md:leading-snug"
              >
                Tren Kas 12 Bulan Terakhir
              </h2>
              <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
                {hasFlow && rangeLabel
                  ? `Periode ${rangeLabel} — pemasukan, pengeluaran, dan saldo bersih per bulan.`
                  : "Grafik akan terisi otomatis begitu transaksi pertama dicatat pengurus."}
              </p>
            </div>

            {hasFlow && (
              <Tabs
                value={chartType}
                onValueChange={(value) => setChartType(value as ChartType)}
                className="w-auto shrink-0"
              >
                <TabsList aria-label="Tipe grafik">
                  <TabsTrigger value="area" className="px-3 text-[13px]">
                    Area
                  </TabsTrigger>
                  <TabsTrigger value="line" className="px-3 text-[13px]">
                    Garis
                  </TabsTrigger>
                  <TabsTrigger value="bar" className="px-3 text-[13px]">
                    Batang
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>

          <div className="p-6 md:p-7 md:pt-6">
            {hasFlow ? (
              <>
                <div className="h-[300px] w-full md:h-[340px]">
                  <ChartContent data={chartData} type={chartType} />
                </div>
                <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] font-medium text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: COLORS.income }}
                      aria-hidden="true"
                    />
                    Pemasukan
                  </li>
                  <li className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: COLORS.expense }}
                      aria-hidden="true"
                    />
                    Pengeluaran
                  </li>
                  <li className="flex items-center gap-2">
                    <span
                      className="h-0.5 w-5 rounded-full"
                      style={{ backgroundColor: COLORS.balance }}
                      aria-hidden="true"
                    />
                    Saldo bersih
                  </li>
                </ul>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 px-5 py-12 text-center">
                <p className="font-semibold text-foreground">Belum ada transaksi tercatat</p>
                <p className="mx-auto mt-1.5 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
                  Setelah pengurus mencatat pemasukan/pengeluaran, tren bulanan akan
                  langsung terlihat di sini.
                </p>
              </div>
            )}
          </div>

          {highlight && (
            <div className="border-t border-border/70 bg-primary/[0.04] px-6 py-4 text-center md:px-7">
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-semibold text-primary">Sorotan {highlight.period}:</span>{" "}
                surplus {formatCurrency(highlight.balance)} dari pemasukan{" "}
                {formatCurrency(highlight.income)}.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
