"use client";

import { useState, useMemo, useEffect } from "react";
import type { Transaction, PeriodFilter } from "@/types";
import { formatCurrency, formatShortDate } from "@/lib/utils";
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
import { CaretUp, CaretDown, CaretUpDown, CaretLeft, CaretRight, MagnifyingGlass, FunnelSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: "daily", label: "Harian" },
  { value: "weekly", label: "Mingguan" },
  { value: "monthly", label: "Bulanan" },
  { value: "yearly", label: "Tahunan" },
];

type SortDirection = "asc" | "desc" | null;

interface SortState {
  key: keyof Transaction | null;
  direction: SortDirection;
}

const ITEMS_PER_PAGE = 10;

// Tanggal transaksi disimpan yyyy-MM-dd zona masjid — bandingkan sebagai string
// agar tidak geser sehari karena `new Date("2026-10-01")` = midnight UTC.
function jakartaParts(now = new Date()): { y: number; m: number; d: number; weekday: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const y = Number(get("year"));
  const m = Number(get("month"));
  const d = Number(get("day"));
  // weekday short en: Sun..Sat — petakan ke 0..6 (Minggu=0, seperti perilaku lama).
  const wd = get("weekday");
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { y, m, d, weekday: map[wd] ?? new Date().getDay() };
}

