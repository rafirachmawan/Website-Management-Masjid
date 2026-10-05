"use client";

import { useState } from "react";
import { useApi, apiSend } from "@/lib/api";
import type { Category } from "@/types";
import { cn } from "@/lib/utils";
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

const TYPE_META: Record<CatType, { label: string; noun: string }> = {
  income: {
    label: "Kas Masuk",
    noun: "pemasukan",
  },
  expense: {
    label: "Kas Keluar",
    noun: "pengeluaran",
  },
};

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

  // Satu pintu tambah: tipe dipilih di dalam dialog, bukan dua tombol terpisah.
  const openAdd = () => {
    setEditing(null);
    setName("");
    setType("income");
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

  const renderGroup = (t: CatType, items: Category[]) => {
    const meta = TYPE_META[t];
    return (
      <section
        aria-label={`Kategori ${meta.label}`}
        className="rounded-xl border border-border bg-muted/20 p-4"
      >
        <div className="mb-3 flex items-center gap-2">
          <h4 className="text-sm font-semibold text-foreground">{meta.label}</h4>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground">
            {items.length}
          </span>
        </div>
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-background px-3 py-4 text-center text-xs text-muted-foreground">
            Belum ada kategori {meta.noun}. Tambahkan lewat tombol Tambah
            Kategori di atas.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2"
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {c.name}
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title={`Ubah ${c.name}`}
                    aria-label={`Ubah ${c.name}`}
                  >
                    <PencilSimple className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c)}
                    disabled={deletingId === c.id}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                    title={`Hapus ${c.name}`}
                    aria-label={`Hapus ${c.name}`}
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            Daftar Kategori Kas ({categories.length})
          </h4>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Dipakai saat mencatat transaksi. Kategori yang sudah dipakai tidak
            bisa dihapus atau dipindah tipenya.
          </p>
        </div>
        <Button onClick={openAdd} className="gap-1.5 self-start text-xs sm:self-auto">
          <Plus className="h-3.5 w-3.5" />
          Tambah Kategori
        </Button>
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

      <div className="grid gap-4 md:grid-cols-2">
        {renderGroup("income", income)}
        {renderGroup("expense", expense)}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-semibold">
              {editing ? "Ubah Kategori" : "Tambah Kategori"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Perubahan nama otomatis mengikuti ke seluruh transaksi berkategori ini. Tipe kategori dikunci."
                : "Pilih tipe kas, lalu isi nama kategorinya. Kategori baru langsung bisa dipilih saat mencatat transaksi."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!editing && (
              <div>
                <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                  Tipe kas
                </span>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipe kas">
                  {(Object.keys(TYPE_META) as CatType[]).map((t) => {
                    const active = type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setType(t)}
                        className={cn(
                          "flex items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all",
                          active
                            ? "border-primary bg-primary/[0.06] text-foreground ring-2 ring-primary/20"
                            : "border-input bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                        )}
                      >
                        {TYPE_META[t].label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
            {editing && (
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2.5">
                <span className="text-[13px] text-muted-foreground">Tipe (dikunci)</span>
                <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold text-foreground">
                  {type === "income" ? "Kas masuk" : "Kas keluar"}
                </span>
              </div>
            )}
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
