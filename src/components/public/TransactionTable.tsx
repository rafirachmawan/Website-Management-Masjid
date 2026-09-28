"use client";

import { useState, useMemo } from "react";
import { transactions } from "@/lib/mock-data";
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
import { CaretUp, CaretDown, CaretUpDown, CaretLeft, CaretRight, MagnifyingGlass, FunnelSimple, ArrowDown } from "@phosphor-icons/react";
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

export function TransactionTable() {
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

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    switch (periodFilter) {
      case "daily":
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        result = result.filter((t) => new Date(t.date) >= today);
        break;
      case "weekly":
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        result = result.filter((t) => new Date(t.date) >= startOfWeek);
        break;
      case "monthly":
        result = result.filter((t) => new Date(t.date) >= startOfMonth);
        break;
      case "yearly":
        result = result.filter((t) => new Date(t.date) >= startOfYear);
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
  }, [searchQuery, periodFilter, sortState]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE));
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
          <h2 id="transactions-heading" className="text-2xl font-bold tracking-tight text-balance text-foreground md:text-3xl">
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

            <Button
              variant="outline"
              size="sm"
              className="h-10 shrink-0 gap-2 rounded-xl px-4 text-muted-foreground"
              disabled
              title="Ekspor PDF segera hadir"
              aria-disabled="true"
            >
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
              Ekspor PDF
            </Button>
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
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right font-bold whitespace-nowrap tabular-nums">
                      {transaction.type === "income" ? (
                        <span className="text-[15px] text-green-700 dark:text-green-300">
                          +{formatCurrency(transaction.amount)}
                        </span>
                      ) : (
                        <span className="text-[15px] text-red-700 dark:text-red-300">
                          -{formatCurrency(transaction.amount)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap">
                      <Badge
                        variant={transaction.type === "income" ? "default" : "secondary"}
                        className={cn(
                          "gap-1.5 rounded-full px-2.5 py-0.5 text-xs",
                          transaction.type === "income"
                            ? "bg-green-500/10 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-red-500/10 text-red-700 dark:bg-red-900/30 dark:text-red-300"
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

          {(currentPage > 1 || currentPage < totalPages) && (
            <div className="flex flex-col gap-3 border-t border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-[13px] text-muted-foreground tabular-nums">
                Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} dari {filteredTransactions.length} transaksi
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Halaman sebelumnya"
                >
                  <CaretLeft className="w-4 h-4" />
                </Button>
                <span className="px-3 text-sm font-medium tabular-nums">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
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
              <p className="mt-1 text-lg font-bold tabular-nums text-green-700 dark:text-green-300">{formatCurrency(incomeTotal)}</p>
            </div>
            <div className="border-t border-primary/10 px-2 pt-4 text-center sm:border-0 sm:pt-0 sm:text-left">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Total Pengeluaran</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-red-700 dark:text-red-300">{formatCurrency(expenseTotal)}</p>
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