function toKey(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("monthly");
  const [sortState, setSortState] = useState<SortState>({ key: "date", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query) ||
          t.recordedBy.toLowerCase().includes(query)
      );
    }

    // Batas periode dihitung dari tanggal Jakarta (string), deterministik 00:00.
    const now = new Date();
    const { y, m, d, weekday } = jakartaParts(now);
    const todayStr = toKey(y, m, d);
    const monthPrefix = `${y}-${String(m).padStart(2, "0")}`;
    const yearPrefix = `${y}`;
    // Awal pekan (Minggu 00:00) sebagai string yyyy-MM-dd.
    const weekStart = new Date(Date.UTC(y, m - 1, d));
    weekStart.setUTCDate(weekStart.getUTCDate() - weekday);
    const weekStr = `${weekStart.getUTCFullYear()}-${String(weekStart.getUTCMonth() + 1).padStart(2, "0")}-${String(weekStart.getUTCDate()).padStart(2, "0")}`;

    switch (periodFilter) {
      case "daily":
        result = result.filter((t) => t.date >= todayStr);
        break;
      case "weekly":
        result = result.filter((t) => t.date >= weekStr);
        break;
      case "monthly":
        result = result.filter((t) => t.date.startsWith(monthPrefix));
        break;
      case "yearly":
        result = result.filter((t) => t.date.startsWith(yearPrefix));
        break;
    }

    if (sortState.key && sortState.direction) {
      result.sort((a, b) => {
        const aVal = a[sortState.key!];
        const bVal = b[sortState.key!];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (aVal < bVal) return sortState.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortState.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [transactions, searchQuery, periodFilter, sortState]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE));
  // Jepit halaman saat filter/data menyusut agar tidak tampil kosong (hal 5 → 1 hal).
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedTransactions = filteredTransactions.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleSort = (key: keyof Transaction) => {
    setSortState((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : prev.key === key && prev.direction === "desc" ? null : "asc",
    }));
    setCurrentPage(1);
  };

  const getSortIcon = (key: keyof Transaction) => {
    if (sortState.key !== key) return <CaretUpDown className="w-4 h-4 text-muted-foreground" />;
    if (sortState.direction === "asc") return <CaretUp className="w-4 h-4 text-primary" />;
    if (sortState.direction === "desc") return <CaretDown className="w-4 h-4 text-primary" />;
    return <CaretUpDown className="w-4 h-4 text-muted-foreground" />;
  };

  const incomeTotal = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expenseTotal = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === periodFilter)?.label ?? "Bulanan";

  return (
    <section
      id="transaksi"
      aria-labelledby="transactions-heading"
      className="scroll-mt-24 pt-8 pb-16 md:pt-10 md:pb-20"
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="mb-8 max-w-2xl md:mb-10">
          <h2 id="transactions-heading" className="font-display text-balance text-2xl font-semibold text-foreground md:text-[1.7rem] md:leading-snug">
            Rincian Transaksi Kas
          </h2>
          <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-muted-foreground md:text-base">
            {filteredTransactions.length} transaksi {periodLabel.toLowerCase()}. Cari,
            saring periode, dan telusuri datanya.
          </p>
        </div>

        <div className="w-full">
        <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:flex-1">
              <MagnifyingGlass className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                placeholder="Cari keterangan, kategori, pencatat…"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 w-full rounded-xl border border-border bg-background py-2 pr-4 pl-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-transparent focus:ring-2 focus:ring-ring focus:outline-none"
                aria-label="Cari transaksi"
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 overflow-x-auto border-t border-border/60 pt-3">
            <span className="flex shrink-0 items-center gap-1.5 px-1 text-xs font-semibold text-muted-foreground">
              <FunnelSimple className="h-3.5 w-3.5" aria-hidden="true" />
              Periode
            </span>
            <div className="flex items-center gap-1.5" role="group" aria-label="Filter periode">
              {PERIOD_OPTIONS.map((opt) => {
                const active = opt.value === periodFilter;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setPeriodFilter(opt.value);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      "h-9 shrink-0 rounded-full px-4 text-[13px] font-semibold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
          <Table className="min-w-[780px]">
            <TableCaption className="sr-only">
              Daftar transaksi kas masjid masuk dan keluar
            </TableCaption>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60 hover:bg-muted/40">
                <TableHead className="w-[132px] cursor-pointer px-4 py-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase select-none" onClick={() => handleSort("date")}>
                  <div className="flex items-center gap-1.5">
                    Tanggal
                    {getSortIcon("date")}
                  </div>
                </TableHead>
                <TableHead className="w-[190px] px-4 py-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Kategori</TableHead>
                <TableHead className="min-w-[260px] cursor-pointer px-4 py-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase select-none" onClick={() => handleSort("description")}>
                  <div className="flex items-center gap-1.5">
                    Keterangan
                    {getSortIcon("description")}
                  </div>
                </TableHead>
                <TableHead className="w-[168px] cursor-pointer px-4 py-3 text-right text-xs font-semibold tracking-wider text-muted-foreground uppercase select-none" onClick={() => handleSort("amount")}>
                  <div className="flex items-center justify-end gap-1.5">
                    Jumlah
                    {getSortIcon("amount")}
                  </div>
                </TableHead>
                <TableHead className="w-[104px] px-4 py-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Tipe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-5 py-14 text-center whitespace-normal">
                    <p className="font-medium text-foreground">Tidak ada transaksi ditemukan</p>
                    <p className="mt-1 text-sm text-muted-foreground">Coba kata kunci atau periode lain.</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="border-border/60 transition-colors hover:bg-primary/[0.03]">
                    <TableCell className="px-4 py-3 text-sm font-semibold whitespace-nowrap tabular-nums">{formatShortDate(transaction.date)}</TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      <span className="text-[13px] font-medium text-muted-foreground">{transaction.category}</span>
                    </TableCell>
                    <TableCell className="min-w-[260px] max-w-[380px] px-4 py-3 whitespace-normal">
                      <span className="line-clamp-2 text-sm leading-relaxed text-foreground break-words">{transaction.description}</span>
                      {transaction.proofUrl && (
                        <a
                          href={transaction.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          Lihat bukti
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right font-bold whitespace-nowrap tabular-nums">
                      {transaction.type === "income" ? (
                        <span className="text-[15px] text-primary">
                          +{formatCurrency(transaction.amount)}
                        </span>
                      ) : (
                        <span className="text-[15px] text-destructive">
                          −{formatCurrency(transaction.amount)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      <Badge
                        variant={transaction.type === "income" ? "default" : "secondary"}
                        className={cn(
                          "gap-1.5 rounded-full px-2.5 py-0.5 text-xs",
                          transaction.type === "income"
                            ? "bg-primary/10 text-primary"
                            : "bg-destructive/10 text-destructive"
                        )}
                      >
                        {transaction.type === "income" ? "Masuk" : "Keluar"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>

          {(safePage > 1 || safePage < totalPages) && (
            <div className="flex flex-col gap-3 border-t border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-[13px] text-muted-foreground tabular-nums">
                Menampilkan {filteredTransactions.length === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(safePage * ITEMS_PER_PAGE, filteredTransactions.length)} dari {filteredTransactions.length} transaksi
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  aria-label="Halaman sebelumnya"
                >
                  <CaretLeft className="w-4 h-4" />
                </Button>
                <span className="px-3 text-sm font-medium tabular-nums">
                  {safePage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  aria-label="Halaman selanjutnya"
                >
                  <CaretRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 border-t border-border/60 bg-primary/[0.04] px-4 py-4 text-sm sm:grid-cols-3 sm:gap-4 sm:divide-x sm:divide-primary/15">
            <div className="px-2 text-center sm:text-left">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Total Pemasukan</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-primary">{formatCurrency(incomeTotal)}</p>
            </div>
            <div className="border-t border-primary/10 px-2 pt-4 text-center sm:border-0 sm:pt-0 sm:text-left">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Total Pengeluaran</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-destructive">{formatCurrency(expenseTotal)}</p>
            </div>
            <div className="border-t border-primary/10 px-2 pt-4 text-center sm:border-0 sm:pt-0 sm:text-left">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Selisih Periode Ini</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-foreground">{formatCurrency(incomeTotal - expenseTotal)}</p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
          Data read-only. Input oleh Bendahara atau Superadmin yang login.
        </p>
        </div>
      </div>
    </section>
  );
}