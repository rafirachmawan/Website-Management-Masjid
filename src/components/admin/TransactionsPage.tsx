"use client";

import { useState, useMemo, useEffect } from "react";
import { useApi, apiSend } from "@/lib/api";
import { DataSkeleton } from "@/components/DataSkeleton";
import { formatCurrency, formatDate, formatShortDate, cn } from "@/lib/utils";
import { TransactionFormDialog } from "@/components/admin/TransactionFormDialog";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Coins,
  TrendUp,
  TrendDown,
  Plus,
  MagnifyingGlass,
  Funnel,
  Download,
  Eye,
  PencilSimple,
  Trash,
  DotsThreeVertical,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  ArrowsDownUp,
  X,
  CaretLeft,
  CaretRight,
  Image as ImageIcon,
  Warning,
} from "@phosphor-icons/react";
import type { Transaction, Category } from "@/types";

// ─── Stat Cards ──────────────────────────────────────────────────────────────

function TransactionStats({ transactions }: { transactions: Transaction[] }) {
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalTransactions = transactions.length;

  const stats = [
    {
      title: "Total Pemasukan",
      value: formatCurrency(totalIncome),
      subtitle: `${transactions.filter((t) => t.type === "income").length} transaksi masuk`,
      icon: TrendUp,
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      valueColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Total Pengeluaran",
      value: formatCurrency(totalExpense),
      subtitle: `${transactions.filter((t) => t.type === "expense").length} transaksi keluar`,
      icon: TrendDown,
      iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      valueColor: "text-rose-600 dark:text-rose-400",
    },
    {
      title: "Saldo Bersih",
      value: formatCurrency(totalIncome - totalExpense),
      subtitle: "Selisih pemasukan - pengeluaran",
      icon: Coins,
      iconBg: "bg-primary/10 text-primary",
      valueColor: "text-foreground",
    },
    {
      title: "Total Transaksi",
      value: totalTransactions.toString(),
      subtitle: "Semua catatan kas",
      icon: Receipt,
      iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
      valueColor: "text-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="hover:border-primary/30 hover:shadow-xs transition-all duration-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-sm font-medium text-muted-foreground">{stat.title}</span>
              <div className={cn("p-2 rounded-xl shrink-0", stat.iconBg)}>
                <stat.icon className="w-4.5 h-4.5" aria-hidden="true" />
              </div>
            </div>
            <p className={cn("text-2xl font-bold tabular-nums tracking-tight", stat.valueColor)}>
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Transaction Detail Dialog ───────────────────────────────────────────────

function TransactionDetailDialog({
  transaction,
  categories,
  children,
}: {
  transaction: Transaction;
  categories: Category[];
  children: React.ReactNode;
}) {
  const category = categories.find((c) => c.id === transaction.categoryId);

  return (
    <Dialog>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                transaction.type === "income"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              )}
            >
              {transaction.type === "income" ? (
                <TrendUp className="w-5 h-5" />
              ) : (
                <TrendDown className="w-5 h-5" />
              )}
            </div>
            <div>
              <span className="text-lg">Detail Transaksi</span>
              <Badge
                variant="outline"
                className={cn(
                  "ml-2 text-[11px] font-semibold border",
                  transaction.type === "income"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60"
                    : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/60"
                )}
              >
                {transaction.type === "income" ? "Kas Masuk" : "Kas Keluar"}
              </Badge>
            </div>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detail lengkap transaksi {transaction.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Amount */}
          <div className="rounded-xl bg-muted/50 p-4 text-center border border-border/40">
            <p className="text-xs font-medium text-muted-foreground mb-1">Jumlah</p>
            <p
              className={cn(
                "text-3xl font-bold tabular-nums",
                transaction.type === "income"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              )}
            >
              {transaction.type === "income" ? "+" : "-"}
              {formatCurrency(transaction.amount)}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <DetailItem label="Tanggal" value={formatDate(transaction.date)} />
            <DetailItem label="Kategori" value={transaction.category} />
            <DetailItem
              label="Keterangan"
              value={transaction.description}
              className="col-span-2"
            />
            <DetailItem label="Dicatat oleh" value={transaction.recordedBy} />
            <DetailItem
              label="Waktu input"
              value={formatDate(transaction.createdAt)}
            />
          </div>

          {/* Proof Image Placeholder */}
          {transaction.proofUrl && (
            <div className="rounded-xl border border-border/40 p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Bukti Transaksi</p>
              <div className="w-full h-32 bg-muted/40 rounded-lg flex items-center justify-center border border-dashed border-border">
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="w-8 h-8 mx-auto mb-1.5 opacity-50" />
                  <p className="text-xs">{transaction.proofUrl.split("/").pop()}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" className="gap-1.5">
            <PencilSimple className="w-4 h-4" />
            Edit
          </Button>
          <DialogClose render={<Button variant="ghost" size="sm">Tutup</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg bg-muted/30 p-3 border border-border/30", className)}>
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

// ─── Delete Confirmation Dialog ──────────────────────────────────────────────

function DeleteConfirmDialog({
  transaction,
  children,
  onDeleted,
}: {
  transaction: Transaction;
  children: React.ReactNode;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await apiSend(`/api/transactions/${transaction.id}`, "DELETE");
      onDeleted();
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus transaksi.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={children as React.ReactElement} />
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Warning className="w-5 h-5" />
            Hapus Transaksi?
          </DialogTitle>
          <DialogDescription>
            Transaksi ini akan dihapus permanen dari database lokal.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4 my-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{transaction.category}</p>
              <p className="text-xs text-muted-foreground">{transaction.description}</p>
            </div>
            <p className={cn(
              "text-sm font-bold tabular-nums",
              transaction.type === "income" ? "text-emerald-600" : "text-rose-600"
            )}>
              {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
            </p>
          </div>
        </div>
        {error && (
          <p className="text-xs font-medium text-destructive" role="alert">{error}</p>
        )}
        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose render={<Button variant="ghost" size="sm">Batal</Button>} />
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5"
            disabled={deleting}
            onClick={handleDelete}
          >
            <Trash className="w-4 h-4" />
            {deleting ? "Menghapus..." : "Ya, Hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Row Action Menu ─────────────────────────────────────────────────────────

function RowActions({
  transaction,
  categories,
  onDeleted,
  onEdit,
}: {
  transaction: Transaction;
  categories: Category[];
  onDeleted: () => void;
  onEdit: (txn: Transaction) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <DotsThreeVertical className="w-4.5 h-4.5" />
            <span className="sr-only">Aksi</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-44">
        <TransactionDetailDialog transaction={transaction} categories={categories}>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Eye className="w-4 h-4 mr-2" />
            Lihat Detail
          </DropdownMenuItem>
        </TransactionDetailDialog>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onEdit(transaction);
          }}
        >
          <PencilSimple className="w-4 h-4 mr-2" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DeleteConfirmDialog transaction={transaction} onDeleted={onDeleted}>
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="text-destructive focus:text-destructive"
          >
            <Trash className="w-4 h-4 mr-2" />
            Hapus
          </DropdownMenuItem>
        </DeleteConfirmDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Pagination ──────────────────────────────────────────────────────────────

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between pt-4 border-t border-border/40">
      <p className="text-xs text-muted-foreground">
        Halaman <span className="font-semibold text-foreground">{currentPage}</span> dari{" "}
        <span className="font-semibold text-foreground">{totalPages}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <CaretLeft className="w-4 h-4" />
        </Button>
        {pages.map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="icon"
            className={cn(
              "h-8 w-8 text-xs",
              page === currentPage && "pointer-events-none"
            )}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <CaretRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
        <Receipt className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        Tidak ada transaksi ditemukan
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        Coba ubah filter atau kata kunci pencarian Anda, atau tambahkan transaksi baru.
      </p>
    </div>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

type SortField = "date" | "amount" | "category";
type SortDirection = "asc" | "desc";

export function TransactionsPage() {
  const { data: fetchedTransactions, refresh } = useApi<Transaction[]>("/api/transactions");
  const { data: fetchedCategories } = useApi<Category[]>("/api/categories");
  const transactions = fetchedTransactions ?? [];
  const categories = fetchedCategories ?? [];
  const [searchQuery, setSearchQuery] = useState("");
  // Form tambah/ubah transaksi (modal)
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [newType, setNewType] = useState<"income" | "expense">("income");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter & search
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter((t) => t.type === typeFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter((t) => t.categoryId === categoryFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          formatCurrency(t.amount).toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "date") {
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortField === "amount") {
        cmp = a.amount - b.amount;
      } else if (sortField === "category") {
        cmp = a.category.localeCompare(b.category);
      }
      return sortDirection === "desc" ? -cmp : cmp;
    });

    return result;
  }, [searchQuery, typeFilter, categoryFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE));
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const hasActiveFilters =
    typeFilter !== "all" || categoryFilter !== "all" || searchQuery.trim() !== "";

  const clearAllFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setCurrentPage(1);
  };

  // Available categories for the filter dropdown (only those that exist in transactions)
  const availableCategories = useMemo(() => {
    const usedCategoryIds = new Set(transactions.map((t) => t.categoryId));
    return categories.filter((c) => usedCategoryIds.has(c.id));
  }, [transactions, categories]);

  // Pintasan dari dashboard: /admin/transactions?type=income|expense
  // langsung membuka form dengan tipe yang sesuai. Dibaca dari URL saat mount
  // (bukan useSearchParams) supaya tidak perlu Suspense boundary.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("type");
    if (t === "income" || t === "expense") {
      setNewType(t);
      setEditing(null);
      setFormOpen(true);
    }
  }, []);

  const openCreate = (type: "income" | "expense") => {
    setEditing(null);
    setNewType(type);
    setFormOpen(true);
  };

  const openEdit = (txn: Transaction) => {
    setEditing(txn);
    setFormOpen(true);
  };

  if (!fetchedTransactions || !fetchedCategories) {
    return (
      <div className="space-y-6" aria-label="Memuat transaksi kas">
        <DataSkeleton lines={2} className="max-w-md" />
        <DataSkeleton lines={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <PageHeader
        title="Transaksi Kas"
        description="Kelola catatan pemasukan dan pengeluaran kas masjid"
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl shadow-2xs">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              size="sm"
              className="gap-1.5 rounded-xl shadow-xs"
              onClick={() => openCreate("income")}
            >
              <Plus className="w-4 h-4" />
              Transaksi Baru
            </Button>
          </>
        }
      />

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <TransactionStats transactions={transactions} />

      {/* ── Filters & Table ──────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <CardHeader className="p-5 pb-4 space-y-4 border-b border-border/40">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari keterangan, kategori, atau jumlah..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleFilterChange();
                }}
                className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    handleFilterChange();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={typeFilter}
                onValueChange={(val) => {
                  if (val) setTypeFilter(val as "all" | "income" | "expense");
                  handleFilterChange();
                }}
              >
                <SelectTrigger className="w-[140px] h-9 text-xs rounded-lg">
                  <Funnel className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="income">Kas Masuk</SelectItem>
                  <SelectItem value="expense">Kas Keluar</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={categoryFilter}
                onValueChange={(val) => {
                  setCategoryFilter(val || "all");
                  handleFilterChange();
                }}
              >
                <SelectTrigger className="w-[180px] h-9 text-xs rounded-lg">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-9 text-xs text-muted-foreground hover:text-destructive gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Funnel className="w-3.5 h-3.5 shrink-0" />
              <span>
                Menampilkan{" "}
                <span className="font-semibold text-foreground">
                  {filteredTransactions.length}
                </span>{" "}
                dari{" "}
                <span className="font-semibold text-foreground">
                  {transactions.length}
                </span>{" "}
                transaksi
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {paginatedTransactions.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableCaption className="sr-only">
                    Daftar transaksi kas masjid
                  </TableCaption>
                  <TableHeader>
                    <TableRow className="bg-muted/30 border-b border-border/60 hover:bg-muted/30">
                      <TableHead className="w-12 py-3 pl-5 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                        No
                      </TableHead>
                      <TableHead className="w-28 py-3">
                        <button
                          onClick={() => toggleSort("date")}
                          className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
                        >
                          Tanggal
                          <ArrowsDownUp
                            className={cn(
                              "w-3 h-3",
                              sortField === "date" && "text-primary"
                            )}
                          />
                        </button>
                      </TableHead>
                      <TableHead className="py-3">
                        <button
                          onClick={() => toggleSort("category")}
                          className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
                        >
                          Kategori
                          <ArrowsDownUp
                            className={cn(
                              "w-3 h-3",
                              sortField === "category" && "text-primary"
                            )}
                          />
                        </button>
                      </TableHead>
                      <TableHead className="py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                        Keterangan
                      </TableHead>
                      <TableHead className="w-28 py-3 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                        Tipe
                      </TableHead>
                      <TableHead className="w-40 py-3">
                        <button
                          onClick={() => toggleSort("amount")}
                          className="flex items-center justify-end gap-1 w-full text-[11px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
                        >
                          Jumlah
                          <ArrowsDownUp
                            className={cn(
                              "w-3 h-3",
                              sortField === "amount" && "text-primary"
                            )}
                          />
                        </button>
                      </TableHead>
                      <TableHead className="w-14 py-3 pr-5 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTransactions.map((txn, index) => {
                      const rowNumber =
                        (currentPage - 1) * ITEMS_PER_PAGE + index + 1;

                      return (
                        <TableRow
                          key={txn.id}
                          className="group border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
                        >
                          {/* No */}
                          <TableCell className="py-3.5 pl-5 text-center text-xs font-medium text-muted-foreground tabular-nums">
                            {rowNumber}
                          </TableCell>

                          {/* Date */}
                          <TableCell className="py-3.5">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {formatDate(txn.date, {
                                  day: "2-digit",
                                  month: "short",
                                })}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {new Date(txn.date).getFullYear()}
                              </p>
                            </div>
                          </TableCell>

                          {/* Category */}
                          <TableCell className="py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{
                                  backgroundColor:
                                    categories.find(
                                      (c) => c.id === txn.categoryId
                                    )?.color || "var(--primary)",
                                }}
                              />
                              <span className="text-sm font-semibold text-foreground">
                                {txn.category}
                              </span>
                            </div>
                          </TableCell>

                          {/* Description */}
                          <TableCell className="py-3.5 max-w-xs">
                            <p className="text-sm text-muted-foreground truncate">
                              {txn.description}
                            </p>
                          </TableCell>

                          {/* Type Badge */}
                          <TableCell className="py-3.5 text-center">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[11px] font-semibold px-2.5 py-0.5 border gap-1",
                                txn.type === "income"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60"
                                  : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/60"
                              )}
                            >
                              {txn.type === "income" ? (
                                <ArrowUpRight className="w-3 h-3" />
                              ) : (
                                <ArrowDownRight className="w-3 h-3" />
                              )}
                              {txn.type === "income" ? "Masuk" : "Keluar"}
                            </Badge>
                          </TableCell>

                          {/* Amount */}
                          <TableCell className="py-3.5 text-right">
                            <span
                              className={cn(
                                "text-sm font-bold tabular-nums",
                                txn.type === "income"
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-rose-600 dark:text-rose-400"
                              )}
                            >
                              {txn.type === "income" ? "+" : "-"}
                              {formatCurrency(txn.amount)}
                            </span>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="py-3.5 pr-5 text-center">
                            <RowActions
                              transaction={txn}
                              categories={categories}
                              onDeleted={refresh}
                              onEdit={openEdit}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="px-5 pb-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <TransactionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        categories={categories}
        editing={editing}
        defaultType={newType}
        onSaved={refresh}
      />
    </div>
  );
}
