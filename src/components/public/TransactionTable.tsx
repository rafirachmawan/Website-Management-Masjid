"use client";

import { useState, useMemo } from "react";
import { transactions, categories } from "@/lib/mock-data";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CaretUp, CaretDown, CaretUpDown, MagnifyingGlass, FunnelSimple, ArrowDown } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
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

  return (
    <section aria-labelledby="transactions-heading" className="py-10 md:py-16">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 id="transactions-heading" className="text-2xl font-semibold text-foreground">
              Rincian Transaksi Kas
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Semua transaksi masuk dan keluar. Data bersifat transparan dan hanya untuk tujuan informasi.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Cari transaksi..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                aria-label="Cari transaksi"
              />
            </div>

            <Select value={periodFilter} onValueChange={(v) => v && setPeriodFilter(v)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Periode" />
                <FunnelSimple className="w-4 h-4 mr-2" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Harian</SelectItem>
                <SelectItem value="weekly">Mingguan</SelectItem>
                <SelectItem value="monthly">Bulanan</SelectItem>
                <SelectItem value="yearly">Tahunan</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" className="gap-2" disabled>
              <ArrowDown className="w-4 h-4" />
              Ekspor PDF
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableCaption className="sr-only">
              Daftar transaksi kas masjid masuk dan keluar
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("date")}>
                  <div className="flex items-center gap-1.5">
                    Tanggal
                    {getSortIcon("date")}
                  </div>
                </TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort("description")}>
                  <div className="flex items-center gap-1.5">
                    Keterangan
                    {getSortIcon("description")}
                  </div>
                </TableHead>
                <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort("amount")}>
                  <div className="flex items-center justify-end gap-1.5">
                    Jumlah
                    {getSortIcon("amount")}
                  </div>
                </TableHead>
                <TableHead>Tipe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    Tidak ada transaksi ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-sm">{formatShortDate(transaction.date)}</TableCell>
                    <TableCell>
                      <span className="font-medium">{transaction.category}</span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums font-medium">
                      {transaction.type === "income" ? (
                        <span className="text-green-600 dark:text-green-400">
                          +{formatCurrency(transaction.amount)}
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">
                          -{formatCurrency(transaction.amount)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={transaction.type === "income" ? "default" : "secondary"}
                        className={cn(
                          "gap-1.5 px-2.5 py-0.5 text-xs",
                          transaction.type === "income"
                            ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
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

          {(currentPage > 1 || currentPage < totalPages) && (
            <div className="px-4 py-3 border-t border-border flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)} dari {filteredTransactions.length} transaksi
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Halaman sebelumnya"
                >
                  <CaretUp className="w-4 h-4 rotate-90" />
                </Button>
                <span className="px-3 text-sm font-medium">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Halaman selanjutnya"
                >
                  <CaretDown className="w-4 h-4 rotate-90" />
                </Button>
              </div>
            </div>
          )}

          <div className="px-4 py-3 border-t border-border bg-muted/30 grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-muted-foreground">Total Pemasukan</p>
              <p className="font-bold text-green-600 dark:text-green-400">{formatCurrency(incomeTotal)}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Total Pengeluaran</p>
              <p className="font-bold text-red-600 dark:text-red-400">{formatCurrency(expenseTotal)}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Selisih</p>
              <p className="font-bold text-foreground">{formatCurrency(incomeTotal - expenseTotal)}</p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground text-center">
          Data bersifat read-only. Penginputan dan pengeditan transaksi hanya dapat dilakukan oleh Bendahara/Superadmin yang login.
        </p>
      </div>
    </section>
  );
}