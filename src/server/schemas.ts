// Skema validasi input backend (zod).
// Route handlers tidak percaya body mentah — selalu lewat parse di sini.

import { z } from "zod";
import { POSITIONS, normalizePosition } from "@/lib/positions";

// ── Helper validasi bersama ────────────────────────────────────────────────
// Tanggal string YYYY-MM-DD harus kalender nyata (menolak 2026-02-30, 2026-13-40).
export function isRealDateString(v: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export const dateStringSchema = (msg = "Format tanggal harus YYYY-MM-DD.") =>
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, msg).refine(isRealDateString, {
    message: "Tanggal tidak valid pada kalender (contoh: 2026-02-30 tidak ada).",
  });

// URL opsional untuk bukti/gambar: boleh kosong, path lokal /..., atau http(s)://...
// Menolak javascript:, data:, dan skema lain agar tidak jadi stored-XSS.
function isSafeUrl(v: string): boolean {
  if (v === "") return true;
  if (v.length > 500) return false;
  if (v.startsWith("/")) return !v.startsWith("//") && !/[<>"\s]/.test(v);
  try {
    const u = new URL(v);
    return (u.protocol === "http:" || u.protocol === "https:") && !/[<>"\s]/.test(v);
  } catch {
    return false;
  }
}

export const optionalUrlSchema = (msg = "Tautan harus berupa URL http(s):// atau path / yang valid.") =>
  z.string().max(500, "Tautan terlalu panjang (maks 500 karakter).").optional().refine(
    (v) => v === undefined || isSafeUrl(v),
    { message: msg },
  );

function isValidTimeToken(t: string): boolean {
  const m = /^(\d{2}):(\d{2})$/.exec(t.trim());
  if (!m) return false;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h >= 0 && h <= 23 && min >= 0 && min <= 59;
}

function isValidTimeRange(v: string): boolean {
  const parts = v.split(/\s*-\s*/);
  if (parts.length === 1) return isValidTimeToken(parts[0]);
  if (parts.length === 2) return isValidTimeToken(parts[0]) && isValidTimeToken(parts[1]);
  return false;
}

function isValidTimezone(v: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: v });
    return true;
  } catch {
    return false;
  }
}

export const transactionInputSchema = z.object({
  date: dateStringSchema("Format tanggal harus YYYY-MM-DD"),
  type: z.enum(["income", "expense"], {
    error: "Tipe transaksi harus 'income' (kas masuk) atau 'expense' (kas keluar).",
  }),
  categoryId: z.string().min(1, "Kategori wajib dipilih."),
  amount: z
    .number({ error: "Nominal harus berupa angka." })
    .int("Nominal harus bilangan bulat rupiah, tanpa titik desimal.")
    .positive("Nominal harus lebih dari nol.")
    .max(100_000_000_000, "Nominal terlalu besar, periksa kembali pencatatan."),
  description: z
    .string()
    .min(3, "Keterangan minimal 3 karakter.")
    .max(500, "Keterangan maksimal 500 karakter."),
  proofUrl: optionalUrlSchema("Tautan bukti harus berupa URL http(s):// atau path / yang valid."),
  recordedBy: z
    .string()
    .min(2, "Nama pencatat minimal 2 karakter.")
    .max(100, "Nama pencatat maksimal 100 karakter."),
});

export type TransactionInput = z.infer<typeof transactionInputSchema>;

export const transactionUpdateSchema = transactionInputSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: "Tidak ada perubahan — kirim minimal satu field yang diubah.",
  });

export type TransactionUpdate = z.infer<typeof transactionUpdateSchema>;

// ── Pengumuman ───────────────────────────────────────────────────────────────

