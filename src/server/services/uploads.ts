// Pembersihan berkas unggahan lokal.
//
// File di `public/uploads/` tidak otomatis terhapus saat admin mengganti atau
// menghapus gambar. Helper ini menghapus file HANYA bila URL-nya tidak lagi
// dirujuk oleh profil, pengumuman, kegiatan, pengurus, maupun QRIS. Pemeriksaan
// referensi mencegah satu file yang dipakai di dua tempat ikut terhapus.

import { unlink } from "fs/promises";
import { join } from "path";
import { db } from "../db";

// Hanya nama file aman di dalam /uploads — tolak "../", subfolder, dan query.
const UPLOAD_URL_RE = /^\/uploads\/([A-Za-z0-9][A-Za-z0-9._-]*)$/;

export function uploadFileNameFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = UPLOAD_URL_RE.exec(url.trim());
  if (!match) return null;
  if (!/\.(jpe?g|png|webp|gif)$/i.test(match[1])) return null;
  return match[1];
}

export async function isUploadReferenced(url: string): Promise<boolean> {
  if (!uploadFileNameFromUrl(url)) return false;

  const [profile, announcements, activities, officials, qris] = await Promise.all([
    db.mosqueProfile.findUnique({ where: { id: "main" } }),
    db.announcement.count({ where: { imageUrl: url } }),
    db.activity.count({ where: { imageUrl: url } }),
    db.official.count({ where: { avatar: url } }),
    db.config.findUnique({ where: { key: "qrisImageUrl" } }),
  ]);

  if (announcements + activities + officials > 0) return true;
  if (qris?.value === url) return true;
  if (!profile) return false;
  if (profile.logoUrl === url || profile.coverImageUrl === url) return true;

  const heroImages = Array.isArray(profile.heroImages) ? profile.heroImages : [];
  return heroImages.some((value) => value === url);
}

/**
 * Hapus `/uploads/...` bila tidak lagi dipakai record mana pun.
 * Selalu "best effort": kegagalan pembersihan tidak boleh menggagalkan operasi
 * utama (mis. menyimpan berita).
 */
export async function deleteUploadIfUnused(url: string | null | undefined): Promise<boolean> {
  const name = uploadFileNameFromUrl(url);
  if (!name || !url) return false;

  try {
    if (await isUploadReferenced(url)) return false;
    await unlink(join(process.cwd(), "public", "uploads", name));
    return true;
  } catch (error) {
    console.warn(
      "[uploads] gagal membersihkan",
      url,
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}
