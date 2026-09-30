"use client";

import { useState } from "react";
import { useApi, apiSend } from "@/lib/api";
import type { Category } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, PencilSimple, Trash, Warning } from "@phosphor-icons/react";

type CatType = "income" | "expense";

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30";

export function CategoryManager() {
  const { data: fetched, refresh } = useApi<Category[]>("/api/categories");
  const categories = fetched ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<CatType>("income");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAdd = (t: CatType) => {
    setEditing(null);
    setName("");
    setType(t);
    setError(null);
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setType(c.type);
    setError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      // Tipe dikunci dari luar dialog: tombol "Tambah" di grup Kas Masuk
      // selalu jadi income, di grup Kas Keluar selalu jadi expense.
      // Mode ubah hanya ganti nama — tipe tidak dikirim agar kategori yang
      // sudah dipakai transaksi tidak berisiko pindah tipe.
      if (editing) {
        await apiSend(`/api/categories/${editing.id}`, "PUT", { name: name.trim() });
      } else {
        await apiSend("/api/categories", "POST", { name: name.trim(), type });
      }
      setDialogOpen(false);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan kategori.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Category) => {
    if (!window.confirm(`Hapus kategori "${c.name}"? Kategori yang masih dipakai transaksi tidak bisa dihapus.`)) return;
    setDeletingId(c.id);
    setError(null);
    try {
      await apiSend(`/api/categories/${c.id}`, "DELETE");
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus kategori.");
    } finally {
      setDeletingId(null);
    }
  };

  const income = categories.filter((c) => c.type === "income");
  const expense = categories.filter((c) => c.type === "expense");

  const renderGroup = (title: string, items: Category[], t: CatType) => (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold text-foreground">
          {title} ({items.length})
        </h4>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => openAdd(t)}>
          <Plus className="h-3.5 w-3.5" />
          Tambah
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          Belum ada kategori {t === "income" ? "pemasukan" : "pengeluaran"}. Tambahkan lewat tombol di atas —
          transaksi baru membutuhkan kategori.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((c) => (
            <span
              key={c.id}
              className={
                t === "income"
                  ? "inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-500/10 py-1 pr-1 pl-3 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                  : "inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-500/10 py-1 pr-1 pl-3 text-xs font-medium text-red-700 dark:text-red-400"
              }
            >
              {c.name}
              <button
                type="button"
                onClick={() => openEdit(c)}
                className="flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-black/10"
                title={`Ubah ${c.name}`}
                aria-label={`Ubah ${c.name}`}
              >
                <PencilSimple className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(c)}
                disabled={deletingId === c.id}
                className="flex h-5 w-5 items-center justify-center rounded-full transition-colors hover:bg-black/10 disabled:opacity-50"
                title={`Hapus ${c.name}`}
                aria-label={`Hapus ${c.name}`}
              >
                <Trash className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-foreground">Daftar Kategori Kas ({categories.length})</h4>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Kategori dipakai saat mencatat transaksi. Kategori yang sudah dipakai transaksi tidak bisa
          dihapus atau dipindah tipenya.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/[0.06] px-3 py-2 text-xs font-medium text-destructive"
        >
          <Warning className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {renderGroup("Kas Masuk", income, "income")}
      {renderGroup("Kas Keluar", expense, "expense")}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-semibold">
              {editing
                ? "Ubah Kategori"
                : type === "income"
                  ? "Tambah Kategori Kas Masuk"
                  : "Tambah Kategori Kas Keluar"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Perubahan nama otomatis mengikuti ke seluruh transaksi berkategori ini. Tipe kategori dikunci."
                : type === "income"
                  ? "Kategori baru langsung bisa dipilih saat mencatat kas masuk."
                  : "Kategori baru langsung bisa dipilih saat mencatat kas keluar."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="cat-name" className="mb-1.5 block text-[13px] font-semibold text-foreground">
                Nama kategori
              </label>
              <input
                id="cat-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Infak & Sedekah"
                className={inputClass}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2.5">
              <span className="text-[13px] text-muted-foreground">
                {editing ? "Tipe (dikunci)" : "Akan disimpan sebagai"}
              </span>
              <span
                className={
                  type === "income"
                    ? "inline-flex items-center rounded-full border border-emerald-200 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400"
                    : "inline-flex items-center rounded-full border border-red-200 bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:text-red-400"
                }
              >
                {type === "income" ? "Kas masuk" : "Kas keluar"}
              </span>
            </div>
            {error && (
              <p role="alert" className="text-xs font-medium text-destructive">
                {error}
              </p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={name.trim().length < 2 || saving}>
              {saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah Kategori"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