export const announcementInputSchema = z.object({
  title: z
    .string()
    .min(5, "Judul pengumuman minimal 5 karakter.")
    .max(160, "Judul pengumuman maksimal 160 karakter."),
  content: z
    .string()
    .min(10, "Isi pengumuman minimal 10 karakter.")
    .max(5000, "Isi pengumuman maksimal 5.000 karakter."),
  priority: z.enum(["normal", "important"], {
    error: "Prioritas harus 'normal' (Biasa) atau 'important' (Penting).",
  }),
  author: z.string().min(2, "Nama penulis minimal 2 karakter.").max(100),
  imageUrl: z
    .string()
    .max(500, "Tautan gambar terlalu panjang.")
    .optional()
    .or(z.literal(""))
    .refine((v) => v === undefined || isSafeUrl(v), {
      message: "Tautan gambar harus berupa URL http(s):// atau path / yang valid.",
    }),
  publishedAt: z
    .string()
    .datetime({ error: "Tanggal terbit tidak valid (contoh: 2026-09-28T08:00:00.000Z)." })
    .refine((v) => v === undefined || !Number.isNaN(new Date(v).getTime()), {
      message: "Tanggal terbit tidak valid.",
    })
    .optional(),
});

export type AnnouncementInput = z.infer<typeof announcementInputSchema>;

// ── Kegiatan ─────────────────────────────────────────────────────────────────

export const activityInputSchema = z.object({
  title: z.string().min(5, "Judul kegiatan minimal 5 karakter.").max(160),
  description: z.string().min(10, "Deskripsi minimal 10 karakter.").max(2000),
  date: dateStringSchema("Format tanggal harus YYYY-MM-DD."),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}(\s*-\s*\d{2}:\d{2})?$/, "Format waktu harus HH:MM atau HH:MM - HH:MM.")
    .refine(isValidTimeRange, {
      message: "Jam tidak valid (gunakan 00:00–23:59, contoh: 08:00 - 10:00).",
    }),
  location: z.string().min(3, "Lokasi minimal 3 karakter.").max(200),
  organizer: z.string().min(2, "Penyelenggara minimal 2 karakter.").max(100),
  imageUrl: z
    .string()
    .max(500, "Tautan gambar terlalu panjang.")
    .optional()
    .or(z.literal(""))
    .refine((v) => v === undefined || isSafeUrl(v), {
      message: "Tautan gambar harus berupa URL http(s):// atau path / yang valid.",
    }),
});

export type ActivityInput = z.infer<typeof activityInputSchema>;

// ── Pengurus / pengguna ──────────────────────────────────────────────────────

export const officialInputSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter.").max(120),
  // Jabatan dipetakan ke nilai kanonik supaya data lama ("Bendahara")
  // otomatis menjadi "Bendahara DKM" dan teks bebas tidak bisa masuk lagi.
  role: z
    .string()
    .transform((v) => normalizePosition(v))
    .pipe(z.enum(POSITIONS.map((p) => p.value), { error: "Jabatan tidak dikenal." })),
  systemRole: z.enum(["superadmin", "admin", "bendahara", "pengurus"], {
    error: "Peran sistem tidak dikenal.",
  }),
  phone: z
    .string()
    .min(8, "Nomor telepon minimal 8 digit.")
    .max(25)
    .regex(/^[+0-9][0-9\s\-().]*$/, "Nomor telepon hanya boleh berisi angka, spasi, dan + - ( ) ."),
  email: z
    .email("Format email tidak valid.")
    .max(120)
    .transform((v) => v.trim().toLowerCase()),
  status: z.enum(["active", "inactive"], { error: "Status harus active atau inactive." }),
  joinedDate: dateStringSchema("Format tanggal harus YYYY-MM-DD."),
  avatar: z
    .string()
    .max(500, "Tautan foto terlalu panjang.")
    .optional()
    .or(z.literal(""))
    .refine((v) => v === undefined || isSafeUrl(v), {
      message: "Tautan foto harus berupa URL http(s):// atau path / yang valid.",
    }),
});

export type OfficialInput = z.infer<typeof officialInputSchema>;

// ── Kategori ───────────────────────────────────────────────────────────────────

