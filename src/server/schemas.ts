// Skema validasi input backend (zod).
// Route handlers tidak percaya body mentah — selalu lewat parse di sini.

import { z } from "zod";

export const transactionInputSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
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
  proofUrl: z
    .string()
    .max(500, "Tautan bukti terlalu panjang.")
    .optional(),
  recordedBy: z
    .string()
    .min(2, "Nama pencatat minimal 2 karakter.")
    .max(100, "Nama pencatat maksimal 100 karakter."),
});

export type TransactionInput = z.infer<typeof transactionInputSchema>;

export const transactionUpdateSchema = transactionInputSchema.partial();

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
  priority: z.enum(["normal", "important", "urgent"], {
    error: "Prioritas harus 'normal', 'important', atau 'urgent'.",
  }),
  author: z.string().min(2, "Nama penulis minimal 2 karakter.").max(100),
  imageUrl: z
    .string()
    .max(500, "Tautan gambar terlalu panjang.")
    .optional()
    .or(z.literal("")),
  publishedAt: z
    .string()
    .datetime({ error: "Tanggal terbit tidak valid (contoh: 2026-09-28T08:00:00.000Z)." })
    .optional(),
});

export type AnnouncementInput = z.infer<typeof announcementInputSchema>;

// ── Kegiatan ─────────────────────────────────────────────────────────────────

export const activityInputSchema = z.object({
  title: z.string().min(5, "Judul kegiatan minimal 5 karakter.").max(160),
  description: z.string().min(10, "Deskripsi minimal 10 karakter.").max(2000),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD."),
  time: z
    .string()
    .regex(/^\d{2}:\d{2}(\s*-\s*\d{2}:\d{2})?$/, "Format waktu harus HH:MM atau HH:MM - HH:MM."),
  location: z.string().min(3, "Lokasi minimal 3 karakter.").max(200),
  organizer: z.string().min(2, "Penyelenggara minimal 2 karakter.").max(100),
  imageUrl: z
    .string()
    .max(500, "Tautan gambar terlalu panjang.")
    .optional()
    .or(z.literal("")),
});

export type ActivityInput = z.infer<typeof activityInputSchema>;

// ── Pengurus / pengguna ──────────────────────────────────────────────────────

export const officialInputSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter.").max(120),
  role: z.string().min(3, "Jabatan minimal 3 karakter.").max(120),
  systemRole: z.enum(["superadmin", "admin", "bendahara", "pengurus"], {
    error: "Peran sistem tidak dikenal.",
  }),
  phone: z.string().min(8, "Nomor telepon minimal 8 digit.").max(25),
  email: z.email("Format email tidak valid.").max(120),
  status: z.enum(["active", "inactive"], { error: "Status harus active atau inactive." }),
  joinedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD."),
  avatar: z
    .string()
    .max(500, "Tautan foto terlalu panjang.")
    .optional()
    .or(z.literal("")),
});

export type OfficialInput = z.infer<typeof officialInputSchema>;

// ── Kategori ───────────────────────────────────────────────────────────────────

export const categoryInputSchema = z.object({
  name: z.string().min(2, "Nama kategori minimal 2 karakter.").max(80),
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
  accountNumber: z.string().max(60).optional().or(z.literal("")),
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
  timezone: z.string().min(3).max(60),
  establishedYear: z
    .number()
    .int()
    .min(1900, "Tahun berdiri minimal 1900.")
    .max(2100, "Tahun berdiri maksimal 2100."),
  description: z.string().min(10, "Deskripsi minimal 10 karakter.").max(2000),
  logoUrl: z.string().max(500).optional().or(z.literal("")),
  coverImageUrl: z.string().max(500).optional().or(z.literal("")),
  heroImages: z.array(z.string().max(500)).max(10, "Maksimal 10 foto slider."),
});

export type MosqueProfileInput = z.infer<typeof mosqueProfileInputSchema>;
