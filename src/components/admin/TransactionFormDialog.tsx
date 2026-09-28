"use client";

import { useState, useEffect } from "react";
import { apiSend } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { TrendUp, TrendDown, Warning } from "@phosphor-icons/react";
import type { Category, Transaction } from "@/types";

type TxnType = "income" | "expense";

const DEFAULT_RECORDER = "Ust. Ahmad (Bendahara)";

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

// Nominal diketik sebagai angka polos, ditampilkan dengan pemisah ribuan
// supaya bendahara tidak salah baca jumlah rupiah.
function parseAmount(raw: string): number {
  return Number(raw.replace(/\D/g, ""));
}

function formatAmountInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("id-ID");
}

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30";

const labelClass = "mb-1.5 block text-[13px] font-semibold text-foreground";

export function TransactionFormDialog({
  open,
  onOpenChange,
  categories,
  onSaved,
  editing,
  defaultType = "income",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSaved: () => void;
  editing?: Transaction | null;
  defaultType?: TxnType;
}) {
  const [type, setType] = useState<TxnType>(defaultType);
  const [date, setDate] = useState(todayISO());
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [recordedBy, setRecordedBy] = useState(DEFAULT_RECORDER);
  const [proofUrl, setProofUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Isi ulang form setiap kali dialog dibuka (mode tambah atau edit).
  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editing) {
      setType(editing.type as TxnType);
      setDate(editing.date);
      setCategoryId(editing.categoryId);
      setAmount(String(editing.amount));
      setDescription(editing.description);
      setRecordedBy(editing.recordedBy);
      setProofUrl(editing.proofUrl ?? "");
    } else {
      setType(defaultType);
      setDate(todayISO());
      setCategoryId("");
      setAmount("");
      setDescription("");
      setRecordedBy(DEFAULT_RECORDER);
      setProofUrl("");
    }
  }, [open, editing, defaultType]);

  // Kategori hanya boleh sesuai dengan tipe (dicek backend juga, tapi
  // lebih baik tabelnya langsung menyaring biar takmir tidak salah pilih).
  const availableCategories = categories.filter((c) => c.type === type);

  // Kalau kategori terpilih tidak sesuai tipe baru, bersihkan.
  useEffect(() => {
    if (categoryId && !availableCategories.some((c) => c.id === categoryId)) {
      setCategoryId("");
    }
  }, [availableCategories, categoryId]);

  const handleSubmit = async () => {
    setError(null);
    setIsSaving(true);
    try {
      const payload = {
        date,
        type,
        categoryId,
        amount: parseAmount(amount),
        description: description.trim(),
        recordedBy: recordedBy.trim(),
        proofUrl: proofUrl.trim(),
      };
      if (editing) {
        await apiSend(`/api/transactions/${editing.id}`, "PUT", payload);
      } else {
        await apiSend("/api/transactions", "POST", payload);
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan transaksi.");
    } finally {
      setIsSaving(false);
    }
  };

  const nominal = parseAmount(amount);
  const canSubmit = date && categoryId && nominal > 0 && description.trim().length >= 3 && recordedBy.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-semibold">
            {editing ? "Ubah Transaksi" : "Catat Transaksi Baru"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Perubahan langsung terlihat di laporan keuangan publik."
              : "Setiap rupiah yang dicatat akan tampil terbuka di halaman transparansi."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipe — dua tombol besar, lebih jelas daripada dropdown */}
          <div>
            <span className={labelClass}>Tipe Transaksi</span>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: "income", label: "Kas Masuk", icon: TrendUp, on: "bg-emerald-600 text-white border-emerald-600", off: "text-emerald-700 border-emerald-300 hover:bg-emerald-500/10" },
                  { value: "expense", label: "Kas Keluar", icon: TrendDown, on: "bg-rose-600 text-white border-rose-600", off: "text-rose-700 border-rose-300 hover:bg-rose-500/10" },
                ] as const
              ).map((opt) => {
                const Icon = opt.icon;
                const active = type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setType(opt.value)}
                    className={`flex h-10 items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition-colors ${active ? opt.on : `bg-card ${opt.off}`}`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="txn-date" className={labelClass}>
                Tanggal
              </label>
              <input
                id="txn-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="txn-category" className={labelClass}>
                Kategori
              </label>
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
                <SelectTrigger id="txn-category" className="h-10 w-full text-sm">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label htmlFor="txn-amount" className={labelClass}>
              Nominal
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                Rp
              </span>
              <input
                id="txn-amount"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                className={`${inputClass} pl-9 text-right font-semibold tabular-nums`}
                aria-describedby="txn-amount-preview"
              />
            </div>
            <p id="txn-amount-preview" className="mt-1 text-xs text-muted-foreground tabular-nums">
              {nominal > 0 ? formatCurrency(nominal) : "Masukkan nominal dalam rupiah penuh"}
            </p>
          </div>

          <div>
            <label htmlFor="txn-description" className={labelClass}>
              Keterangan
            </label>
            <textarea
              id="txn-description"
              rows={2}
              placeholder="Contoh: Infak Jumat ke-4 September 2026"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="txn-recorder" className={labelClass}>
                Dicatat oleh
              </label>
              <input
                id="txn-recorder"
                type="text"
                value={recordedBy}
                onChange={(e) => setRecordedBy(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="txn-proof" className={labelClass}>
                Tautan bukti <span className="font-normal text-muted-foreground">(opsional)</span>
              </label>
              <input
                id="txn-proof"
                type="text"
                placeholder="https://…"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/[0.06] px-3 py-2 text-sm font-medium text-destructive"
            >
              <Warning className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isSaving}>
            {isSaving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Transaksi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