export const categoryInputSchema = z.object({
  name: z
    .string()
    .min(2, "Nama kategori minimal 2 karakter.")
    .max(80)
    .refine((v) => v.trim().length >= 2, {
      message: "Nama kategori minimal 2 karakter (tanpa spasi kosong).",
    })
    .transform((v) => v.trim()),
  type: z.enum(["income", "expense"], {
    error: "Tipe kategori harus 'income' (kas masuk) atau 'expense' (kas keluar).",
  }),
  icon: z.string().max(60).optional().or(z.literal("")),
  color: z.string().max(60).optional().or(z.literal("")),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

// ── Konfigurasi aplikasi (rekening & preferensi) ─────────────────────────────

export const appConfigInputSchema = z.object({
  bankName: z.string().max(120).optional().or(z.literal("")),
  accountNumber: z
    .string()
    .max(60)
    .optional()
    .or(z.literal(""))
    .refine((v) => v === undefined || v === "" || /^[0-9][0-9\s-]*$/.test(v.trim()), {
      message: "Nomor rekening hanya boleh berisi angka, spasi, dan strip.",
    }),
  accountHolder: z.string().max(120).optional().or(z.literal("")),
  minBalanceAlert: z.number().int().min(0).max(100_000_000_000).optional(),
  publicTransparency: z.boolean().optional(),
  showDonationQRIS: z.boolean().optional(),
});

export type AppConfigInput = z.infer<typeof appConfigInputSchema>;

// ── Profil masjid ────────────────────────────────────────────────────────────

export const mosqueProfileInputSchema = z.object({
  name: z.string().min(3, "Nama masjid minimal 3 karakter.").max(120),
  shortName: z.string().min(2, "Nama singkat minimal 2 karakter.").max(40),
  address: z.string().min(10, "Alamat minimal 10 karakter.").max(400),
  phone: z.string().min(8, "Nomor telepon minimal 8 digit.").max(25),
  email: z.email("Format email tidak valid.").max(120),
  latitude: z.number().min(-90, "Lintang harus antara -90 dan 90.").max(90),
  longitude: z.number().min(-180, "Bujur harus antara -180 dan 180.").max(180),
  timezone: z
    .string()
    .min(3)
    .max(60)
    .refine(isValidTimezone, {
      message: "Zona waktu tidak dikenal (gunakan nama IANA, contoh: Asia/Jakarta).",
    }),
  establishedYear: z
    .number()
    .int()
    .min(1900, "Tahun berdiri minimal 1900.")
    .max(2100, "Tahun berdiri maksimal 2100."),
  description: z.string().min(10, "Deskripsi minimal 10 karakter.").max(2000),
  logoUrl: z
    .string()
    .max(500)
    .optional()
    .or(z.literal(""))
    .refine((v) => v === undefined || isSafeUrl(v), {
      message: "Tautan logo harus berupa URL http(s):// atau path / yang valid.",
    }),
  coverImageUrl: z
    .string()
    .max(500)
    .optional()
    .or(z.literal(""))
    .refine((v) => v === undefined || isSafeUrl(v), {
      message: "Tautan sampul harus berupa URL http(s):// atau path / yang valid.",
    }),
  heroImages: z
    .array(
      z
        .string()
        .max(500)
        .refine(isSafeUrl, {
          message: "Setiap foto slider harus berupa URL http(s):// atau path / yang valid.",
        }),
    )
    .max(10, "Maksimal 10 foto slider."),
});

export type MosqueProfileInput = z.infer<typeof mosqueProfileInputSchema>;

// PATCH parsial profil — minimal satu field, tiap field ikut aturan yang sama.
export const mosqueProfileUpdateSchema = mosqueProfileInputSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: "Tidak ada perubahan — kirim minimal satu field yang diubah.",
  });

export type MosqueProfileUpdate = z.infer<typeof mosqueProfileUpdateSchema>;
