"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Trash, UploadSimple } from "@phosphor-icons/react";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const MAX_BYTES = 5 * 1024 * 1024;

// Kolom unggah gambar reusable: pilih file → unggah ke server → tersimpan.
// Nilai yang disimpan adalah URL lokal (`/uploads/...`).
// variant "logo": pratinjau kotak kecil object-contain (cocok untuk logo persegi).
// variant "banner": pratinjau lebar object-cover (cocok untuk foto banner).
export function ImageUploadField({
  label,
  description,
  value,
  onChange,
  variant = "banner",
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (url: string) => void;
  variant?: "banner" | "logo";
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

  const loadLibrary = async (force = false) => {
    if (!force && library !== null) return;
    try {
      const res = await fetch("/api/uploads");
      const data = await res.json().catch(() => null);
      // GET /api/uploads mengembalikan { files: string[] } (URL terbaru dulu).
      const files = res.ok && Array.isArray(data?.files)
        ? (data.files as unknown[]).filter((u): u is string => typeof u === "string")
        : [];
      setLibrary(files);
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
      // Segarkan galeri agar file yang baru diunggah langsung bisa dipilih.
      setLibrary(null);
      void loadLibrary(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah gambar.");
    } finally {
      setIsUploading(false);
    }
  };

  const isLogo = variant === "logo";

  return (
    <div className="space-y-2">
      <div>
        <p className="text-xs font-semibold text-foreground">{label}</p>
        {description && (
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>

      {value ? (
        <div
          className={
            isLogo
              ? "flex items-center gap-3 rounded-xl border border-border bg-background p-3"
              : "relative overflow-hidden rounded-xl border border-border bg-muted/30"
          }
        >
          {isLogo ? (
            <>
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-white p-1.5 shadow-xs">
                <img src={value} alt="Logo terpasang" className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Logo terpasang
                </p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground" title={value}>
                  {value}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-input bg-background px-2.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50">
                    <UploadSimple className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    Ganti logo…
                    <input
                      type="file"
                      accept={ACCEPT}
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        pick(f);
                        // Langsung unggah setelah pilih agar 1 langkah lebih sedikit.
                        if (f) {
                          const form = new FormData();
                          form.append("file", f);
                          if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type)) return;
                          if (f.size > MAX_BYTES) return;
                          setIsUploading(true);
                          fetch("/api/uploads", { method: "POST", body: form })
                            .then(async (res) => {
                              const data = await res.json().catch(() => null);
                              if (!res.ok) throw new Error(data?.error ?? "Gagal mengunggah logo.");
                              onChange(data.url as string);
                              setFile(null);
                              setPreview(null);
                            })
                            .catch((err: Error) => setError(err.message))
                            .finally(() => setIsUploading(false));
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => onChange("")}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <Trash className="h-3.5 w-3.5" />
                    Hapus
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2 rounded-xl border border-dashed border-input bg-background p-3">
          <ol className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <li className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-primary">
              <span className="font-bold">1</span> Pilih file
            </li>
            <li aria-hidden="true">→</li>
            <li className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
              <span className="font-bold">2</span> Unggah
            </li>
            <li aria-hidden="true">→</li>
            <li className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
              <span className="font-bold">3</span> Simpan profil
            </li>
          </ol>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="inline-flex h-9 flex-1 cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-3 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground">
              <UploadSimple className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="truncate">{file ? file.name : isLogo ? "Pilih logo dari perangkat…" : "Pilih gambar dari perangkat…"}</span>
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
                className={
                  isLogo
                    ? "h-12 w-12 shrink-0 rounded-lg border border-border bg-white object-contain p-1"
                    : "h-12 w-20 shrink-0 rounded-lg border border-border object-cover"
                }
              />
            )}
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={upload}
              disabled={!file || isUploading}
              className="shrink-0 text-xs"
            >
              <ImageIcon className="h-3.5 w-3.5" />
              {isUploading ? "Mengunggah..." : isLogo ? "Unggah logo" : "Unggah"}
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-xs font-medium text-destructive">
              {error}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            {isLogo
              ? "PNG transparan bentuk kotak 1:1 (min. 256×256 px). JPG, PNG, WebP, atau GIF — maksimal 5 MB."
              : "JPG, PNG, WebP, atau GIF — maksimal 5 MB. Tanpa gambar, halaman publik menampilkan blok netral."}
          </p>
          <details
            className="rounded-lg border border-border bg-muted/30 px-3 py-2"
            onToggle={(e) => {
              if ((e.target as HTMLDetailsElement).open) loadLibrary();
            }}
          >
            <summary className="cursor-pointer text-xs font-semibold text-foreground">
              atau pilih {isLogo ? "logo" : "foto"} yang sudah diunggah
            </summary>
            <div className={isLogo ? "grid grid-cols-5 gap-2 pt-2 sm:grid-cols-8" : "grid grid-cols-4 gap-2 pt-2 sm:grid-cols-6"}>
              {library === null ? (
                <p className="col-span-full text-[11px] text-muted-foreground">Memuat…</p>
              ) : library.length === 0 ? (
                <p className="col-span-full text-[11px] text-muted-foreground">
                  Belum ada {isLogo ? "logo" : "foto"} di server.
                </p>
              ) : (
                library.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => onChange(url)}
                    className="overflow-hidden rounded-md border border-border bg-white transition-all hover:border-primary hover:ring-2 hover:ring-primary/30"
                    title={url}
                  >
                    <img
                      src={url}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className={isLogo ? "h-12 w-full bg-white object-contain p-1" : "h-12 w-full object-cover"}
                    />
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
