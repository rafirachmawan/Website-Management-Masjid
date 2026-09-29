// SELURUH DATA DUMMY/MOCKUP TELAH DIHAPUS.
// Sumber kebenaran satu-satunya = database (prisma/dev.db) yang diisi
// lewat halaman /admin (Profil, Transaksi + Kategori, Pengumuman,
// Kegiatan, Pengurus, Jadwal Sholat).
//
// File ini dipertahankan sebagai stub agar import lama tidak rusak.
// Jangan menambahkan data contoh di sini.

import type {
  MosqueProfile,
  Transaction,
  Category,
  Announcement,
  Activity,
  DailyPrayerSchedule,
  Official,
} from "../src/types";

export const mosqueProfile: MosqueProfile | null = null;

export const categories: Category[] = [];

export const transactions: Transaction[] = [];

export const announcements: Announcement[] = [];

export const activities: Activity[] = [];

export const prayerSchedule: DailyPrayerSchedule | null = null;

export const weeklyPrayerSchedule: DailyPrayerSchedule[] = [];

export const officials: Official[] = [];
