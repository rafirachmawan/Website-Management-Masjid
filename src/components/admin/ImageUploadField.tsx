"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Trash, UploadSimple } from "@phosphor-icons/react";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const MAX_BYTES = 5 * 1024 * 1024;

// Kolom unggah gambar reusable: pilih file → pratinjau → unggah ke server.
// Nilai yang disimpan adalah URL lokal (`/uploads/...`).
export function ImageUploadField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [library, setLibrary] = useState<string[] | null>(null);

  const pick = (f: File | null) => {
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type)) {
      setError("Format file harus JPG, PNG, WebP, atau GIF.");
      setFile(null);
      setPreview(null);
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("Ukuran file maksimal 5 MB.");
      setFile(null);
      setPreview(null);
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const loadLibrary = async () => {
    if (library !== null) return;
    try {
      const res = await fetch("/api/uploads");
      const data = await res.json().catch(() => null);
      setLibrary(res.ok && Array.isArray(data?.files) ? (data.files as string[]) : []);
    } catch {
      setLibrary([]);
    }
  };

  const upload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Gagal mengunggah gambar.");
      onChange(data.url as string);
      if (preview) URL.revokeObjectURL(preview);
      setFile(null);
      setPreview(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah gambar.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-semibold text-foreground">{label}</span>

      {value ? (
        <div className="relative overflow-hidden rounded-lg border border-border bg-muted/30">
          <img src={value} alt="Gambar terpasang" className="h-36 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-red-600/90 text-white shadow-sm transition-colors hover:bg-red-600"
            title="Hapus gambar"
            aria-label="Hapus gambar"
          >
            <Trash className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="inline-flex h-9 flex-1 cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-3 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
              <UploadSimple className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="truncate">{file ? file.name : "Pilih gambar dari perangkat…"}</span>
              <input
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => pick(e.target.files?.[0] ?? null)}
              />
            </label>
            {preview && (
              <img
                src={preview}
                alt="Pratinjau gambar"
                className="h-12 w-20 shrink-0 rounded-lg border border-border object-cover"
              />
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={upload}
              disabled={!file || isUploading}
              className="shrink-0 text-xs"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              {isUploading ? "Mengunggah..." : "Unggah"}
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {error}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            JPG, PNG, WebP, atau GIF — maksimal 5 MB. Tanpa gambar, halaman publik
            menampilkan blok netral.
          </p>
          <details
            className="rounded-lg border border-border bg-muted/30 px-3 py-2"
            onToggle={(e) => {
              if ((e.target as HTMLDetailsElement).open) loadLibrary();
            }}
          >
            <summary className="cursor-pointer text-xs font-semibold text-foreground">
              atau pilih foto yang sudah diunggah
            </summary>
            <div className="grid grid-cols-4 gap-2 pt-2 sm:grid-cols-6">
              {library === null ? (
                <p className="col-span-full text-[11px] text-muted-foreground">Memuat…</p>
              ) : library.length === 0 ? (
                <p className="col-span-full text-[11px] text-muted-foreground">
                  Belum ada foto di server.
                </p>
              ) : (
                library.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => onChange(url)}
                    className="overflow-hidden rounded-md border border-border transition-all hover:border-primary hover:ring-2 hover:ring-primary/30"
                    title={url}
                  >
                    <img src={url} alt="" aria-hidden="true" loading="lazy" className="h-12 w-full object-cover" />
                  </button>
                ))
              )}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
